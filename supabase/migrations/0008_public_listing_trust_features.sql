-- Migration 0007: Public Listing Trust Features
-- Purpose: Add verification, location, and trust signals to public listings

-- 1. Expand unit_status enum to include full availability lifecycle
DO $$
BEGIN
  -- Create new enum type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_availability_status') THEN
    CREATE TYPE public.unit_availability_status AS ENUM (
      'AVAILABLE',
      'RESERVED', 
      'OCCUPIED',
      'UNDER_MAINTENANCE',
      'UNAVAILABLE'
    );
  END IF;
END $$;

-- 2. Add verification_status to properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.properties 
      ADD COLUMN verification_status text NOT NULL DEFAULT 'UNVERIFIED';
  END IF;
END $$;

-- Add constraint for verification_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_verification_status_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_verification_status_check
      CHECK (verification_status IN ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'FLAGGED'));
  END IF;
END $$;

-- 3. Add location coordinates to properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN latitude decimal(10, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN longitude decimal(11, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'gate_latitude'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN gate_latitude decimal(10, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'gate_longitude'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN gate_longitude decimal(11, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'school_gate_distance_meters'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN school_gate_distance_meters integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'landmark'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN landmark text;
  END IF;
END $$;

-- 4. Add unit-level enhancements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE public.units 
      ADD COLUMN availability_status public.unit_availability_status NOT NULL DEFAULT 'AVAILABLE';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE public.units ADD COLUMN deposit_amount numeric(10, 2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE public.units ADD COLUMN amenities jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE public.units ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'photos'
  ) THEN
    ALTER TABLE public.units ADD COLUMN photos text[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- 5. Create suspicious_reports table
CREATE TABLE IF NOT EXISTS public.suspicious_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN (
    'FAKE_CARETAKER', 'FAKE_LISTING', 'FRAUDULENT_PAYMENT', 
    'HARASSMENT', 'MISLEADING_INFO', 'PROPERTY_NOT_EXIST', 'OTHER'
  )),
  description text,
  contact_phone text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create property_photos table for multiple photos per property
CREATE TABLE IF NOT EXISTS public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_verification_status ON public.properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON public.properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_distance ON public.properties(school_gate_distance_meters) WHERE school_gate_distance_meters IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_units_availability ON public.units(availability_status);
CREATE INDEX IF NOT EXISTS idx_units_property_status ON public.units(property_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_property ON public.suspicious_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_status ON public.suspicious_reports(status);
CREATE INDEX IF NOT EXISTS idx_property_photos_property ON public.property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_unit ON public.property_photos(unit_id);

-- 8. Enable RLS on new tables
ALTER TABLE public.suspicious_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for suspicious_reports
DROP POLICY IF EXISTS suspicious_reports_insert ON public.suspicious_reports;
CREATE POLICY suspicious_reports_insert
  ON public.suspicious_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR reporter_email IS NOT NULL);

DROP POLICY IF EXISTS suspicious_reports_select_own ON public.suspicious_reports;
CREATE POLICY suspicious_reports_select_own
  ON public.suspicious_reports
  FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin() OR public.has_role('PROPERTY_MANAGER'));

DROP POLICY IF EXISTS suspicious_reports_admin_all ON public.suspicious_reports;
CREATE POLICY suspicious_reports_admin_all
  ON public.suspicious_reports
  FOR ALL
  USING (public.is_admin() OR public.has_role('PROPERTY_MANAGER'));

-- 10. RLS Policies for property_photos
DROP POLICY IF EXISTS property_photos_public_select ON public.property_photos;
CREATE POLICY property_photos_public_select
  ON public.property_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS property_photos_admin_insert ON public.property_photos;
CREATE POLICY property_photos_admin_insert
  ON public.property_photos
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('CARETAKER') OR public.has_role('PROPERTY_MANAGER'));

DROP POLICY IF EXISTS property_photos_admin_delete ON public.property_photos;
CREATE POLICY property_photos_admin_delete
  ON public.property_photos
  FOR DELETE
  USING (public.is_admin() OR public.has_role('PROPERTY_MANAGER'));

-- 11. Create function to calculate walking time from distance
CREATE OR REPLACE FUNCTION public.calculate_walking_time(distance_meters integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  -- Average walking speed: ~1.4 m/s or ~5 km/h
  -- Returns minutes
  SELECT GREATEST(1, ROUND(distance_meters / 83.0))::integer;
$$;

-- 12. Create function to auto-update last_updated on units
CREATE OR REPLACE FUNCTION public.update_unit_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_unit_last_updated ON public.units;
CREATE TRIGGER trigger_update_unit_last_updated
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unit_last_updated();

-- 13. Create view for public listings (safe, minimal data)
CREATE OR REPLACE VIEW public.public_listings AS
SELECT 
  u.id as unit_id,
  u.property_id,
  u.type as unit_type,
  u.description as unit_description,
  u.base_price as rent_amount,
  u.deposit_amount,
  u.availability_status,
  u.amenities as unit_amenities,
  u.photos as unit_photos,
  u.last_updated,
  p.name as property_name,
  p.location as property_location,
  p.latitude as property_latitude,
  p.longitude as property_longitude,
  p.gate_latitude,
  p.gate_longitude,
  p.school_gate_distance_meters,
  p.landmark,
  p.verification_status as property_verification_status,
  p.logo_url as property_logo,
  CASE 
    WHEN p.school_gate_distance_meters IS NOT NULL 
    THEN public.calculate_walking_time(p.school_gate_distance_meters)
    ELSE NULL 
  END as walking_time_minutes,
  pp.photo_url as primary_photo_url
FROM public.units u
JOIN public.properties p ON u.property_id = p.id
LEFT JOIN public.property_photos pp ON pp.unit_id = u.id AND pp.is_primary = true
WHERE p.verification_status != 'SUSPENDED'
  AND u.availability_status NOT IN ('UNAVAILABLE', 'UNDER_MAINTENANCE');

-- Grant access to the view
GRANT SELECT ON public.public_listings TO anon;
GRANT SELECT ON public.public_listings TO authenticated;

COMMENT ON VIEW public.public_listings IS 'Public-safe view of available units for listings page';
