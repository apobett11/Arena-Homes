-- Property registration pipeline fixes (audit follow-up)
-- Applies: atomic verification, rules text/rule_text, no password reset on existing auth,
-- no plaintext caretaker_password on properties row, clearer duplicate-email errors.
CREATE OR REPLACE FUNCTION public.create_property_complete(
  p_name text,
  p_location text,
  p_property_type text,
  p_monthly_rent numeric,
  p_number_of_units integer,
  p_electricity_payment text,
  p_water_availability_days_per_week integer,
  p_water_source text,
  p_room_space_sqm numeric,
  p_deposit_amount numeric,
  p_security_verified boolean,
  p_return_deposit boolean,
  p_gate_hours_from time without time zone,
  p_gate_hours_to time without time zone,
  p_parking_available boolean,
  p_latitude numeric,
  p_longitude numeric,
  p_caretaker_first_name text,
  p_caretaker_last_name text,
  p_caretaker_email text,
  p_caretaker_phone text,
  p_description text DEFAULT NULL::text,
  p_nearby_school_or_institution text DEFAULT NULL::text,
  p_landmark text DEFAULT NULL::text,
  p_contact_phone text DEFAULT NULL::text,
  p_available_from date DEFAULT CURRENT_DATE,
  p_logo_url text DEFAULT NULL::text,
  p_cover_photo_url text DEFAULT NULL::text,
  p_faqs jsonb DEFAULT '[]'::jsonb,
  p_rules jsonb DEFAULT '[]'::jsonb,
  p_created_by_admin_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
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
  v_admin_user_id uuid;
  v_caretaker_full_name text;
BEGIN
  -- ==========================================================================
  -- ADMIN GUARD
  -- ==========================================================================

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only an active admin can create properties and caretaker login accounts'
    );
  END IF;

  v_admin_user_id := COALESCE(p_created_by_admin_id, auth.uid());

  -- ==========================================================================
  -- VALIDATION
  -- ==========================================================================

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property name is required');
  END IF;

  IF p_location IS NULL OR TRIM(p_location) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location is required');
  END IF;

  IF p_property_type IS NULL OR TRIM(p_property_type) = '' THEN
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

  p_caretaker_email := LOWER(TRIM(p_caretaker_email));

  IF p_caretaker_first_name IS NULL OR TRIM(p_caretaker_first_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker first name is required');
  END IF;

  IF p_caretaker_last_name IS NULL OR TRIM(p_caretaker_last_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker last name is required');
  END IF;

  IF p_caretaker_phone IS NULL OR TRIM(p_caretaker_phone) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker phone is required');
  END IF;

  v_caretaker_full_name := TRIM(p_caretaker_first_name) || ' ' || TRIM(p_caretaker_last_name);

  -- Check if caretaker already exists as employee.
  SELECT id INTO v_caretaker_employee_id
  FROM public.employees
  WHERE LOWER(TRIM(email)) = p_caretaker_email
    AND role_id = 'CARETAKER'
  LIMIT 1;

  IF v_caretaker_employee_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A caretaker with this email already exists. Use a different email or assign an existing caretaker from employee management.'
    );
  END IF;

  -- Reject existing auth accounts to avoid resetting unrelated passwords.
  SELECT id INTO v_caretaker_user_id
  FROM auth.users
  WHERE LOWER(TRIM(email)) = p_caretaker_email
  LIMIT 1;

  IF v_caretaker_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An account with this email already exists. Use a different caretaker email, or assign an existing caretaker from employee management.'
    );
  END IF;

  v_caretaker_user_id := NULL;

  -- Generate password once for auth.users and RPC response (not stored on properties).
  v_password := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));
  v_password := substr(v_password, 1, 4) || '-' || substr(v_password, 5, 4) || '-' || substr(v_password, 9, 4);

  -- ==========================================================================
  -- CREATE OR UPDATE AUTH USER FOR CARETAKER
  -- ==========================================================================

  v_caretaker_user_id := gen_random_uuid();

  INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  is_anonymous,
  email_change,
  recovery_token,
  confirmation_token,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  created_at,
  updated_at
) VALUES (
  v_caretaker_user_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  p_caretaker_email,
  crypt(v_password, gen_salt('bf')),
  now(),
  jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email')
  ),
  jsonb_build_object(
    'full_name', v_caretaker_full_name,
    'role_id', 'CARETAKER'
  ),
  false,
  false,
  false,
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  now(),
  now()
);

  -- ==========================================================================
  -- CREATE OR REPAIR AUTH IDENTITY FOR EMAIL LOGIN
      -- ==========================================================================
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_caretaker_user_id,
      p_caretaker_email,
      'email',
      jsonb_build_object(
        'sub', v_caretaker_user_id::text,
        'email', p_caretaker_email,
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      identity_data = EXCLUDED.identity_data,
      updated_at = now();

  -- ==========================================================================
  -- CREATE OR UPDATE PUBLIC PROFILE FOR CARETAKER
  -- ==========================================================================

  INSERT INTO public.profiles (
    user_id,
    role_id,
    email,
    full_name,
    phone_number,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_caretaker_user_id,
    'CARETAKER',
    p_caretaker_email,
    v_caretaker_full_name,
    p_caretaker_phone,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    role_id = EXCLUDED.role_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    is_active = EXCLUDED.is_active,
    updated_at = now();

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
    p_monthly_rent,
    p_monthly_rent,
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
    NULL,
    v_caretaker_user_id,
    NULL,
    p_nearby_school_or_institution,
    p_landmark,
    p_contact_phone,
    p_available_from,
    p_logo_url,
    p_cover_photo_url,
    v_admin_user_id,
    CASE WHEN p_security_verified THEN 'VERIFIED' ELSE 'PENDING_VERIFICATION' END,
    'PUBLISHED',
    now(),
    now()
  )
  RETURNING id INTO v_property_id;

  -- ==========================================================================
  -- CREATE CARETAKER EMPLOYEE
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
    v_caretaker_full_name,
    p_caretaker_email,
    p_caretaker_phone,
    v_property_id,
    'ACTIVE',
    v_admin_user_id,
    now(),
    now()
  )
  RETURNING id INTO v_caretaker_employee_id;

  -- Update property with caretaker employee reference.
  UPDATE public.properties
  SET
    caretaker_employee_id = v_caretaker_employee_id,
    updated_at = now()
  WHERE id = v_property_id;

  -- ==========================================================================
  -- CREATE UNITS
  -- ==========================================================================

  FOR v_unit_counter IN 1..p_number_of_units LOOP
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
      now(),
      now()
    );
  END LOOP;

  -- ==========================================================================
  -- CREATE FAQS
  -- ==========================================================================

  IF p_faqs IS NOT NULL AND jsonb_typeof(p_faqs) = 'array' AND jsonb_array_length(p_faqs) > 0 THEN
    FOR v_faq_item IN SELECT * FROM jsonb_array_elements(p_faqs)
    LOOP
      IF v_faq_item->>'question' IS NOT NULL AND TRIM(v_faq_item->>'question') != '' THEN
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
          now(),
          now()
        );
      END IF;
    END LOOP;
  END IF;

  -- ==========================================================================
  -- CREATE RULES
  -- ==========================================================================

  IF p_rules IS NOT NULL AND jsonb_typeof(p_rules) = 'array' AND jsonb_array_length(p_rules) > 0 THEN
    FOR v_rule_item IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
      IF COALESCE(
        NULLIF(TRIM(v_rule_item->>'rule_text'), ''),
        NULLIF(TRIM(v_rule_item->>'text'), '')
      ) IS NOT NULL THEN
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
          COALESCE(
            NULLIF(TRIM(v_rule_item->>'rule_text'), ''),
            NULLIF(TRIM(v_rule_item->>'text'), '')
          ),
          true,
          now(),
          now()
        );
      END IF;
    END LOOP;
  END IF;

  -- ==========================================================================
  -- VERIFY AUTH USER + AUTH IDENTITY + PROFILE + EMPLOYEE EXISTS
  -- ==========================================================================

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = v_caretaker_user_id
      AND LOWER(TRIM(email)) = p_caretaker_email
  ) THEN
    RAISE EXCEPTION 'Auth user verification failed for %', p_caretaker_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_caretaker_user_id
      AND provider = 'email'
  ) THEN
    RAISE EXCEPTION 'Auth identity verification failed for %', p_caretaker_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = v_caretaker_user_id
      AND role_id = 'CARETAKER'
  ) THEN
    RAISE EXCEPTION 'Caretaker profile verification failed for %', p_caretaker_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE id = v_caretaker_employee_id
      AND user_id = v_caretaker_user_id
      AND role_id = 'CARETAKER'
      AND assigned_property_id = v_property_id
  ) THEN
    RAISE EXCEPTION 'Caretaker employee verification failed for property %', v_property_id;
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
    'auth_user_verified', true,
    'auth_identity_verified', true,
    'profile_verified', true,
    'employee_verified', true,
    'debug_info', jsonb_build_object(
      'function_version', '3.0_auth_identity_fix',
      'auth_users_upsert', true,
      'auth_identities_upsert', true,
      'profile_upsert', true,
      'admin_guard', true
    ),
    'message', 'Property created successfully with ' || p_number_of_units || ' units'
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$function$;


-- ============================================================
-- JSON WRAPPER: keep frontend payload-based call working
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_property_complete_json(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_data jsonb;
BEGIN
  v_data := p_payload;

  RETURN public.create_property_complete(
    v_data->>'name',
    v_data->>'location',
    v_data->>'property_type',
    (v_data->>'monthly_rent')::numeric,
    (v_data->>'number_of_units')::integer,
    v_data->>'electricity_payment',
    COALESCE(
      NULLIF(v_data->>'water_availability_days_per_week', '')::integer,
      NULLIF(v_data->>'water_availability_days', '')::integer,
      7
    ),
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
    v_data->>'description',
    v_data->>'nearby_school_or_institution',
    v_data->>'landmark',
    v_data->>'contact_phone',
    COALESCE(NULLIF(v_data->>'available_from', '')::date, CURRENT_DATE),
    v_data->>'logo_url',
    v_data->>'cover_photo_url',
    COALESCE(v_data->'faqs', '[]'::jsonb),
    COALESCE(v_data->'rules', '[]'::jsonb),
    auth.uid()
  );
END;
$function$;
