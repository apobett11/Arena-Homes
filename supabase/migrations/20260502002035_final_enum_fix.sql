-- ============================================================================
-- MIGRATION: Final Enum Fix - Comprehensive Database Cleanup
-- Purpose: Fix enum issues and establish clean 3-status workflow
-- Date: May 2, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: Emergency cleanup - Drop everything and start fresh
-- ============================================================================

-- Drop views that depend on the status column
DROP VIEW IF EXISTS public.caretaker_dashboard_view CASCADE;
DROP VIEW IF EXISTS public.property_summary_view CASCADE;

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trg_application_status_webhook ON public.tenant_applications;
DROP TRIGGER IF EXISTS trg_notify_application_response ON public.tenant_applications;

-- Drop all related functions (they depend on enum)
DROP FUNCTION IF EXISTS public.reject_application(uuid, text);
DROP FUNCTION IF EXISTS public.verify_setup_token_and_set_password(text, text);
DROP FUNCTION IF EXISTS public.approve_application_and_create_tenant(uuid, uuid, date, date);
DROP FUNCTION IF EXISTS public.approve_application_and_create_tenant(uuid, uuid);
DROP FUNCTION IF EXISTS public.approve_application(uuid, uuid, date, date);
DROP FUNCTION IF EXISTS public.reject_application(uuid);
DROP FUNCTION IF EXISTS public.confirm_application_visit(uuid, text);
DROP FUNCTION IF EXISTS public.get_tenant_onboarding_status();
DROP FUNCTION IF EXISTS public.complete_onboarding_step(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.send_application_email(text, text, jsonb);
DROP FUNCTION IF EXISTS public.notify_application_response();
DROP FUNCTION IF EXISTS public.trigger_application_status_webhook();

-- Drop helper tables
DROP TABLE IF EXISTS public.tenant_setup_tokens CASCADE;

-- ============================================================================
-- PART 2: Fix the enum properly
-- ============================================================================

-- Step 1: Convert column to text to break dependency
DO $$
BEGIN
  -- Check if column exists and convert to text
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'tenant_applications' AND column_name = 'status') THEN
    
    -- Get current column type
    DECLARE
      v_col_type text;
    BEGIN
      SELECT data_type INTO v_col_type
      FROM information_schema.columns
      WHERE table_name = 'tenant_applications' AND column_name = 'status';
      
      -- Only convert if it's not already text
      IF v_col_type != 'text' THEN
        ALTER TABLE public.tenant_applications 
        ALTER COLUMN status TYPE text USING status::text;
      END IF;
    END;
  END IF;
END $$;

-- Step 2: Drop all enum types related to application_status
DROP TYPE IF EXISTS public.application_status_old CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;

-- Step 3: Create clean 3-value enum
CREATE TYPE public.application_status AS ENUM ('WAITING', 'ACCEPTED', 'REJECTED');

-- Step 4: Update data to valid new statuses (while column is text)
UPDATE public.tenant_applications 
SET status = CASE 
  WHEN status IN ('WAITING', 'ACCEPTED', 'REJECTED') THEN status
  WHEN status IN ('PENDING', 'CARETAKER_APPROVED') THEN 'WAITING'
  WHEN status = 'APPROVED' THEN 'ACCEPTED'
  WHEN status IN ('CANCELLED') THEN 'REJECTED'
  ELSE 'WAITING'
END
WHERE status IS NOT NULL;

-- Set any NULL statuses to WAITING
UPDATE public.tenant_applications 
SET status = 'WAITING' 
WHERE status IS NULL;

-- Step 5: Now convert column to new enum type
ALTER TABLE public.tenant_applications 
ALTER COLUMN status TYPE public.application_status 
USING status::public.application_status;

-- ============================================================================
-- PART 3: Clean up table columns
-- ============================================================================

-- Add necessary columns
ALTER TABLE public.tenant_applications 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS assigned_unit_id uuid REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS converted_tenant_id uuid REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS converted_user_id uuid REFERENCES auth.users(id);

-- Drop old columns no longer needed
ALTER TABLE public.tenant_applications 
DROP COLUMN IF EXISTS temporary_password,
DROP COLUMN IF EXISTS password_changed_at,
DROP COLUMN IF EXISTS onboarding_completed_at,
DROP COLUMN IF EXISTS visit_status,
DROP COLUMN IF EXISTS visit_confirmed_at,
DROP COLUMN IF EXISTS visit_notes,
DROP COLUMN IF EXISTS conversion_status,
DROP COLUMN IF EXISTS caretaker_approved,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS rejected_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS rejected_at;

-- ============================================================================
-- PART 4: Create setup tokens table
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

ALTER TABLE public.tenant_setup_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_setup_tokens_service_only ON public.tenant_setup_tokens;
CREATE POLICY tenant_setup_tokens_service_only ON public.tenant_setup_tokens
  FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- PART 5: Create accept_application function
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
    v_unit.base_price, COALESCE(v_unit.deposit_amount, 0), 'PENDING', now(), now()
  )
  RETURNING id INTO v_lease_id;
  
  -- Update unit
  UPDATE public.units
  SET availability_status = 'RESERVED', status = 'TAKEN', updated_at = now()
  WHERE id = p_assigned_unit_id;
  
  -- Update application
  UPDATE public.tenant_applications
  SET status = 'ACCEPTED', assigned_unit_id = p_assigned_unit_id,
      converted_tenant_id = v_new_tenant_id, updated_at = now()
  WHERE id = p_application_id;
  
  RETURN jsonb_build_object(
    'success', true, 'tenantId', v_new_tenant_id, 'leaseId', v_lease_id,
    'message', 'Application accepted. Email will be sent to applicant.'
  );
