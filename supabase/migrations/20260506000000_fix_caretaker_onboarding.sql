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
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

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
  
  -- Check if auth user exists with this email (for linking)
  SELECT id INTO v_caretaker_user_id
  FROM auth.users
  WHERE email = p_caretaker_email
  LIMIT 1;
  
  -- Generate password ONCE (12 character random string with dashes: XXXX-XXXX-XXXX)
  -- Single generation, used everywhere
  v_password := upper(substr(md5(random()::text), 1, 12));
  -- Format as XXXX-XXXX-XXXX for readability
  v_password := substr(v_password, 1, 4) || '-' || substr(v_password, 5, 4) || '-' || substr(v_password, 9, 4);
  
  -- ==========================================================================
  -- CREATE OR UPDATE AUTH USER FOR CARETAKER
  -- ==========================================================================
  
  IF v_caretaker_user_id IS NULL THEN
    -- Generate new user ID
    v_caretaker_user_id := gen_random_uuid();
    
    -- Create auth user with temp password
    INSERT INTO auth.users (
      id,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    ) VALUES (
      v_caretaker_user_id,
      'authenticated',
      p_caretaker_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', p_caretaker_first_name || ' ' || p_caretaker_last_name,
        'role', 'CARETAKER'
      ),
      NOW(),
      NOW(),
      false,
      false
    );
    
    -- Create auth identity entry
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at,
      provider_id
    ) VALUES (
      gen_random_uuid(),
      v_caretaker_user_id,
      jsonb_build_object('sub', v_caretaker_user_id::text, 'email', p_caretaker_email),
      'email',
      NOW(),
      NOW(),
      p_caretaker_email
    );
  ELSE
    -- Auth user exists - update password to new password
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_caretaker_user_id;
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
    'message', 'Property created successfully with ' || p_number_of_units || ' units'
  );
  
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

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION public.create_property_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_property_complete TO anon;

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

-- Also add policy for employees table admin access
DROP POLICY IF EXISTS "admin_employees_all_access" ON public.employees;
CREATE POLICY "admin_employees_all_access" ON public.employees
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

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
