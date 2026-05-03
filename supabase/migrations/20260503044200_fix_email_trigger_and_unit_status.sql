-- ============================================================================
-- MIGRATION: Fix Email Trigger and Unit Status on Accept
-- Purpose: 
--   1. Add webhook trigger to call edge function when application is accepted
--   2. Change accept_application to mark unit as OCCUPIED immediately
-- ============================================================================

-- ============================================================================
-- PART 1: Create webhook caller function using pg_net (Supabase extension)
-- ============================================================================

-- Note: pg_net is a Supabase extension that allows HTTP requests from PostgreSQL
-- This enables calling the Edge Function when application status changes

CREATE OR REPLACE FUNCTION public.call_application_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_url text;
  v_webhook_secret text;
  v_payload jsonb;
BEGIN
  -- Only process when status changes from WAITING to ACCEPTED or REJECTED
  IF OLD.status = 'WAITING' AND NEW.status IN ('ACCEPTED', 'REJECTED') THEN
    
    -- Get webhook URL from app config or use default
    -- The edge function URL is: https://<project-ref>.supabase.co/functions/v1/application-status-email
    v_webhook_url := COALESCE(
      current_setting('app.settings.webhook_url', true),
      'http://localhost:54321/functions/v1/application-status-email'
    );
    
    v_webhook_secret := COALESCE(
      current_setting('app.settings.webhook_secret', true),
      ''
    );
    
    -- Build payload matching what the edge function expects
    v_payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'tenant_applications',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'status', NEW.status,
        'property_id', NEW.property_id,
        'assigned_unit_id', NEW.assigned_unit_id,
        'rejection_reason', NEW.rejection_reason
      ),
      'old_record', jsonb_build_object(
        'id', OLD.id,
        'status', OLD.status
      )
    );
    
    -- Use pg_net to make async HTTP request if available, otherwise log for external processor
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        -- Make async HTTP POST request using pg_net
        PERFORM net.http_post(
          url := v_webhook_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', v_webhook_secret
          ),
          body := v_payload
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block the transaction
      RAISE WARNING 'Failed to call email webhook: %', SQLERRM;
    END;
    
    -- Always log the status change for audit/debugging
    RAISE NOTICE 'Application % status changed: % -> % (email webhook triggered)', 
      NEW.id, OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 2: Create the webhook trigger
-- ============================================================================

-- Drop existing trigger if any (to avoid conflicts)
DROP TRIGGER IF EXISTS trg_call_email_webhook ON public.tenant_applications;

-- Create new trigger that calls the webhook function
CREATE TRIGGER trg_call_email_webhook
  AFTER UPDATE OF status ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.call_application_email_webhook();

-- ============================================================================
-- PART 3: Update accept_application to mark unit as OCCUPIED immediately
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_application(
  p_application_id uuid,
  p_assigned_unit_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caretaker_user_id uuid := auth.uid();
  v_application public.tenant_applications%ROWTYPE;
  v_caretaker public.employees%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_unit public.units%ROWTYPE;
  v_new_tenant_id uuid;
  v_lease_id uuid;
  v_default_end_date date;
BEGIN
  v_default_end_date := COALESCE(p_end_date, CURRENT_DATE + INTERVAL '1 year');
  
  -- Get application (must be WAITING)
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id AND status = 'WAITING';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not in WAITING status');
  END IF;
  
  -- Verify caretaker authorization
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this property');
    END IF;
  END IF;
  
  -- Validate unit
  IF p_assigned_unit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit must be assigned');
  END IF;
  
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_assigned_unit_id AND property_id = v_application.property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid unit');
  END IF;
  
  IF v_unit.availability_status = 'OCCUPIED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit already occupied');
  END IF;
  
  SELECT * INTO v_property FROM public.properties WHERE id = v_application.property_id;
  
  -- Create tenant
  INSERT INTO public.tenants (
    user_id, full_name, phone_number, whatsapp_number, registration_number,
    email, property_id, unit_id, room_number, caretaker_employee_id,
    caretaker_user_id, move_in_date, status, created_at, updated_at
  ) VALUES (
    NULL, v_application.full_name, v_application.phone_number,
    v_application.whatsapp_number, v_application.registration_number,
    v_application.email, v_application.property_id, p_assigned_unit_id,
    v_unit.room_number, v_caretaker.id, v_caretaker_user_id, p_start_date,
    'PENDING_SETUP', now(), now()
  )
  RETURNING id INTO v_new_tenant_id;
  
  -- Create lease
  INSERT INTO public.leases (
    tenant_id, unit_id, property_id, lease_number, start_date, end_date,
    rent_amount, deposit_amount, status, created_at, updated_at
  ) VALUES (
    v_new_tenant_id, p_assigned_unit_id, v_application.property_id,
    'LS-' || substr(v_new_tenant_id::text, 1, 8), p_start_date, v_default_end_date,
    v_unit.base_price, COALESCE(v_unit.deposit_amount, 0), 'ACTIVE', now(), now()
  )
  RETURNING id INTO v_lease_id;
  
  -- Update unit to OCCUPIED immediately (FIXED: was RESERVED/TAKEN)
  UPDATE public.units
  SET availability_status = 'OCCUPIED', status = 'TAKEN', updated_at = now()
  WHERE id = p_assigned_unit_id;
  
  -- Update application
  UPDATE public.tenant_applications
  SET status = 'ACCEPTED', assigned_unit_id = p_assigned_unit_id,
      converted_tenant_id = v_new_tenant_id, updated_at = now()
  WHERE id = p_application_id;
  
  RETURN jsonb_build_object(
    'success', true, 'tenantId', v_new_tenant_id, 'leaseId', v_lease_id,
    'message', 'Application accepted. Unit marked as occupied. Email will be sent to applicant.'
  );
END;
$$;

-- ============================================================================
-- PART 4: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.accept_application(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_application_email_webhook() TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON FUNCTION public.call_application_email_webhook() IS 
  'Trigger function that calls the application-status-email edge function when application status changes from WAITING to ACCEPTED or REJECTED';

COMMENT ON FUNCTION public.accept_application(uuid, uuid, date, date) IS 
  'Accepts an application and immediately marks the assigned unit as OCCUPIED';
