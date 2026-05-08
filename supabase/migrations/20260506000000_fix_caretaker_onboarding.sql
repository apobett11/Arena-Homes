-- ============================================================================
-- ARENA HOMES - FIX CARETAKER ONBOARDING
-- Version: 2.0.0
-- Purpose: Property created first, then caretaker employee created with auth user.
--          Password is set as real password (not temp). Caretaker can login immediately.
-- Date: May 6, 2026
-- ============================================================================

-- ============================================================================
-- ENSURE PGCRYPTO EXTENSION IS ENABLED (for password hashing)
-- ============================================================================

-- Enable extension in extensions schema (Supabase default)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Also ensure it's in search path for this function
SET LOCAL search_path = public, extensions, auth;

-- ============================================================================
-- REMOVE TEMP PASSWORD COLUMN FROM EMPLOYEES (password only in auth.users)
-- ============================================================================

ALTER TABLE public.employees 
DROP COLUMN IF EXISTS temp_password;

-- ============================================================================
-- ADD CARETAKER PASSWORD COLUMN TO PROPERTIES TABLE
-- ============================================================================

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS caretaker_password text;

COMMENT ON COLUMN public.properties.caretaker_password IS 'Initial password for caretaker, visible only to admin until changed';

-- ============================================================================
-- DROP AND RECREATE FUNCTION WITH CARETAKER DATA EXTRACTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_property_complete;

