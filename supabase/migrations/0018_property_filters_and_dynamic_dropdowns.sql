-- ============================================================================
-- ARENA HOMES - Property Filters and Dynamic Dropdowns Migration
-- Purpose: Ensure properties have required columns and add functions for
--          fetching dynamic locations and types for filter dropdowns
-- Date: May 1, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: ENSURE REQUIRED COLUMNS EXIST ON PROPERTIES TABLE
-- ============================================================================

-- Ensure location column exists
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS location text;

-- Ensure price_min column exists  
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS price_min numeric(12, 2);

-- Ensure price_max column exists
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS price_max numeric(12, 2);

-- Ensure property_type column exists
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type text DEFAULT 'SINGLE';

-- ============================================================================
-- PART 2: UPDATE public_properties_view TO INCLUDE NEW FIELDS
-- ============================================================================

-- Drop and recreate the view with updated fields
DROP VIEW IF EXISTS public.public_properties_view;

CREATE VIEW public.public_properties_view AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.location,
    p.property_type,
    p.logo_url,
    p.cover_photo_url,
    p.verification_status,
    p.latitude,
    p.longitude,
    p.price_min,
    p.price_max,
    p.school_gate_distance_meters,
    p.created_at,
    -- Count total units
    COALESCE(unit_counts.total_units, 0) as total_rooms,
    -- Count vacant units
    COALESCE(unit_counts.vacant_units, 0) as vacant_rooms,
    -- Count occupied units
    COALESCE(unit_counts.occupied_units, 0) as occupied_rooms,
    -- Overall rating (average of all reviews)
    COALESCE(review_stats.avg_rating, 0) as overall_rating,
    -- Review count
    COALESCE(review_stats.review_count, 0) as review_count,
    -- Likes count
    COALESCE(like_counts.likes_count, 0) as likes_count,
    -- Tenant count
    COALESCE(tenant_counts.tenant_count, 0) as tenant_count,
    -- Caretaker info
    e.id as caretaker_employee_id,
    e.full_name as caretaker_name,
    e.phone_number as caretaker_phone,
    e.email as caretaker_email,
    CASE WHEN e.id IS NOT NULL THEN true ELSE false END as caretaker_assigned
FROM 
    public.properties p
LEFT JOIN (
    SELECT 
        property_id,
        COUNT(*) as total_units,
        COUNT(*) FILTER (WHERE status = 'VACANT') as vacant_units,
        COUNT(*) FILTER (WHERE status = 'TAKEN') as occupied_units
    FROM public.units
    GROUP BY property_id
) unit_counts ON unit_counts.property_id = p.id
LEFT JOIN (
    SELECT 
        property_id,
        AVG(rating)::numeric(3,1) as avg_rating,
        COUNT(*) as review_count
    FROM public.property_reviews
    GROUP BY property_id
) review_stats ON review_stats.property_id = p.id
LEFT JOIN (
    SELECT 
        property_id,
        COUNT(*) as likes_count
    FROM public.property_likes
    GROUP BY property_id
) like_counts ON like_counts.property_id = p.id
LEFT JOIN (
    SELECT 
        property_id,
        COUNT(*) as tenant_count
    FROM public.tenants
    WHERE status = 'ACTIVE'
    GROUP BY property_id
) tenant_counts ON tenant_counts.property_id = p.id
LEFT JOIN public.employees e ON e.id = p.caretaker_employee_id
WHERE 
    p.listing_status = 'PUBLISHED' 
    OR p.listing_status IS NULL;

-- Grant access to anonymous users
GRANT SELECT ON public.public_properties_view TO anon;
GRANT SELECT ON public.public_properties_view TO authenticated;

-- ============================================================================
-- PART 3: CREATE FUNCTIONS FOR DYNAMIC DROPDOWNS
-- ============================================================================

-- Function to get distinct locations from properties
CREATE OR REPLACE FUNCTION public.get_distinct_locations()
RETURNS TABLE(location text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT DISTINCT p.location 
    FROM public.properties p
    WHERE p.location IS NOT NULL 
      AND p.location != ''
      AND (p.listing_status = 'PUBLISHED' OR p.listing_status IS NULL)
    ORDER BY p.location;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_distinct_locations() TO anon;
GRANT EXECUTE ON FUNCTION public.get_distinct_locations() TO authenticated;

-- Function to get distinct property types from properties
CREATE OR REPLACE FUNCTION public.get_distinct_property_types()
RETURNS TABLE(property_type text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT DISTINCT p.property_type 
    FROM public.properties p
    WHERE p.property_type IS NOT NULL 
      AND p.property_type != ''
      AND (p.listing_status = 'PUBLISHED' OR p.listing_status IS NULL)
    ORDER BY p.property_type;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_distinct_property_types() TO anon;
GRANT EXECUTE ON FUNCTION public.get_distinct_property_types() TO authenticated;

-- Function to get distinct unit types (room types)
CREATE OR REPLACE FUNCTION public.get_distinct_unit_types()
RETURNS TABLE(unit_type text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT DISTINCT u.room_type 
    FROM public.units u
    JOIN public.properties p ON p.id = u.property_id
    WHERE u.room_type IS NOT NULL 
      AND u.room_type != ''
      AND u.is_public = true
      AND (p.listing_status = 'PUBLISHED' OR p.listing_status IS NULL)
    ORDER BY u.room_type;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_distinct_unit_types() TO anon;
GRANT EXECUTE ON FUNCTION public.get_distinct_unit_types() TO authenticated;

-- ============================================================================
-- PART 4: UPDATE EXISTING PROPERTIES WITH DEFAULT VALUES
-- ============================================================================

-- Update properties with location from the existing data if null
UPDATE public.properties
SET location = COALESCE(location, 'Main Gate')
WHERE location IS NULL OR location = '';

-- Update properties with property_type default if null
UPDATE public.properties
SET property_type = COALESCE(property_type, 'SINGLE')
WHERE property_type IS NULL OR property_type = '';

-- Update price_min and price_max based on units if null
UPDATE public.properties p
SET 
    price_min = (
        SELECT MIN(base_price) 
        FROM public.units u 
        WHERE u.property_id = p.id AND u.base_price > 0
    ),
    price_max = (
        SELECT MAX(base_price) 
        FROM public.units u 
        WHERE u.property_id = p.id AND u.base_price > 0
    )
WHERE price_min IS NULL OR price_max IS NULL;

-- ============================================================================
-- PART 5: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for location lookups
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON public.properties(location) 
WHERE location IS NOT NULL;

-- Index for property_type lookups  
CREATE INDEX IF NOT EXISTS idx_properties_property_type 
ON public.properties(property_type) 
WHERE property_type IS NOT NULL;

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_properties_price_range 
ON public.properties(price_min, price_max) 
WHERE price_min IS NOT NULL OR price_max IS NOT NULL;

-- Index for published listings
CREATE INDEX IF NOT EXISTS idx_properties_listing_status 
ON public.properties(listing_status) 
WHERE listing_status = 'PUBLISHED' OR listing_status IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
