-- ============================================================================
-- ARENA HOMES - PROPERTY PHOTO SYSTEM MIGRATION
-- Version: 1.0.0
-- Purpose: Complete property photo system with Supabase Storage integration
--          - Storage-scoped paths (not URLs in DB)
--          - Photo type classification (COVER, GATE, GALLERY)
--          - Display order enforcement (1-10)
--          - RLS policies for caretaker/admin management
-- Date: May 10, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: PHOTO TYPE ENUM
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_photo_type') THEN
    CREATE TYPE public.property_photo_type AS ENUM ('COVER', 'GATE', 'GALLERY');
  END IF;
END $$;

-- ============================================================================
-- PART 2: ENHANCE PROPERTY_PHOTOS TABLE
-- ============================================================================

-- Add new columns to existing property_photos table (if exists) or create fresh
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'property-photos',
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS photo_type public.property_photo_type NOT NULL DEFAULT 'GALLERY',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Migrate existing data: if photo_url exists but storage_path is null
UPDATE public.property_photos
SET 
  storage_path = COALESCE(storage_path, regexp_replace(photo_url, '^https?://[^/]+/', '')),
  photo_type = CASE 
    WHEN is_primary = true THEN 'COVER'::public.property_photo_type 
    ELSE 'GALLERY'::public.property_photo_type 
  END,
  display_order = sort_order
WHERE storage_path IS NULL;

-- Make storage_path required after migration
ALTER TABLE public.property_photos
  ALTER COLUMN storage_path SET NOT NULL;

-- ============================================================================
-- PART 3: CONSTRAINTS AND INDEXES
-- ============================================================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_property_photos_property;
DROP INDEX IF EXISTS idx_property_photos_unit;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_property_photos_property_type 
  ON public.property_photos(property_id, photo_type);

CREATE INDEX IF NOT EXISTS idx_property_photos_property_order 
  ON public.property_photos(property_id, display_order);

CREATE INDEX IF NOT EXISTS idx_property_photos_cover 
  ON public.property_photos(property_id) 
  WHERE photo_type = 'COVER';

CREATE INDEX IF NOT EXISTS idx_property_photos_gate 
  ON public.property_photos(property_id) 
  WHERE photo_type = 'GATE';

-- Unique constraint: Only one COVER per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_photos_unique_cover 
  ON public.property_photos(property_id) 
  WHERE photo_type = 'COVER';

-- Unique constraint: Only one GATE per property  
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_photos_unique_gate 
  ON public.property_photos(property_id) 
  WHERE photo_type = 'GATE';

-- Unique constraint: display_order must be unique per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_photos_unique_order 
  ON public.property_photos(property_id, display_order);

-- Check constraint: display_order must be between 1 and 10
ALTER TABLE public.property_photos
  DROP CONSTRAINT IF EXISTS chk_display_order_range;

ALTER TABLE public.property_photos
  ADD CONSTRAINT chk_display_order_range 
  CHECK (display_order >= 1 AND display_order <= 10);

-- Check constraint: COVER must be order 1, GATE must be order 2
ALTER TABLE public.property_photos
  DROP CONSTRAINT IF EXISTS chk_photo_type_order;

ALTER TABLE public.property_photos
  ADD CONSTRAINT chk_photo_type_order
  CHECK (
    (photo_type = 'COVER' AND display_order = 1) OR
    (photo_type = 'GATE' AND display_order = 2) OR
    (photo_type = 'GALLERY' AND display_order >= 3 AND display_order <= 10)
  );

-- ============================================================================
-- PART 4: RLS POLICIES
-- ============================================================================

-- Enable RLS (if not already enabled)
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS property_photos_public_select ON public.property_photos;
DROP POLICY IF EXISTS property_photos_admin_insert ON public.property_photos;
DROP POLICY IF EXISTS property_photos_admin_delete ON public.property_photos;
DROP POLICY IF EXISTS property_photos_caretaker_manage ON public.property_photos;
DROP POLICY IF EXISTS property_photos_caretaker_insert ON public.property_photos;
DROP POLICY IF EXISTS property_photos_caretaker_update ON public.property_photos;
DROP POLICY IF EXISTS property_photos_caretaker_delete ON public.property_photos;

