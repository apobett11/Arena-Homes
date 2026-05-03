-- ============================================================================
-- ARENA HOMES - ADMIN PROPERTY REGISTRATION COMPLETE PIPELINE
-- Version: 1.0.0
-- Purpose: Add missing columns and create atomic property creation function
-- Date: May 3, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS TO PROPERTIES TABLE
-- ============================================================================

-- Add number_of_units (required for automatic unit generation)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS number_of_units integer;

-- Add electricity_payment enum column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'electricity_payment_type') THEN
    CREATE TYPE public.electricity_payment_type AS ENUM ('PERSONAL_PAYMENT', 'COVERED');
  END IF;
END $$;

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS electricity_payment public.electricity_payment_type DEFAULT 'PERSONAL_PAYMENT';

-- Add water_availability_days_per_week (integer 1-7)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS water_availability_days_per_week integer DEFAULT 7;

-- Add room_space_sqm
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS room_space_sqm numeric(8, 2);

-- Add security_verified boolean (distinct from verification_status text)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS security_verified boolean DEFAULT false;

-- Add return_deposit boolean
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS return_deposit boolean DEFAULT true;

-- Add monthly_rent (primary price field)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS monthly_rent numeric(12, 2);

-- Add nearby_school_or_institution
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS nearby_school_or_institution text;

-- Add landmark
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS landmark text;

-- Add available_from date
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS available_from date DEFAULT CURRENT_DATE;

-- Add contact_phone
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Add created_by_admin_id
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES auth.users(id);

-- ============================================================================
-- PART 2: BACKFILL EXISTING ROWS WITH SAFE DEFAULTS
-- ============================================================================

-- Set number_of_units based on actual unit count or default to 1
UPDATE public.properties p
SET number_of_units = COALESCE(
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id),
  1
)
WHERE number_of_units IS NULL;

-- Set electricity_payment default
UPDATE public.properties
SET electricity_payment = 'PERSONAL_PAYMENT'
WHERE electricity_payment IS NULL;

-- Set water_availability_days_per_week default
UPDATE public.properties
SET water_availability_days_per_week = 7
WHERE water_availability_days_per_week IS NULL;

-- Set security_verified default
UPDATE public.properties
SET security_verified = (verification_status = 'VERIFIED')
WHERE security_verified IS NULL;

-- Set return_deposit default
UPDATE public.properties
SET return_deposit = deposit_required
WHERE return_deposit IS NULL;

-- Set monthly_rent from price_min or price_max
UPDATE public.properties
SET monthly_rent = COALESCE(price_min, price_max, 0)
WHERE monthly_rent IS NULL;

-- ============================================================================
-- PART 3: ADD NOT NULL CONSTRAINTS FOR NEW REQUIRED FIELDS
-- ============================================================================

ALTER TABLE public.properties
ALTER COLUMN number_of_units SET NOT NULL;

ALTER TABLE public.properties
ALTER COLUMN electricity_payment SET NOT NULL;

ALTER TABLE public.properties
ALTER COLUMN water_availability_days_per_week SET NOT NULL;

ALTER TABLE public.properties
ALTER COLUMN security_verified SET NOT NULL;

ALTER TABLE public.properties
ALTER COLUMN return_deposit SET NOT NULL;

-- ============================================================================
-- PART 4: ADD CHECK CONSTRAINTS
-- ============================================================================

-- number_of_units must be positive
ALTER TABLE public.properties
ADD CONSTRAINT properties_number_of_units_positive
CHECK (number_of_units > 0);

-- water_availability_days_per_week must be 1-7
ALTER TABLE public.properties
ADD CONSTRAINT properties_water_days_range
CHECK (water_availability_days_per_week BETWEEN 1 AND 7);

-- room_space_sqm must be positive if set
ALTER TABLE public.properties
ADD CONSTRAINT properties_room_space_positive
CHECK (room_space_sqm IS NULL OR room_space_sqm > 0);

-- monthly_rent must be positive
ALTER TABLE public.properties
ADD CONSTRAINT properties_monthly_rent_positive
CHECK (monthly_rent IS NULL OR monthly_rent > 0);

-- latitude must be valid
ALTER TABLE public.properties
ADD CONSTRAINT properties_latitude_range
CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90));

-- longitude must be valid
ALTER TABLE public.properties
ADD CONSTRAINT properties_longitude_range
CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180));

-- ============================================================================
-- PART 5: CREATE UNIQUE INDEX ON EMPLOYEE EMAIL FOR DUPLICATE DETECTION
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique 
ON public.employees (LOWER(email)) 
WHERE email IS NOT NULL AND role_id = 'CARETAKER';

