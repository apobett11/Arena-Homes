-- ============================================================================
-- MIGRATION: New Application Email Model (Secure Setup Links)
-- Purpose: Replace temp-password emails with secure setup link system
-- Date: May 2, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: Update Application Status Enum and Remove Old Email Trigger
-- ============================================================================

-- Add new enum values if they don't exist
DO $$
BEGIN
  -- Add WAITING status
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'WAITING' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
  ) THEN
    ALTER TYPE public.application_status ADD VALUE 'WAITING';
  END IF;

  -- Add ACCEPTED status
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ACCEPTED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
  ) THEN
    ALTER TYPE public.application_status ADD VALUE 'ACCEPTED';
  END IF;
END $$;

-- Drop the old trigger that queues emails with temp passwords
DROP TRIGGER IF EXISTS trg_notify_application_response ON public.tenant_applications;

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.notify_application_response();

-- Drop the old email sender function (it sends temp passwords)
DROP FUNCTION IF EXISTS public.send_application_email(text, text, jsonb);

-- ============================================================================
-- PART 2: Create Tenant Setup Tokens Table (Secure Setup Links)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL, -- SHA256 hash of the token (not the raw token)
  application_id uuid NOT NULL REFERENCES public.tenant_applications(id) ON DELETE CASCADE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for quick token lookups
CREATE INDEX IF NOT EXISTS idx_tenant_setup_tokens_hash ON public.tenant_setup_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_setup_tokens_application ON public.tenant_setup_tokens(application_id);
CREATE INDEX IF NOT EXISTS idx_tenant_setup_tokens_email ON public.tenant_setup_tokens(email);

-- Enable RLS
ALTER TABLE public.tenant_setup_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access tokens directly
DROP POLICY IF EXISTS tenant_setup_tokens_service_only ON public.tenant_setup_tokens;
CREATE POLICY tenant_setup_tokens_service_only ON public.tenant_setup_tokens
  FOR ALL
  USING (false)  -- No direct access
  WITH CHECK (false);

-- ============================================================================
-- PART 3: Function to Verify Setup Token and Create/Update Auth User
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
  v_token_hash text;
