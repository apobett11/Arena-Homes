-- ============================================================================
-- FORCE APPLICATION PIPELINE MIGRATION
-- Purpose: Force-create all functions and schema changes, handling existing objects
-- ============================================================================

-- ============================================================================
-- PART 1: DROP EXISTING FUNCTIONS (to handle signature changes)
-- ============================================================================

DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.get_tenant_onboarding_status(uuid);
    DROP FUNCTION IF EXISTS public.get_tenant_onboarding_status();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.complete_onboarding_step(uuid, text, text, text, text, text);
    DROP FUNCTION IF EXISTS public.complete_onboarding_step(text, text, text, text, text);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.approve_application_and_create_tenant(uuid, uuid, uuid, date, date);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.confirm_application_visit(uuid, uuid, text);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- PART 2: ADD COLUMNS (IF NOT EXISTS)
-- ============================================================================

DO $$
BEGIN
    -- Add columns one by one with separate statements
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS applicant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS visit_status text NOT NULL DEFAULT 'NOT_SCHEDULED';
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS conversion_status text NOT NULL DEFAULT 'NOT_CONVERTED';
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS visit_confirmed_at timestamptz;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS visit_notes text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS approved_at timestamptz;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS assigned_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS converted_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS converted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS rejection_reason text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS school_name text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS course_name text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS year_of_study text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS preferred_move_in_date date;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS temporary_password text;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
    ALTER TABLE public.tenant_applications 
        ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding columns: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON public.tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_property_id ON public.tenant_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_caretaker_employee_id ON public.tenant_applications(caretaker_employee_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_converted_tenant_id ON public.tenant_applications(converted_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_email ON public.tenant_applications(email);

-- ============================================================================
-- PART 4: RECREATE CARETAKER DASHBOARD VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.caretaker_dashboard_view;

CREATE OR REPLACE VIEW public.caretaker_dashboard_view AS
WITH caretaker_employee AS (
  SELECT 
    e.id as employee_id,
    e.user_id,
    e.full_name,
    e.phone_number,
    e.email,
    e.assigned_property_id
  FROM public.employees e
  WHERE e.role_id = 'CARETAKER' AND e.status = 'ACTIVE'
),
property_stats AS (
  SELECT 
    p.id as property_id,
    p.name as property_name,
    p.location as property_location,
    COUNT(u.id) as total_rooms,
    COUNT(CASE WHEN u.status = 'TAKEN' OR u.availability_status = 'OCCUPIED' THEN 1 END) as occupied_rooms,
    COUNT(CASE WHEN u.status = 'VACANT' OR u.availability_status = 'AVAILABLE' THEN 1 END) as vacant_rooms,
    COUNT(DISTINCT t.id) as tenants_count,
    COUNT(CASE WHEN i.status = 'PENDING' THEN 1 END) as pending_issues_count,
    COUNT(CASE WHEN i.status = 'RESOLVED' THEN 1 END) as resolved_issues_count,
    COUNT(CASE WHEN r.status IN ('PENDING', 'IN_PROGRESS') THEN 1 END) as pending_repairs_count,
    COUNT(CASE WHEN r.status = 'SOLVED' THEN 1 END) as solved_repairs_count,
    COUNT(CASE WHEN ta.status = 'PENDING' THEN 1 END) as pending_applications_count,
    COUNT(CASE WHEN a.sender_employee_id = ce.employee_id THEN 1 END) as outgoing_announcements_count,
    COUNT(CASE WHEN (a.target_role = 'CARETAKER' OR a.property_id = p.id OR a.is_global = true) AND a.is_published = true THEN 1 END) as incoming_announcements_count
  FROM public.properties p
  JOIN caretaker_employee ce ON p.id = ce.assigned_property_id
  LEFT JOIN public.units u ON p.id = u.property_id
  LEFT JOIN public.tenants t ON p.id = t.property_id
  LEFT JOIN public.issues i ON p.id = i.property_id
  LEFT JOIN public.repairs r ON p.id = r.property_id
  LEFT JOIN public.tenant_applications ta ON p.id = ta.property_id
  LEFT JOIN public.announcements a ON (p.id = a.property_id OR a.is_global = true)
  GROUP BY p.id, p.name, p.location, ce.employee_id, ce.user_id, ce.full_name, ce.phone_number, ce.email, ce.assigned_property_id
)
SELECT 
  ce.employee_id as caretaker_employee_id,
  ce.user_id as caretaker_user_id,
  ce.full_name as caretaker_full_name,
  ce.phone_number as caretaker_phone_number,
  ce.email as caretaker_email,
  ce.assigned_property_id,
  ps.property_name,
  ps.property_location,
  ps.total_rooms,
  ps.occupied_rooms,
  ps.vacant_rooms,
  ps.tenants_count,
  ps.pending_issues_count,
  ps.resolved_issues_count,
  ps.pending_repairs_count,
  ps.solved_repairs_count,
  ps.pending_applications_count,
  ps.outgoing_announcements_count,
  ps.incoming_announcements_count
FROM caretaker_employee ce
LEFT JOIN property_stats ps ON ce.assigned_property_id = ps.property_id;

-- ============================================================================
-- PART 5: CREATE FUNCTIONS (with correct signatures)
-- ============================================================================

-- Function to get onboarding status for current user
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
  
  -- Check if password has been changed
  IF v_application.password_changed_at IS NULL THEN
    RETURN jsonb_build_object(
      'canAccess', false,
      'reason', 'Please change your temporary password first',
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

-- Function to complete onboarding step
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
  
  -- Handle password step
  IF p_step = 'password' THEN
    IF p_password IS NULL OR length(p_password) < 8 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Password must be at least 8 characters'
      );
    END IF;
    
    -- Update auth user password
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_user_id;
    
    -- Update application record
    UPDATE public.tenant_applications
    SET password_changed_at = now(),
        temporary_password = NULL,
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

-- Function to approve application and create tenant
-- NOTE: p_caretaker_user_id removed - function uses auth.uid() internally
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
  v_new_user_id uuid;
  v_new_tenant_id uuid;
  v_temp_password text;
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
  
  IF v_application.status NOT IN ('PENDING', 'CARETAKER_APPROVED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application is not in a valid state for approval');
  END IF;
  
  -- Get caretaker info
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;
  
  -- Get property info
  SELECT * INTO v_property
  FROM public.properties
  WHERE id = v_application.property_id;
  
  -- Get unit info (either assigned or requested)
  IF p_assigned_unit_id IS NOT NULL THEN
    SELECT * INTO v_unit
    FROM public.units
    WHERE id = p_assigned_unit_id AND property_id = v_application.property_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid unit assignment');
    END IF;
    
    -- Check unit availability
    IF v_unit.availability_status = 'OCCUPIED' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selected unit is already occupied');
    END IF;
  ELSE
    -- Use the unit from the application
    SELECT * INTO v_unit
    FROM public.units
    WHERE id = v_application.unit_id;
  END IF;
  
  -- Check if user already exists by email
  SELECT id INTO v_new_user_id
  FROM auth.users
  WHERE email = v_application.email;
  
  -- Generate temporary password
  v_temp_password := substr(md5(random()::text), 1, 10);
  
  IF v_new_user_id IS NULL THEN
    -- Create new auth user
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
      crypt(v_temp_password, gen_salt('bf')),
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
      COALESCE(p_assigned_unit_id, v_application.unit_id),
      true,
      now(),
      now()
    );
  ELSE
    -- Update existing user's profile
    UPDATE public.profiles
    SET assigned_property_id = v_application.property_id,
        assigned_unit_id = COALESCE(p_assigned_unit_id, v_application.unit_id),
        updated_at = now()
    WHERE user_id = v_new_user_id;
  END IF;
  
  -- Create tenant record
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
    v_new_user_id,
    v_application.full_name,
    v_application.phone_number,
    v_application.whatsapp_number,
    v_application.registration_number,
    v_application.email,
    v_application.property_id,
    COALESCE(p_assigned_unit_id, v_application.unit_id),
    v_unit.room_number,
    v_caretaker.id,
    v_caretaker_user_id,
    p_start_date,
    'PENDING',
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
    COALESCE(p_assigned_unit_id, v_application.unit_id),
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
  
  -- Update unit to reserved/occupied
  UPDATE public.units
  SET availability_status = 'RESERVED',
      status = 'TAKEN',
      updated_at = now()
  WHERE id = COALESCE(p_assigned_unit_id, v_application.unit_id);
  
  -- Update application record
  UPDATE public.tenant_applications
  SET status = 'APPROVED',
      conversion_status = 'CONVERTED',
      approved_at = now(),
      approved_by = v_caretaker_user_id,
      assigned_unit_id = COALESCE(p_assigned_unit_id, v_application.unit_id),
      converted_tenant_id = v_new_tenant_id,
      converted_user_id = v_new_user_id,
      temporary_password = v_temp_password,
      updated_at = now()
  WHERE id = p_application_id;
  
  -- Create notification for new tenant
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    data,
    created_at
  ) VALUES (
    v_new_user_id,
    'SUCCESS',
    'Welcome to Arena Homes!',
    'Your application has been approved. Please login and complete your onboarding.',
    jsonb_build_object(
      'tenant_id', v_new_tenant_id,
      'property_name', v_property.name,
      'unit_number', v_unit.room_number,
      'temp_password', v_temp_password
    ),
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tenantId', v_new_tenant_id,
    'userId', v_new_user_id,
    'leaseId', v_lease_id,
    'temporaryPassword', v_temp_password,
    'message', 'Tenant created successfully. Temporary password: ' || v_temp_password
  );
