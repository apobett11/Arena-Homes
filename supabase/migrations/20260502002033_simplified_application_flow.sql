-- ============================================================================
-- MIGRATION: Simplified Application Flow (WAITING → ACCEPTED/REJECTED)
-- Purpose: Remove complex pipeline, only 3 statuses
-- Flow: WAITING → caretaker approves → ACCEPTED (email sent, tenant created)
-- Flow: WAITING → caretaker rejects → REJECTED (email sent, app deleted)
-- Date: May 2, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: Simplify Application Status Enum
-- ============================================================================

-- Create new simplified enum
DO $$
BEGIN
  -- Drop old enum if exists (cascade to fix columns)
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    -- First update any existing applications to valid new statuses
    UPDATE public.tenant_applications 
    SET status = 'WAITING' 
    WHERE status NOT IN ('WAITING', 'ACCEPTED', 'REJECTED');
    
    -- Rename old enum
    ALTER TYPE public.application_status RENAME TO application_status_old;
  END IF;

  -- Create new simplified enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('WAITING', 'ACCEPTED', 'REJECTED');
  END IF;
END $$;

-- Update the table to use new enum
DO $$
BEGIN
  -- Alter column to use new enum
  ALTER TABLE public.tenant_applications 
  ALTER COLUMN status TYPE public.application_status 
  USING (
    CASE status::text
      WHEN 'PENDING' THEN 'WAITING'::public.application_status
      WHEN 'CARETAKER_APPROVED' THEN 'WAITING'::public.application_status
      WHEN 'APPROVED' THEN 'ACCEPTED'::public.application_status
      WHEN 'ACCEPTED' THEN 'ACCEPTED'::public.application_status
      WHEN 'REJECTED' THEN 'REJECTED'::public.application_status
      WHEN 'CANCELLED' THEN 'REJECTED'::public.application_status
      ELSE 'WAITING'::public.application_status
    END
  );
  
  -- Drop old enum
  DROP TYPE IF EXISTS public.application_status_old;
EXCEPTION WHEN OTHERS THEN
  -- If column already uses new enum, just drop old
  DROP TYPE IF EXISTS public.application_status_old;
END $$;

-- ============================================================================
-- PART 2: Remove Old Email/Visit Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trg_notify_application_response ON public.tenant_applications;
DROP FUNCTION IF EXISTS public.notify_application_response();
DROP FUNCTION IF EXISTS public.send_application_email(text, text, jsonb);
DROP FUNCTION IF EXISTS public.confirm_application_visit(uuid, text);

-- ============================================================================
-- PART 3: Create Tenant Setup Tokens Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  application_id uuid NOT NULL REFERENCES public.tenant_applications(id) ON DELETE CASCADE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_setup_tokens_hash ON public.tenant_setup_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_setup_tokens_application ON public.tenant_setup_tokens(application_id);

-- Enable RLS
ALTER TABLE public.tenant_setup_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_setup_tokens_service_only ON public.tenant_setup_tokens
  FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- PART 4: Simplified Accept Application Function
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
  
  -- Get the application (must be in WAITING status)
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id AND status = 'WAITING';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not in WAITING status');
  END IF;
  
  -- Verify caretaker is assigned to this property (or is admin)
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this property');
    END IF;
  END IF;
  
  -- Validate unit assignment
  IF p_assigned_unit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit must be assigned');
  END IF;
  
  -- Get and validate unit
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_assigned_unit_id AND property_id = v_application.property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid unit');
  END IF;
  
  IF v_unit.availability_status = 'OCCUPIED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit already occupied');
  END IF;
  
  -- Get property
  SELECT * INTO v_property
  FROM public.properties
  WHERE id = v_application.property_id;
  
  -- Create tenant record (ACTIVE immediately - user sets password via email)
  INSERT INTO public.tenants (
    user_id,
    full_name,
    phone_number,
    whatsapp_number,
    registration_number,
    email,
    property_id,
    unit_id,
    room_number,
    caretaker_employee_id,
    caretaker_user_id,
    move_in_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    NULL, -- Will be set when user creates password
    v_application.full_name,
    v_application.phone_number,
    v_application.whatsapp_number,
    v_application.registration_number,
    v_application.email,
    v_application.property_id,
    p_assigned_unit_id,
    v_unit.room_number,
    v_caretaker.id,
    v_caretaker_user_id,
    p_start_date,
    'PENDING_SETUP', -- Waiting for password setup
    now(),
    now()
  )
  RETURNING id INTO v_new_tenant_id;
  
  -- Create lease
  INSERT INTO public.leases (
    tenant_id,
    unit_id,
    property_id,
    lease_number,
    start_date,
    end_date,
    rent_amount,
    deposit_amount,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_new_tenant_id,
    p_assigned_unit_id,
    v_application.property_id,
    'LS-' || substr(v_new_tenant_id::text, 1, 8),
    p_start_date,
    v_default_end_date,
    v_unit.base_price,
    COALESCE(v_unit.deposit_amount, 0),
    'PENDING',
    now(),
    now()
  )
  RETURNING id INTO v_lease_id;
  
  -- Update unit to reserved
  UPDATE public.units
  SET availability_status = 'RESERVED',
      status = 'TAKEN',
      updated_at = now()
  WHERE id = p_assigned_unit_id;
  
  -- Update application to ACCEPTED
  UPDATE public.tenant_applications
  SET status = 'ACCEPTED',
      assigned_unit_id = p_assigned_unit_id,
      converted_tenant_id = v_new_tenant_id,
      approved_at = now(),
      approved_by = v_caretaker_user_id,
      updated_at = now()
  WHERE id = p_application_id;
  
  -- Trigger will fire webhook to send congratulations email
  
  RETURN jsonb_build_object(
    'success', true,
    'tenantId', v_new_tenant_id,
    'leaseId', v_lease_id,
    'message', 'Application accepted. Congratulations email will be sent to applicant.'
  );