BEGIN
  -- Validate password
  IF p_new_password IS NULL OR length(p_new_password) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Password must be at least 8 characters'
    );
  END IF;

  -- Hash the provided token for lookup
  -- Note: In production, the Edge Function would hash this, but we do it here for RPC usage
  -- The actual comparison uses the hash stored by the Edge Function
  
  -- Find the token (Edge Function stores SHA256 hash)
  SELECT * INTO v_token_record
  FROM public.tenant_setup_tokens
  WHERE token_hash = encode(digest(p_raw_token, 'sha256'), 'hex')
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired setup link'
    );
  END IF;

  -- Get the application
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = v_token_record.application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;

  -- Check if application is approved/accepted
  IF v_application.status NOT IN ('APPROVED', 'ACCEPTED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application is not approved'
    );
  END IF;

  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = v_application.email;

  IF v_existing_user_id IS NOT NULL THEN
    -- Update existing user's password
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_existing_user_id;
    
    v_new_user_id := v_existing_user_id;
  ELSE
    -- Create new auth user with the chosen password
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
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
    
    -- Create profile for new user
    INSERT INTO public.profiles (
      user_id,
      role_id,
      email,
      full_name,
      phone_number,
      assigned_property_id,
      assigned_unit_id,
      is_active,
      created_at,
      updated_at
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

  -- Update application record
  UPDATE public.tenant_applications
  SET converted_user_id = v_new_user_id,
      password_changed_at = now(),
      updated_at = now()
  WHERE id = v_application.id;

  -- Mark token as used
  UPDATE public.tenant_setup_tokens
  SET used_at = now()
  WHERE id = v_token_record.id;

  -- Update tenant record to ACTIVE
  UPDATE public.tenants
  SET user_id = v_new_user_id,
      status = 'ACTIVE',
      updated_at = now()
  WHERE id = v_application.converted_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'userId', v_new_user_id,
    'message', 'Password set successfully. You can now log in.'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_setup_token_and_set_password(text, text) TO authenticated;

-- ============================================================================
-- PART 4: Update approve_application_and_create_tenant (Remove Temp Password)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_application_and_create_tenant(
  p_application_id uuid,
  p_assigned_unit_id uuid DEFAULT NULL,
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
  -- Set default end date if not provided
  v_default_end_date := COALESCE(p_end_date, CURRENT_DATE + INTERVAL '1 year');
  
  -- Get the application
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;
  
  -- Validate status transition: only PENDING or CARETAKER_APPROVED can be accepted
  IF v_application.status NOT IN ('PENDING', 'CARETAKER_APPROVED', 'WAITING') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application is not in a valid state for approval');
  END IF;
  
  -- Get caretaker info
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  -- Verify caretaker is assigned to this property
  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    -- Check if admin (admins can approve any property)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to approve applications for this property');
    END IF;
  END IF;
  
  -- Get property info
  SELECT * INTO v_property
  FROM public.properties
  WHERE id = v_application.property_id;
  
  -- Validate unit assignment
  IF p_assigned_unit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A unit must be assigned when accepting an application');
  END IF;
  
  -- Get unit info and validate it belongs to the same property
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_assigned_unit_id AND property_id = v_application.property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid unit assignment - unit does not belong to this property');
  END IF;
  
  -- Check unit is available (not occupied)
  IF v_unit.availability_status = 'OCCUPIED' OR v_unit.status = 'TAKEN' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected unit is already occupied');
  END IF;
  
  -- Create tenant record (PENDING status - will become ACTIVE after password setup)
  INSERT INTO public.tenants (
    user_id, -- NULL until password setup
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
    NULL, -- Will be set after password setup
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
    'PENDING_SETUP', -- Pending password setup
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
    'PENDING', -- Will become ACTIVE after onboarding
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
  
  -- Update application record
  UPDATE public.tenant_applications
  SET status = 'ACCEPTED', -- New status: ACCEPTED (not APPROVED)
      conversion_status = 'CONVERTING', -- Will be CONVERTED after password setup
      approved_at = now(),
      approved_by = v_caretaker_user_id,
      assigned_unit_id = p_assigned_unit_id,
      converted_tenant_id = v_new_tenant_id,
      -- NO converted_user_id yet (set after password setup)
      -- NO temporary_password (removed)
      updated_at = now()
  WHERE id = p_application_id;
  
  -- Create notification for new tenant (no temp password in data)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    NULL, -- Will be updated after user creates account
    'INFO',
    'Welcome to Arena Homes!',
    'Your application has been accepted. Please check your email for setup instructions.',
    jsonb_build_object(
      'tenant_id', v_new_tenant_id,
      'property_name', v_property.name,
      'unit_number', v_unit.room_number
    ),
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tenantId', v_new_tenant_id,
    'leaseId', v_lease_id,
    'message', 'Application accepted. Tenant will receive setup email to create their password.'
  );
END;
$$;

-- ============================================================================
-- PART 5: Create Reject Application Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_application(
  p_application_id uuid,
  p_reason text DEFAULT NULL
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
  -- Get the application
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;
  
  -- Only reject PENDING/WAITING/CARETAKER_APPROVED applications
  IF v_application.status NOT IN ('PENDING', 'WAITING', 'CARETAKER_APPROVED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application cannot be rejected in its current state');
  END IF;
  
  -- Get caretaker info
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  -- Verify caretaker is assigned to this property OR is admin
  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to reject applications for this property');
    END IF;
  END IF;
  
  -- Update application to REJECTED
  UPDATE public.tenant_applications
  SET status = 'REJECTED',
      rejected_at = now(),
      rejected_by = v_caretaker_user_id,
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_application_id;
  
  -- No tenant created, no unit assigned
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application rejected successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_application_and_create_tenant(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_application(uuid, text) TO authenticated;

-- ============================================================================
-- PART 6: Update get_tenant_onboarding_status for New Flow
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_onboarding_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_application public.tenant_applications%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
BEGIN
  -- Find application by converted_user_id or email match
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE converted_user_id = v_user_id
     OR (email = (SELECT email FROM auth.users WHERE id = v_user_id))
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'canAccess', false,
      'reason', 'No approved application found. Please apply for a property first.',
      'onboardingStatus', jsonb_build_object(
        'hasSetPassword', true,
        'hasCompletedProfile', true,
        'hasAcceptedAgreement', true
      )
    );
  END IF;
  
  -- Check if already fully onboarded
  IF v_application.onboarding_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'canAccess', true,
      'reason', 'Onboarding completed',
      'onboardingStatus', jsonb_build_object(
        'hasSetPassword', true,
        'hasCompletedProfile', true,
        'hasAcceptedAgreement', true
      ),
      'tenantId', v_application.converted_tenant_id
    );
  END IF;
  
  -- Check if user record exists (password was set via setup link)
  IF v_application.converted_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'canAccess', false,
      'reason', 'Please use the setup link sent to your email to set your password',
      'onboardingStatus', jsonb_build_object(
        'hasSetPassword', false,
        'hasCompletedProfile', false,
        'hasAcceptedAgreement', false
      ),
      'applicationId', v_application.id
    );
  END IF;
  
  -- Check if profile is complete
  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id = v_application.converted_tenant_id;
  
  IF v_tenant IS NULL OR v_tenant.full_name IS NULL OR v_tenant.phone_number IS NULL THEN
    RETURN jsonb_build_object(
      'canAccess', false,
      'reason', 'Please complete your profile',
      'onboardingStatus', jsonb_build_object(
        'hasSetPassword', true,
        'hasCompletedProfile', false,
        'hasAcceptedAgreement', false
      ),
      'applicationId', v_application.id,
      'tenantId', v_application.converted_tenant_id
    );
  END IF;
  
  -- All steps complete
  RETURN jsonb_build_object(
    'canAccess', true,
    'reason', 'Onboarding complete',
    'onboardingStatus', jsonb_build_object(
      'hasSetPassword', true,
      'hasCompletedProfile', true,
      'hasAcceptedAgreement', true
    ),
    'tenantId', v_application.converted_tenant_id
  );
END;
$$;

-- ============================================================================
-- PART 7: Create Database Webhook Trigger (Calls Edge Function)
-- ============================================================================

-- Function to trigger webhook (called by trigger)
CREATE OR REPLACE FUNCTION public.trigger_application_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_url text;
  v_webhook_secret text;
  v_payload jsonb;
  v_response jsonb;
BEGIN
  -- Only trigger on status changes to ACCEPTED or REJECTED
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Only trigger for PENDING/WAITING -> ACCEPTED/REJECTED transitions
  IF NOT (OLD.status IN ('PENDING', 'WAITING', 'CARETAKER_APPROVED') AND 
          NEW.status IN ('ACCEPTED', 'APPROVED', 'REJECTED')) THEN
    RETURN NEW;
  END IF;

  -- Build webhook URL from config
  -- In production, set this via: npx supabase secrets set WEBHOOK_URL="..."
  -- For now, we'll construct it from the project ref
  v_webhook_url := COALESCE(
    current_setting('app.settings.webhook_url', true),
    'http://host.docker.internal:54321/functions/v1/application-status-email'
  );
  
  v_webhook_secret := COALESCE(
    current_setting('app.settings.webhook_secret', true),
    ''
  );

  -- Build payload
  v_payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', to_jsonb(OLD)
  );

  -- Log the webhook call (for debugging)
  RAISE NOTICE 'Application status webhook: % -> % for application %', OLD.status, NEW.status, NEW.id;

  -- Note: Actual HTTP call to Edge Function happens via Supabase Database Webhooks (configured in dashboard)
  -- This trigger function serves as a marker and for any pre-webhook logic
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_application_status_webhook ON public.tenant_applications;
CREATE TRIGGER trg_application_status_webhook
  AFTER UPDATE OF status ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_application_status_webhook();