END;
$$;

-- ============================================================================
-- PART 6: Create reject_application function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_application(
  p_application_id uuid,
  p_reason text DEFAULT 'Unfortunately, all available units are currently occupied.'
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
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id AND status = 'WAITING';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not in WAITING status');
  END IF;
  
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this property');
    END IF;
  END IF;
  
  UPDATE public.tenant_applications
  SET status = 'REJECTED', rejection_reason = p_reason, updated_at = now()
  WHERE id = p_application_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Application rejected. Email will be sent.');
END;
$$;

-- ============================================================================
-- PART 7: Create verify_setup_token function
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
  IF p_new_password IS NULL OR length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  SELECT * INTO v_token_record
  FROM public.tenant_setup_tokens
  WHERE token_hash = encode(digest(p_raw_token, 'sha256'), 'hex')
    AND used_at IS NULL AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired setup link');
  END IF;
  
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = v_token_record.application_id;
  
  IF NOT FOUND OR v_application.status != 'ACCEPTED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not accepted');
  END IF;
  
  SELECT id INTO v_existing_user_id FROM auth.users WHERE email = v_application.email;
  
  IF v_existing_user_id IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
    WHERE id = v_existing_user_id;
    v_new_user_id := v_existing_user_id;
  ELSE
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (gen_random_uuid(), v_application.email, crypt(p_new_password, gen_salt('bf')), now(),
      jsonb_build_object('role', 'TENANT'), jsonb_build_object('full_name', v_application.full_name), now(), now())
    RETURNING id INTO v_new_user_id;
    
    INSERT INTO public.profiles (user_id, role_id, email, full_name, phone_number,
      assigned_property_id, assigned_unit_id, is_active, created_at, updated_at)
    VALUES (v_new_user_id, 'TENANT', v_application.email, v_application.full_name,
      v_application.phone_number, v_application.property_id, v_application.assigned_unit_id, true, now(), now());
  END IF;
  
  UPDATE public.tenant_applications
  SET converted_user_id = v_new_user_id, updated_at = now()
  WHERE id = v_application.id;
  
  UPDATE public.tenant_setup_tokens SET used_at = now() WHERE id = v_token_record.id;
  
  UPDATE public.tenants
  SET user_id = v_new_user_id, status = 'ACTIVE', updated_at = now()
  WHERE id = v_application.converted_tenant_id;
  
  UPDATE public.leases
  SET status = 'ACTIVE', updated_at = now()
  WHERE tenant_id = v_application.converted_tenant_id;
  
  RETURN jsonb_build_object('success', true, 'userId', v_new_user_id,
    'message', 'Password set successfully. You can now log in.');
END;
$$;

-- ============================================================================
-- PART 8: Create webhook trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_application_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF OLD.status = 'WAITING' AND NEW.status IN ('ACCEPTED', 'REJECTED') THEN
    RAISE NOTICE 'Application %: % → %', NEW.id, OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_status_webhook
  AFTER UPDATE OF status ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_application_status_webhook();

-- ============================================================================
-- PART 9: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.accept_application(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TYPE public.application_status IS 'Simplified 3-status flow: WAITING → ACCEPTED/REJECTED';
COMMENT ON TABLE public.tenant_applications IS 'Simplified application flow: WAITING → ACCEPTED/REJECTED';

-- ============================================================================
-- PART 10: Recreate views
-- ============================================================================

-- Create view without reported_issues (table may not exist)
DO $$
BEGIN
  CREATE OR REPLACE VIEW public.caretaker_dashboard_view AS
  SELECT 
    p.id AS property_id,
    p.name AS property_name,
    p.location AS property_location,
    e.user_id AS caretaker_user_id,
    e.id AS caretaker_employee_id,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id) AS total_units,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id AND availability_status = 'OCCUPIED') AS occupied_units,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id AND availability_status = 'AVAILABLE') AS available_units,
    (SELECT COUNT(*) FROM public.tenant_applications WHERE property_id = p.id AND status = 'WAITING') AS waiting_applications,
    (SELECT COUNT(*) FROM public.tenants WHERE property_id = p.id AND status = 'ACTIVE') AS active_tenants,
    0 AS pending_issues
  FROM public.properties p
  LEFT JOIN public.employees e ON e.assigned_property_id = p.id AND e.role_id = 'CARETAKER';
EXCEPTION WHEN OTHERS THEN
  -- If reported_issues exists, include it
  CREATE OR REPLACE VIEW public.caretaker_dashboard_view AS
  SELECT 
    p.id AS property_id,
    p.name AS property_name,
    p.location AS property_location,
    e.user_id AS caretaker_user_id,
    e.id AS caretaker_employee_id,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id) AS total_units,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id AND availability_status = 'OCCUPIED') AS occupied_units,
    (SELECT COUNT(*) FROM public.units WHERE property_id = p.id AND availability_status = 'AVAILABLE') AS available_units,
    (SELECT COUNT(*) FROM public.tenant_applications WHERE property_id = p.id AND status = 'WAITING') AS waiting_applications,
    (SELECT COUNT(*) FROM public.tenants WHERE property_id = p.id AND status = 'ACTIVE') AS active_tenants,
    (SELECT COUNT(*) FROM public.reported_issues WHERE property_id = p.id AND status = 'PENDING') AS pending_issues
  FROM public.properties p
  LEFT JOIN public.employees e ON e.assigned_property_id = p.id AND e.role_id = 'CARETAKER';
END $$;