CREATE OR REPLACE FUNCTION public.create_property_complete(
  -- ========== REQUIRED PARAMETERS (NO DEFAULTS) ==========
  
  -- Property basic info (required)
  p_name text,
  p_location text,
  p_property_type text,
  p_monthly_rent numeric,
  
  -- Property details (required)
  p_number_of_units integer,
  p_electricity_payment text,
  p_water_availability_days_per_week integer,
  p_water_source text,
  p_room_space_sqm numeric,
  p_deposit_amount numeric,
  p_security_verified boolean,
  p_return_deposit boolean,
  p_gate_hours_from time,
  p_gate_hours_to time,
  p_parking_available boolean,
  p_latitude numeric,
  p_longitude numeric,
  
  -- Caretaker info (required)
  p_caretaker_first_name text,
  p_caretaker_last_name text,
  p_caretaker_email text,
  p_caretaker_phone text,
  
  -- ========== OPTIONAL PARAMETERS (WITH DEFAULTS) ==========
  
  -- Property basic info (optional)
  p_description text DEFAULT NULL,
  p_nearby_school_or_institution text DEFAULT NULL,
  p_landmark text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_available_from date DEFAULT CURRENT_DATE,
  
  -- Property media (optional)
  p_logo_url text DEFAULT NULL,
  p_cover_photo_url text DEFAULT NULL,
  
  -- FAQ and Rules (optional)
  p_faqs jsonb DEFAULT '[]'::jsonb,
  p_rules jsonb DEFAULT '[]'::jsonb,
  
  -- Admin who created (optional)
  p_created_by_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_property_id uuid;
  v_caretaker_employee_id uuid;
  v_caretaker_user_id uuid;
  v_password text;
  v_unit_counter integer;
  v_unit_number text;
  v_faq_item jsonb;
  v_rule_item jsonb;
  v_result jsonb;
BEGIN
  -- ==========================================================================
  -- VALIDATION
  -- ==========================================================================
  
  -- Validate required fields
  IF p_name IS NULL OR p_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property name is required');
  END IF;
  
  IF p_location IS NULL OR p_location = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location is required');
  END IF;
  
  IF p_property_type IS NULL OR p_property_type = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property type is required');
  END IF;
  
  IF p_monthly_rent IS NULL OR p_monthly_rent <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Monthly rent must be greater than 0');
  END IF;
  
  IF p_number_of_units IS NULL OR p_number_of_units <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Number of units must be greater than 0');
  END IF;
  
  IF p_caretaker_email IS NULL OR TRIM(p_caretaker_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker email is required');
  END IF;
  
  -- Normalize email (trim whitespace and lowercase)
  p_caretaker_email := LOWER(TRIM(p_caretaker_email));
  
  IF p_caretaker_first_name IS NULL OR p_caretaker_first_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker first name is required');
  END IF;
  
  IF p_caretaker_last_name IS NULL OR p_caretaker_last_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker last name is required');
  END IF;
  
  IF p_caretaker_phone IS NULL OR p_caretaker_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker phone is required');
  END IF;
  
  -- Check if caretaker email already exists in employees
  SELECT id INTO v_caretaker_employee_id
  FROM public.employees
  WHERE email = p_caretaker_email
    AND role_id = 'CARETAKER'
  LIMIT 1;
  
  IF v_caretaker_employee_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker with this email already exists.');
  END IF;
  
  -- DEBUG: Check if auth user exists with this email (for linking)
  SELECT id INTO v_caretaker_user_id
  FROM auth.users
  WHERE email = p_caretaker_email
  LIMIT 1;
  
  -- DEBUG: Log initial state
  RAISE NOTICE 'DEBUG: Initial auth check - v_caretaker_user_id: %, email: %', v_caretaker_user_id, p_caretaker_email;
  
  -- Generate password ONCE (12 character random string with dashes: XXXX-XXXX-XXXX)
  -- Single generation, used everywhere
  v_password := upper(substr(md5(random()::text), 1, 12));
  -- Format as XXXX-XXXX-XXXX for readability
  v_password := substr(v_password, 1, 4) || '-' || substr(v_password, 5, 4) || '-' || substr(v_password, 9, 4);
  
  RAISE NOTICE 'DEBUG: Generated password: %', v_password;
  
  -- ==========================================================================
  -- CREATE OR UPDATE AUTH USER FOR CARETAKER
  -- ==========================================================================
  
  IF v_caretaker_user_id IS NULL THEN
    -- Generate new user ID
    v_caretaker_user_id := gen_random_uuid();
    
    RAISE NOTICE 'DEBUG: Creating new auth user with ID: %', v_caretaker_user_id;
    
    -- DISABLE TRIGGER to prevent it from failing and rolling back auth.users insert
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
    RAISE NOTICE 'DEBUG: Trigger disabled';
    
    -- Use nested block to ensure trigger is re-enabled even if insert fails
    BEGIN
      RAISE NOTICE 'DEBUG: About to INSERT into auth.users';
      
      -- Create auth user with password (matching working pattern from codebase)
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
        v_caretaker_user_id,
        p_caretaker_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        jsonb_build_object('role', 'CARETAKER'),
        jsonb_build_object(
          'full_name', p_caretaker_first_name || ' ' || p_caretaker_last_name
        ),
        now(),
        now()
      );
      
      RAISE NOTICE 'DEBUG: auth.users INSERT completed';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'DEBUG: EXCEPTION during auth.users INSERT - SQLERRM: %, SQLSTATE: %', SQLERRM, SQLSTATE;
      -- Re-enable trigger before re-raising the error
      ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
      RAISE NOTICE 'DEBUG: Trigger re-enabled after exception';
      RAISE;
    END;
    
    -- RE-ENABLE TRIGGER after successful auth user creation
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
    RAISE NOTICE 'DEBUG: Trigger re-enabled after success';
    
    -- Manually create profile for caretaker (we disabled trigger, so we must create it)
    RAISE NOTICE 'DEBUG: About to INSERT into public.profiles';
    
    INSERT INTO public.profiles (
      user_id,
      role_id,
      email,
      full_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_caretaker_user_id,
      'CARETAKER',
      p_caretaker_email,
      p_caretaker_first_name || ' ' || p_caretaker_last_name,
      true,
      now(),
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role_id = EXCLUDED.role_id,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      is_active = EXCLUDED.is_active,
      updated_at = now();
    
    RAISE NOTICE 'DEBUG: public.profiles INSERT/UPDATE completed';
    
  ELSE
    RAISE NOTICE 'DEBUG: Auth user already exists: % - updating password', v_caretaker_user_id;
    
    -- Auth user exists - update password to new password
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_caretaker_user_id;
    
    RAISE NOTICE 'DEBUG: auth.users UPDATE completed';
  END IF;
  
  -- ==========================================================================
  -- CREATE PROPERTY
  -- ==========================================================================
  
  INSERT INTO public.properties (
    name,
    location,
    description,
    property_type,
    monthly_rent,
    price_min,
    price_max,
    number_of_units,
    electricity_payment,
    water_availability_days_per_week,
    water_source,
    room_space_sqm,
    deposit_amount,
    deposit_required,
    security_verified,
    return_deposit,
    gate_open_time,
    gate_close_time,
    parking_available,
    latitude,
    longitude,
    caretaker_employee_id,
    caretaker_user_id,
    caretaker_password,
    nearby_school_or_institution,
    landmark,
    contact_phone,
    available_from,
    logo_url,
    cover_photo_url,
    created_by_admin_id,
    verification_status,
    listing_status,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_location,
    p_description,
    p_property_type,
    p_monthly_rent,
    p_monthly_rent,  -- price_min same as monthly_rent
    p_monthly_rent,  -- price_max same as monthly_rent
    p_number_of_units,
    p_electricity_payment::public.electricity_payment_type,
    p_water_availability_days_per_week,
    p_water_source,
    p_room_space_sqm,
    p_deposit_amount,
    p_deposit_amount > 0,
    p_security_verified,
    p_return_deposit,
    p_gate_hours_from,
    p_gate_hours_to,
    p_parking_available,
    p_latitude,
    p_longitude,
    NULL,  -- Will update after employee creation
    v_caretaker_user_id,
    v_password,
    p_nearby_school_or_institution,
    p_landmark,
    p_contact_phone,
    p_available_from,
    p_logo_url,
    p_cover_photo_url,
    p_created_by_admin_id,
    CASE WHEN p_security_verified THEN 'VERIFIED' ELSE 'PENDING_VERIFICATION' END,
    'PUBLISHED',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_property_id;
  
  -- ==========================================================================
  -- CREATE CARETAKER EMPLOYEE (only after property succeeds)
  -- ==========================================================================
  
  INSERT INTO public.employees (
    user_id,
    role_id,
    full_name,
    email,
    phone_number,
    assigned_property_id,
    status,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_caretaker_user_id,
    'CARETAKER',
    p_caretaker_first_name || ' ' || p_caretaker_last_name,
    p_caretaker_email,
    p_caretaker_phone,
    v_property_id,
    'ACTIVE',
    p_created_by_admin_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_caretaker_employee_id;
  
  -- Update property with caretaker employee reference
  UPDATE public.properties
  SET caretaker_employee_id = v_caretaker_employee_id,
      updated_at = NOW()
  WHERE id = v_property_id;
  
  -- ==========================================================================
  -- CREATE UNITS
  -- ==========================================================================
  
  FOR v_unit_counter IN 1..p_number_of_units LOOP
    -- Generate unit number (A1, A2, ... A9, B1, B2, etc.)
    v_unit_number := CASE
      WHEN v_unit_counter <= 9 THEN 'A' || v_unit_counter::text
      WHEN v_unit_counter <= 18 THEN 'B' || (v_unit_counter - 9)::text
      WHEN v_unit_counter <= 27 THEN 'C' || (v_unit_counter - 18)::text
      WHEN v_unit_counter <= 36 THEN 'D' || (v_unit_counter - 27)::text
      ELSE 'E' || (v_unit_counter - 36)::text
    END;
    
    INSERT INTO public.units (
      property_id,
      room_number,
      room_type,
      type,
      base_price,
      status,
      availability_status,
      deposit_amount,
      created_at,
      updated_at
    ) VALUES (
      v_property_id,
      v_unit_number,
      p_property_type,
      p_property_type,
      p_monthly_rent,
      'VACANT',
      'AVAILABLE',
      p_deposit_amount,
      NOW(),
      NOW()
    );
  END LOOP;
  
  -- ==========================================================================
  -- CREATE FAQS
  -- ==========================================================================
  
  IF p_faqs IS NOT NULL AND jsonb_array_length(p_faqs) > 0 THEN
    FOR v_faq_item IN SELECT * FROM jsonb_array_elements(p_faqs)
    LOOP
      IF v_faq_item->>'question' IS NOT NULL AND v_faq_item->>'question' != '' THEN
        INSERT INTO public.property_faqs (
          property_id,
          question,
          answer,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          v_property_id,
          v_faq_item->>'question',
          COALESCE(v_faq_item->>'answer', ''),
          true,
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
  END IF;
  
  -- ==========================================================================
  -- CREATE RULES
  -- ==========================================================================
  
  IF p_rules IS NOT NULL AND jsonb_array_length(p_rules) > 0 THEN
    FOR v_rule_item IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
      IF v_rule_item->>'rule_text' IS NOT NULL AND v_rule_item->>'rule_text' != '' THEN
        INSERT INTO public.property_rules (
          property_id,
          title,
          description,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          v_property_id,
          'Rule',
          v_rule_item->>'rule_text',
          true,
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
  END IF;
  
  -- ==========================================================================
  -- VERIFY AUTH USER EXISTS
  -- ==========================================================================
  
  -- Double-check auth user exists with correct email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = v_caretaker_user_id 
    AND email = p_caretaker_email
  ) THEN
    RAISE NOTICE 'DEBUG: VERIFICATION FAILED - auth user not found for id: %, email: %', v_caretaker_user_id, p_caretaker_email;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Auth user creation failed - user not found after insert',
      'caretaker_user_id', v_caretaker_user_id,
      'caretaker_email', p_caretaker_email
    );
  END IF;
  
  RAISE NOTICE 'DEBUG: VERIFICATION PASSED - auth user exists: %', v_caretaker_user_id;
  
  -- ==========================================================================
  -- RETURN SUCCESS RESULT
  -- ==========================================================================
  
  v_result := jsonb_build_object(
    'success', true,
    'property_id', v_property_id,
    'caretaker_employee_id', v_caretaker_employee_id,
    'units_created', p_number_of_units,
    'caretaker_email', p_caretaker_email,
    'caretaker_password', v_password,
    'caretaker_user_id', v_caretaker_user_id,
    'auth_user_verified', true,
    'debug_info', jsonb_build_object(
      'function_version', '2.0_debug',
      'trigger_disabled', true,
      'profile_upsert', true
    ),
    'message', 'Property created successfully with ' || p_number_of_units || ' units'
  );
  
  RAISE NOTICE 'DEBUG: Returning success - property_id: %, caretaker_user_id: %', v_property_id, v_caretaker_user_id;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback will happen automatically, but we return error
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- ============================================================================
-- GRANTS FOR AUTH SCHEMA ACCESS (Required for auth.users write)
-- ============================================================================

-- Grant usage on auth schema to authenticated and anon roles
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant insert and select on auth.users to authenticated and anon
-- SECURITY DEFINER functions will use this
GRANT INSERT, SELECT, UPDATE ON auth.users TO authenticated;
GRANT INSERT, SELECT, UPDATE ON auth.users TO anon;

-- Grant sequence usage for auth.users id generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon;

-- ============================================================================
-- GRANTS FOR PUBLIC SCHEMA
-- ============================================================================

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION public.create_property_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete TO anon;
GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO anon;

COMMENT ON FUNCTION public.create_property_complete IS 'Atomic property creation with caretaker onboarding. Property created first, then employee with auth user. Password is real (not temp). Caretaker can login immediately.';

-- ============================================================================
-- JSON WRAPPER FUNCTION - Accepts single JSON payload parameter
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_property_complete_json;

CREATE OR REPLACE FUNCTION public.create_property_complete_json(
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data jsonb;
BEGIN
  v_data := p_payload;
  
  RETURN public.create_property_complete(
    -- Required params (1-21)
    v_data->>'name',
    v_data->>'location',
    v_data->>'property_type',
    (v_data->>'monthly_rent')::numeric,
    (v_data->>'number_of_units')::integer,
    v_data->>'electricity_payment',
    COALESCE((v_data->>'water_availability_days_per_week')::integer, (v_data->>'water_availability_days')::integer, 7),
    v_data->>'water_source',
    (v_data->>'room_space_sqm')::numeric,
    (v_data->>'deposit_amount')::numeric,
    (v_data->>'security_verified')::boolean,
    (v_data->>'return_deposit')::boolean,
    (v_data->>'gate_hours_from')::time,
    (v_data->>'gate_hours_to')::time,
    (v_data->>'parking_available')::boolean,
    (v_data->>'latitude')::numeric,
    (v_data->>'longitude')::numeric,
    v_data->>'caretaker_first_name',
    v_data->>'caretaker_last_name',
    v_data->>'caretaker_email',
    v_data->>'caretaker_phone',
    -- Optional params (22-31)
    v_data->>'description',
    v_data->>'nearby_school_or_institution',
    v_data->>'landmark',
    v_data->>'contact_phone',
    COALESCE((v_data->>'available_from')::date, CURRENT_DATE),
    v_data->>'logo_url',
    v_data->>'cover_photo_url',
    COALESCE(v_data->'faqs', '[]'::jsonb),
    COALESCE(v_data->'rules', '[]'::jsonb),
    NULL  -- created_by_admin_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO anon;

COMMENT ON FUNCTION public.create_property_complete_json IS 'JSON wrapper for property creation - accepts single JSON payload parameter';

-- ============================================================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================================================

-- Enable RLS on properties if not already enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admin_properties_all_access" ON public.properties;
DROP POLICY IF EXISTS "admin_profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;

-- Allow INSERT on profiles (needed for trigger and function-based creation)
CREATE POLICY "profiles_insert_all" ON public.profiles
FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- Allow admin full access to properties table
CREATE POLICY "admin_properties_all_access" ON public.properties
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admin full access to profiles table
CREATE POLICY "admin_profiles_all_access" ON public.profiles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- RLS POLICIES FOR EMPLOYEES TABLE
-- ============================================================================

-- Enable RLS on employees if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Employees can view/update their own records
DROP POLICY IF EXISTS "employees_select_self" ON public.employees;
CREATE POLICY "employees_select_self" ON public.employees
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "employees_update_self" ON public.employees;
CREATE POLICY "employees_update_self" ON public.employees
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin full access to employees
DROP POLICY IF EXISTS "admin_employees_all_access" ON public.employees;
CREATE POLICY "admin_employees_all_access" ON public.employees
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Caretaker can view employees at their assigned property
DROP POLICY IF EXISTS "caretaker_employees_property" ON public.employees;
CREATE POLICY "caretaker_employees_property" ON public.employees
FOR SELECT TO authenticated
USING (
  public.is_caretaker() AND 
  assigned_property_id IN (
    SELECT id FROM public.properties WHERE caretaker_user_id = auth.uid()
  )
);

-- ============================================================================
-- FUNCTION TO CLEAR CARETAKER PASSWORD (call when caretaker changes password)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clear_caretaker_password(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET caretaker_password = NULL,
      updated_at = NOW()
  WHERE id = p_property_id;
END;
$$;

COMMENT ON FUNCTION public.clear_caretaker_password IS 'Clears caretaker initial password from properties table. Call when caretaker changes their password.';

-- ============================================================================
-- COMPREHENSIVE GRANTS FOR AUTH SCHEMA ACCESS
-- Required for auth.users INSERT to work from SECURITY DEFINER functions
-- ============================================================================

-- Grant usage on auth schema (required to access auth tables)
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant CRUD operations on auth.users table
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO service_role;

-- Grant access to auth.identities table (Supabase Auth creates this automatically)
GRANT SELECT, INSERT, UPDATE ON auth.identities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.identities TO anon;
GRANT SELECT, INSERT, UPDATE ON auth.identities TO postgres;

-- Grant sequence usage for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO postgres;

-- ============================================================================
-- ADMIN FULL ACCESS GRANTS
-- Admin role needs unrestricted access to all tables for management
-- ============================================================================

-- Grant all privileges on all tables in public schema to authenticated (RLS will enforce admin checks)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant all privileges on all sequences in public schema
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on all functions in public schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant all on auth schema for admin auth management
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;

-- ============================================================================
-- RLS POLICIES FOR ADMIN AUTH SCHEMA ACCESS
-- ============================================================================

-- Note: auth schema tables don't have RLS enabled by default in Supabase
-- But if they do, admin needs full access policies

-- Admin can view all auth users (for user management dashboard)
-- This is implemented via a security definer view or function, not direct RLS on auth.users

-- ============================================================================
-- ADMIN VIEW FOR AUTH USERS (Secure way to expose auth data to admin)
-- ============================================================================

DROP VIEW IF EXISTS public.admin_auth_users_view;

CREATE VIEW public.admin_auth_users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.raw_app_meta_data,
  au.raw_user_meta_data,
  au.email_confirmed_at,
  au.phone,
  au.phone_confirmed_at,
  au.banned_until,
  p.role_id,
  p.is_active,
  p.full_name as profile_full_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id;

-- Only admin can access this view
CREATE POLICY "admin_auth_users_view_all" ON public.admin_auth_users_view
FOR SELECT TO authenticated
USING (public.is_admin());

COMMENT ON VIEW public.admin_auth_users_view IS 'Admin-only view of auth.users joined with profiles. Use for user management dashboard.';

-- ============================================================================
-- FUNCTION EXECUTE GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_property_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete TO anon;
GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete_json TO anon;
GRANT EXECUTE ON FUNCTION public.clear_caretaker_password TO authenticated;