END;
$$;

-- ============================================================================
-- PART 5: Simplified Reject Application Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_application(
  p_application_id uuid,
  p_reason text DEFAULT 'Unfortunately, all available units are currently occupied or your application did not meet our current requirements.'
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
BEGIN
  -- Get the application (must be in WAITING status)
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
  
  -- Update to REJECTED (triggers webhook to send rejection email)
  UPDATE public.tenant_applications
  SET status = 'REJECTED',
      rejected_at = now(),
      rejected_by = v_caretaker_user_id,
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_application_id;
  
  -- Return success (application will be deleted by Edge Function after email sent)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application rejected. Rejection email will be sent to applicant.'
  );
END;
$$;

-- ============================================================================
-- PART 6: Function to Verify Setup Token and Set Password
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_setup_token_and_set_password(
  p_raw_token text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record public.tenant_setup_tokens%ROWTYPE;
  v_application public.tenant_applications%ROWTYPE;
  v_existing_user_id uuid;
  v_new_user_id uuid;
BEGIN
  -- Validate password
  IF p_new_password IS NULL OR length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  -- Find valid token
  SELECT * INTO v_token_record
  FROM public.tenant_setup_tokens
  WHERE token_hash = encode(digest(p_raw_token, 'sha256'), 'hex')
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired setup link');
  END IF;
  
  -- Get application
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = v_token_record.application_id;
  
  IF NOT FOUND OR v_application.status != 'ACCEPTED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not accepted');
  END IF;
  
  -- Check if user exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = v_application.email;
  
  IF v_existing_user_id IS NOT NULL THEN
    -- Update password
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_existing_user_id;
    v_new_user_id := v_existing_user_id;
  ELSE
    -- Create new auth user
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_application.email,
      crypt(p_new_password, gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'TENANT'),
      jsonb_build_object('full_name', v_application.full_name),
      now(),
      now()
    )
    RETURNING id INTO v_new_user_id;
    
    -- Create profile
    INSERT INTO public.profiles (
      user_id, role_id, email, full_name, phone_number,
      assigned_property_id, assigned_unit_id, is_active, created_at, updated_at
    ) VALUES (
      v_new_user_id,
      'TENANT',
      v_application.email,
      v_application.full_name,
      v_application.phone_number,
      v_application.property_id,
      v_application.assigned_unit_id,
      true,
      now(),
      now()
    );
  END IF;
  
  -- Update application
  UPDATE public.tenant_applications
  SET converted_user_id = v_new_user_id,
      updated_at = now()
  WHERE id = v_application.id;
  
  -- Mark token used
  UPDATE public.tenant_setup_tokens
  SET used_at = now()
  WHERE id = v_token_record.id;
  
  -- Activate tenant
  UPDATE public.tenants
  SET user_id = v_new_user_id,
      status = 'ACTIVE',
      updated_at = now()
  WHERE id = v_application.converted_tenant_id;
  
  -- Update lease to active
  UPDATE public.leases
  SET status = 'ACTIVE',
      updated_at = now()
  WHERE tenant_id = v_application.converted_tenant_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'userId', v_new_user_id,
    'message', 'Password set successfully. You can now log in.'
  );
END;
$$;

-- ============================================================================
-- PART 7: Database Webhook Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_application_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger on status changes
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  
  -- Only trigger for WAITING → ACCEPTED/REJECTED transitions
  IF OLD.status = 'WAITING' AND NEW.status IN ('ACCEPTED', 'REJECTED') THEN
    -- Webhook will be called by Supabase Database Webhooks
    RAISE NOTICE 'Application % status changed: % → %', NEW.id, OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_status_webhook ON public.tenant_applications;
CREATE TRIGGER trg_application_status_webhook
  AFTER UPDATE OF status ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_application_status_webhook();

-- ============================================================================
-- PART 8: Clean Up Old Columns and Grant Permissions
-- ============================================================================

-- Drop old columns no longer needed
ALTER TABLE public.tenant_applications 
DROP COLUMN IF EXISTS temporary_password,
DROP COLUMN IF EXISTS password_changed_at,
DROP COLUMN IF EXISTS onboarding_completed_at,
DROP COLUMN IF EXISTS visit_status,
DROP COLUMN IF EXISTS visit_confirmed_at,
DROP COLUMN IF EXISTS visit_notes,
DROP COLUMN IF EXISTS conversion_status,
DROP COLUMN IF EXISTS caretaker_approved;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_application(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO authenticated;

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON TABLE public.tenant_applications IS 'Simplified application flow: WAITING → ACCEPTED/REJECTED';
COMMENT ON FUNCTION public.accept_application IS 'Accept application: WAITING→ACCEPTED, creates tenant, sends congratulations email';
COMMENT ON FUNCTION public.reject_application IS 'Reject application: WAITING→REJECTED, sends rejection email';
COMMENT ON FUNCTION public.verify_setup_token_and_set_password IS 'Verify setup token from email, create auth user with password, activate tenant';

-- ============================================================================
-- COMPLETION
-- ============================================================================