-- ============================================================================
-- PART 8: Update complete_onboarding_step for New Flow
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_onboarding_step(
  p_step text,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_emergency_contact text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_application public.tenant_applications%ROWTYPE;
  v_tenant_id uuid;
BEGIN
  -- Find the application for this user
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE converted_user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No approved application found'
    );
  END IF;
  
  v_tenant_id := v_application.converted_tenant_id;
  
  -- Handle password step (only if somehow reached without setup link)
  IF p_step = 'password' THEN
    IF p_password IS NULL OR length(p_password) < 8 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Password must be at least 8 characters'
      );
    END IF;
    
    -- Update auth user password (user already exists via setup link)
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_user_id;
    
    -- Update application record
    UPDATE public.tenant_applications
    SET password_changed_at = now(),
        updated_at = now()
    WHERE id = v_application.id;
    
    RETURN jsonb_build_object(
      'success', true,
      'canAccess', false,
      'message', 'Password updated successfully'
    );
  END IF;
  
  -- Handle profile step
  IF p_step = 'profile' THEN
    IF p_full_name IS NULL OR p_phone_number IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Full name and phone number are required'
      );
    END IF;
    
    -- Update tenant record
    UPDATE public.tenants
    SET full_name = p_full_name,
        phone_number = p_phone_number,
        whatsapp_number = p_emergency_contact,
        updated_at = now()
    WHERE id = v_tenant_id;
    
    -- Update profile
    UPDATE public.profiles
    SET full_name = p_full_name,
        phone_number = p_phone_number,
        updated_at = now()
    WHERE user_id = v_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'canAccess', false,
      'message', 'Profile updated successfully'
    );
  END IF;
  
  -- Handle agreement step
  IF p_step = 'agreement' THEN
    -- Mark onboarding as complete
    UPDATE public.tenant_applications
    SET onboarding_completed_at = now(),
        updated_at = now()
    WHERE id = v_application.id;
    
    -- Update tenant status to active
    UPDATE public.tenants
    SET status = 'ACTIVE',
        updated_at = now()
    WHERE id = v_tenant_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'canAccess', true,
      'message', 'Onboarding completed successfully',
      'tenantId', v_tenant_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Invalid step: ' || p_step
  );
END;
$$;

-- ============================================================================
-- PART 9: Add Comment for Secrets Configuration
-- ============================================================================

COMMENT ON FUNCTION public.trigger_application_status_webhook() IS 
'Database webhook trigger for application status changes. 
Configure Supabase Database Webhook in dashboard to call Edge Function:
URL: https://<project-ref>.functions.supabase.co/application-status-email
Headers: x-webhook-secret: <WEBHOOK_SECRET>

Required secrets (set via npx supabase secrets set):
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM
- SITE_URL
- WEBHOOK_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY';

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE public.tenant_setup_tokens IS 'Secure tokens for tenant password setup via email links';