END;
$$;

-- Function to confirm visit
-- NOTE: p_caretaker_user_id removed - function uses auth.uid() internally
CREATE OR REPLACE FUNCTION public.confirm_application_visit(
  p_application_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application public.tenant_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;
  
  UPDATE public.tenant_applications
  SET visit_status = 'CONFIRMED',
      visit_confirmed_at = now(),
      visit_notes = COALESCE(p_notes, visit_notes),
      updated_at = now()
  WHERE id = p_application_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Visit confirmed successfully'
  );
END;
$$;

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_tenant_onboarding_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding_step(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_application_and_create_tenant(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_application_visit(uuid, text) TO authenticated;

-- ============================================================================
-- PART 7: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tenant_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS tenant_applications_insert_public ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_caretaker_select ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_caretaker_update ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_admin_select ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_admin_update ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_user_select_own ON public.tenant_applications;

-- Policy: Anyone can insert applications (public application form)
CREATE POLICY tenant_applications_insert_public
  ON public.tenant_applications
  FOR INSERT
  TO public, authenticated
  WITH CHECK (true);

-- Policy: Caretakers can view applications for their assigned properties
CREATE POLICY tenant_applications_caretaker_select
  ON public.tenant_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid()
        AND e.role_id = 'CARETAKER'
        AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- Policy: Caretakers can update applications for their assigned properties
CREATE POLICY tenant_applications_caretaker_update
  ON public.tenant_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid()
        AND e.role_id = 'CARETAKER'
        AND e.assigned_property_id = tenant_applications.property_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid()
        AND e.role_id = 'CARETAKER'
        AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- Policy: Admins can view all applications
CREATE POLICY tenant_applications_admin_select
  ON public.tenant_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role_id = 'ADMIN'
    )
  );

-- Policy: Admins can update all applications
CREATE POLICY tenant_applications_admin_update
  ON public.tenant_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role_id = 'ADMIN'
    )
  );

-- Policy: Users can view their own applications by email match
CREATE POLICY tenant_applications_user_select_own
  ON public.tenant_applications
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR applicant_user_id = auth.uid()
    OR converted_user_id = auth.uid()
  );

-- ============================================================================
-- PART 8: CREATE TRIGGERS
-- ============================================================================

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_tenant_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_tenant_applications_updated_at ON public.tenant_applications;
CREATE TRIGGER update_tenant_applications_updated_at
  BEFORE UPDATE ON public.tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_applications_updated_at();

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE public.tenant_applications IS 'Complete application pipeline table with visit tracking and tenant conversion support';