-- Public can view all property photos (for listings)
CREATE POLICY property_photos_public_select
  ON public.property_photos
  FOR SELECT
  USING (true);

-- Admin can do everything
CREATE POLICY property_photos_admin_all
  ON public.property_photos
  FOR ALL
  USING (public.is_admin() OR public.has_role('PROPERTY_MANAGER'));

-- Caretaker can manage photos for their assigned property only
CREATE POLICY property_photos_caretaker_insert
  ON public.property_photos
  FOR INSERT
  WITH CHECK (
    public.has_role('CARETAKER') AND 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
      AND e.assigned_property_id = property_photos.property_id
    )
  );

CREATE POLICY property_photos_caretaker_update
  ON public.property_photos
  FOR UPDATE
  USING (
    public.has_role('CARETAKER') AND 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
      AND e.assigned_property_id = property_photos.property_id
    )
  );

CREATE POLICY property_photos_caretaker_delete
  ON public.property_photos
  FOR DELETE
  USING (
    public.has_role('CARETAKER') AND 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
      AND e.assigned_property_id = property_photos.property_id
    )
  );

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to get next available display order for a property
CREATE OR REPLACE FUNCTION public.get_next_photo_order(p_property_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_order integer;
BEGIN
  SELECT COALESCE(MAX(display_order), 0) + 1
  INTO v_next_order
  FROM public.property_photos
  WHERE property_id = p_property_id;
  
  RETURN LEAST(v_next_order, 10);
END;
$$;

-- Function to reorder gallery photos (shift orders to fill gaps)
CREATE OR REPLACE FUNCTION public.reorder_property_photos(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reorder GALLERY photos (3-10) to fill any gaps
  WITH numbered AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY display_order) + 2 as new_order
    FROM public.property_photos
    WHERE property_id = p_property_id
    AND photo_type = 'GALLERY'
  )
  UPDATE public.property_photos pp
  SET display_order = numbered.new_order
  FROM numbered
  WHERE pp.id = numbered.id
  AND numbered.new_order <= 10;
END;
$$;