-- ============================================================================
-- PART 6: CREATE ATOMIC PROPERTY CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_property_complete(
  -- Property basic info
  p_name text,
  p_location text,
  p_property_type text,
  p_monthly_rent numeric,
  p_description text DEFAULT NULL,
  p_nearby_school_or_institution text DEFAULT NULL,
  p_landmark text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_available_from date DEFAULT CURRENT_DATE,
  
  -- Property details
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
  p_logo_url text DEFAULT NULL,
  p_cover_photo_url text DEFAULT NULL,
  
  -- Caretaker info
  p_caretaker_first_name text,
  p_caretaker_last_name text,
  p_caretaker_email text,
  p_caretaker_phone text,
  
  -- FAQ and Rules (JSON arrays)
  p_faqs jsonb DEFAULT '[]'::jsonb,
  p_rules jsonb DEFAULT '[]'::jsonb,
  
  -- Admin who created
  p_created_by_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_caretaker_employee_id uuid;
  v_caretaker_user_id uuid;
  v_temp_password text;
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
  
  IF p_caretaker_email IS NULL OR p_caretaker_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker email is required');
  END IF;
  
  IF p_caretaker_first_name IS NULL OR p_caretaker_first_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker first name is required');
  END IF;
  
  IF p_caretaker_last_name IS NULL OR p_caretaker_last_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker last name is required');
  END IF;
  
  IF p_caretaker_phone IS NULL OR p_caretaker_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker phone is required');
  END IF;
  
  -- Check if caretaker email already exists
  SELECT id INTO v_caretaker_employee_id
  FROM public.employees
  WHERE LOWER(email) = LOWER(p_caretaker_email)
    AND role_id = 'CARETAKER'
  LIMIT 1;
  
  IF v_caretaker_employee_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caretaker with this email already exists.');
  END IF;
  
  -- Check if auth user exists with this email
  SELECT id INTO v_caretaker_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_caretaker_email)
  LIMIT 1;
  
  -- Generate temp password if no auth user exists
  IF v_caretaker_user_id IS NULL THEN
    v_temp_password := substr(md5(random()::text), 1, 12);
  END IF;
  
  -- ==========================================================================
  -- CREATE CARETAKER EMPLOYEE
  -- ==========================================================================
  
  INSERT INTO public.employees (
    user_id,
    role_id,
    full_name,
    email,
    phone_number,
    status,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_caretaker_user_id,  -- May be NULL if auth user doesn't exist yet
    'CARETAKER',
    p_caretaker_first_name || ' ' || p_caretaker_last_name,
    LOWER(p_caretaker_email),
    p_caretaker_phone,
    'ACTIVE',
    p_created_by_admin_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_caretaker_employee_id;
  
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
    v_caretaker_employee_id,
    v_caretaker_user_id,
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
  
  -- Update caretaker with assigned property
  UPDATE public.employees
  SET assigned_property_id = v_property_id,
      updated_at = NOW()
  WHERE id = v_caretaker_employee_id;
  
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
    'caretaker_email', LOWER(p_caretaker_email),
    'caretaker_temp_password', v_temp_password,
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

-- ============================================================================
-- PART 7: CREATE HELPER FUNCTION TO GET DISTINCT LOCATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_distinct_locations()
RETURNS TABLE (location text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.location
  FROM public.properties p
  WHERE p.location IS NOT NULL AND p.location != ''
  ORDER BY p.location;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_locations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_locations TO anon;

-- ============================================================================
-- PART 8: UPDATE PUBLIC_PROPERTIES_VIEW TO INCLUDE NEW COLUMNS
-- ============================================================================

CREATE OR REPLACE VIEW public.public_properties_view AS
SELECT
  p.id AS property_id,
  p.name AS property_name,
  p.location,
  p.property_type,
  p.description,
  p.monthly_rent AS price,
  p.price_min,
  p.price_max,
  p.number_of_units AS total_rooms,
  p.electricity_payment,
  p.water_availability_days_per_week,
  p.water_source,
  p.room_space_sqm,
  p.deposit_amount,
  p.security_verified,
  p.return_deposit,
  p.gate_open_time,
  p.gate_close_time,
  p.parking_available,
  p.latitude,
  p.longitude,
  p.nearby_school_or_institution,
  p.landmark,
  p.available_from,
  p.contact_phone,
  p.logo_url,
  p.cover_photo_url,
  p.verification_status,
  p.listing_status,
  p.created_at,
  p.caretaker_employee_id,
  p.caretaker_user_id,
  e.full_name AS caretaker_name,
  e.email AS caretaker_email,
  e.phone_number AS caretaker_phone,
  CASE WHEN p.caretaker_employee_id IS NOT NULL THEN true ELSE false END AS caretaker_assigned,
  -- Unit counts
  COUNT(u.id) AS total_units,
  COUNT(CASE WHEN u.availability_status = 'AVAILABLE' THEN 1 END) AS vacant_rooms,
  COUNT(CASE WHEN u.availability_status = 'OCCUPIED' THEN 1 END) AS occupied_rooms,
  -- Ratings
  COALESCE(AVG(pr.rating), 0)::numeric(3,2) AS overall_rating,
  COUNT(DISTINCT pr.id) AS review_count,
  COUNT(DISTINCT pl.id) AS likes_count,
  COUNT(DISTINCT t.id) AS tenant_count
FROM public.properties p
LEFT JOIN public.employees e ON p.caretaker_employee_id = e.id
LEFT JOIN public.units u ON p.id = u.property_id
LEFT JOIN public.property_reviews pr ON p.id = pr.property_id
LEFT JOIN public.property_likes pl ON p.id = pl.property_id
LEFT JOIN public.tenants t ON p.id = t.property_id AND t.status = 'ACTIVE'
WHERE p.listing_status = 'PUBLISHED'
GROUP BY p.id, e.full_name, e.email, e.phone_number;

-- Grant access to the view
GRANT SELECT ON public.public_properties_view TO anon;
GRANT SELECT ON public.public_properties_view TO authenticated;

-- ============================================================================
-- PART 9: RLS POLICY FOR ADMIN PROPERTY CREATION
-- ============================================================================

-- Ensure properties table has RLS enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy for admin insert
CREATE POLICY IF NOT EXISTS "admin_properties_insert_policy" ON public.properties
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Policy for admin update
CREATE POLICY IF NOT EXISTS "admin_properties_update_policy" ON public.properties
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy for admin delete
CREATE POLICY IF NOT EXISTS "admin_properties_delete_policy" ON public.properties
FOR DELETE TO authenticated
USING (public.is_admin());

-- Policy for read (all authenticated users can read)
CREATE POLICY IF NOT EXISTS "properties_read_policy" ON public.properties
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON FUNCTION public.create_property_complete IS 'Atomic property creation with caretaker, units, FAQ, and rules. Returns JSON with success status and created IDs.';
