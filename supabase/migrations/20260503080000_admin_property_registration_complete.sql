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
-- PART 6-8 SKIPPED: Function, helper functions, and view are defined in
-- migration 20260503090000_fix_property_registration_params.sql
-- ============================================================================

-- ============================================================================
-- PART 9: RLS POLICY FOR ADMIN PROPERTY CREATION
-- ============================================================================

-- Ensure properties table has RLS enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy for admin insert
DROP POLICY IF EXISTS "admin_properties_insert_policy" ON public.properties;
CREATE POLICY "admin_properties_insert_policy" ON public.properties
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Policy for admin update
DROP POLICY IF EXISTS "admin_properties_update_policy" ON public.properties;
CREATE POLICY "admin_properties_update_policy" ON public.properties
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy for admin delete
DROP POLICY IF EXISTS "admin_properties_delete_policy" ON public.properties;
CREATE POLICY "admin_properties_delete_policy" ON public.properties
FOR DELETE TO authenticated
USING (public.is_admin());

-- Policy for read (all authenticated users can read)
DROP POLICY IF EXISTS "properties_read_policy" ON public.properties;
CREATE POLICY "properties_read_policy" ON public.properties
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Note: The create_property_complete function is defined in migration
-- 20260503090000_fix_property_registration_params.sql with correct parameter order