-- Function to get property photos with public URLs
CREATE OR REPLACE FUNCTION public.get_property_photos_with_urls(
  p_property_id uuid,
  p_storage_base_url text DEFAULT 'https://supabase.studio/storage/v1/object/public'
)
RETURNS TABLE (
  id uuid,
  property_id uuid,
  storage_path text,
  photo_type public.property_photo_type,
  display_order integer,
  alt_text text,
  public_url text,
  width integer,
  height integer,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    pp.id,
    pp.property_id,
    pp.storage_path,
    pp.photo_type,
    pp.display_order,
    pp.alt_text,
    p_storage_base_url || '/' || pp.storage_bucket || '/' || pp.storage_path as public_url,
    pp.width,
    pp.height,
    pp.created_at
  FROM public.property_photos pp
  WHERE pp.property_id = p_property_id
  ORDER BY pp.display_order;
$$;

-- Function to get cover photo for listing cards
CREATE OR REPLACE FUNCTION public.get_property_cover_photo(
  p_property_id uuid,
  p_storage_base_url text DEFAULT 'https://supabase.studio/storage/v1/object/public'
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(
      p_storage_base_url || '/' || pp.storage_bucket || '/' || pp.storage_path,
      p.cover_photo_url,
      p.logo_url
    )
  FROM public.properties p
  LEFT JOIN public.property_photos pp 
    ON pp.property_id = p.id 
    AND pp.photo_type = 'COVER'
  WHERE p.id = p_property_id;
$$;

-- Function to count property photos
CREATE OR REPLACE FUNCTION public.get_property_photo_count(p_property_id uuid)
RETURNS TABLE (
  total_count integer,
  has_cover boolean,
  has_gate boolean,
  gallery_count integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COUNT(*)::integer as total_count,
    EXISTS (SELECT 1 FROM public.property_photos WHERE property_id = p_property_id AND photo_type = 'COVER') as has_cover,
    EXISTS (SELECT 1 FROM public.property_photos WHERE property_id = p_property_id AND photo_type = 'GATE') as has_gate,
    (SELECT COUNT(*)::integer FROM public.property_photos WHERE property_id = p_property_id AND photo_type = 'GALLERY') as gallery_count
  FROM public.property_photos
  WHERE property_id = p_property_id;
$$;

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_photo_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_property_photos_updated ON public.property_photos;

CREATE TRIGGER trigger_property_photos_updated
  BEFORE UPDATE ON public.property_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photo_timestamp();

-- Auto-update properties.cover_photo_url when COVER photo changes
CREATE OR REPLACE FUNCTION public.sync_cover_photo_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.photo_type = 'COVER' THEN
    UPDATE public.properties
    SET cover_photo_url = NEW.photo_url
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_cover_photo ON public.property_photos;

CREATE TRIGGER trigger_sync_cover_photo
  AFTER INSERT OR UPDATE OF photo_url ON public.property_photos
  FOR EACH ROW
  WHEN (NEW.photo_type = 'COVER')
  EXECUTE FUNCTION public.sync_cover_photo_url();

-- ============================================================================
-- PART 7: STORAGE BUCKET SETUP (Documentation)
-- ============================================================================
/*
  IMPORTANT: Create the following storage bucket via Supabase Dashboard or CLI:
  
  Bucket Name: property-photos
  Public Access: true (for listing performance)
  
  Folder Structure:
  - property-photos/{property_id}/cover.{ext}
  - property-photos/{property_id}/gate.{ext}
  - property-photos/{property_id}/gallery/photo-01.{ext}
  - property-photos/{property_id}/gallery/photo-02.{ext}
  ... up to photo-08.{ext}
  
  Storage Object Policies (apply via SQL or Dashboard):
  
  1. Public read access:
  CREATE POLICY "property-photos-public-read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');
  
  2. Admin/Caretaker upload:
  CREATE POLICY "property-photos-admin-upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos' AND
    (public.is_admin() OR public.has_role('CARETAKER'))
  );
  
  3. Admin/Caretaker delete:
  CREATE POLICY "property-photos-admin-delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos' AND
    (public.is_admin() OR public.has_role('CARETAKER'))
  );
*/

-- ============================================================================
-- PART 8: VIEWS FOR FRONTEND
-- ============================================================================

-- View for listing cards (cover photo only)
CREATE OR REPLACE VIEW public.property_listing_photos AS
SELECT 
  p.id as property_id,
  p.cover_photo_url as fallback_url,
  pp.storage_path as cover_storage_path,
  pp.storage_bucket as cover_storage_bucket,
  CASE 
    WHEN pp.storage_path IS NOT NULL 
    THEN pp.storage_bucket || '/' || pp.storage_path
    ELSE p.cover_photo_url
  END as listing_image_url
FROM public.properties p
LEFT JOIN public.property_photos pp 
  ON pp.property_id = p.id 
  AND pp.photo_type = 'COVER';

-- View for property detail carousel (all photos in order)
CREATE OR REPLACE VIEW public.property_carousel_photos AS
SELECT 
  pp.id,
  pp.property_id,
  pp.storage_bucket,
  pp.storage_path,
  pp.photo_type,
  pp.display_order,
  pp.alt_text,
  pp.width,
  pp.height,
  pp.storage_bucket || '/' || pp.storage_path as full_path,
  CASE pp.display_order
    WHEN 1 THEN 'Cover Photo'
    WHEN 2 THEN 'Gate Photo'
    ELSE 'Interior Photo ' || (pp.display_order - 2)::text
  END as display_label
FROM public.property_photos pp
ORDER BY pp.property_id, pp.display_order;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.property_photos IS 'Property photo metadata with Supabase Storage paths. Stores only paths, never binary data.';
