-- Fix: Allow anonymous users to read properties that are published or verified
-- This ensures the property detail page works for non-authenticated users

-- Update the can_read_property function to explicitly allow anon access to published/verified properties
CREATE OR REPLACE FUNCTION public.can_read_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Always allow access to published or verified properties for everyone
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = p_property_id
        AND (p.listing_status = 'PUBLISHED' OR p.verification_status = 'VERIFIED')
    )
    OR public.is_admin()
    OR public.is_caretaker()
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.user_id = auth.uid() AND t.property_id = p_property_id
    );
$$;

-- Also update properties table to ensure RLS allows public read for published properties
DROP POLICY IF EXISTS properties_select_public_or_auth ON public.properties;
CREATE POLICY properties_select_public_or_auth ON public.properties FOR SELECT
  USING (
    public.can_read_property(id) 
    OR public.is_admin() 
    OR caretaker_user_id = auth.uid()
    OR listing_status = 'PUBLISHED'
    OR verification_status = 'VERIFIED'
  );

-- Ensure anon can access units of published/verified properties
DROP POLICY IF EXISTS units_select_accessible ON public.units;
CREATE POLICY units_select_accessible ON public.units FOR SELECT
  USING (
    public.can_read_property(property_id) 
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.unit_id = id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.listing_status = 'PUBLISHED' OR p.verification_status = 'VERIFIED'))
  );

-- Ensure property_rules are accessible for published properties
DROP POLICY IF EXISTS property_rules_select_public ON public.property_rules;
CREATE POLICY property_rules_select_public ON public.property_rules FOR SELECT
  USING (
    is_active = true 
    AND (
      public.can_read_property(property_id) 
      OR public.is_admin()
      OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.listing_status = 'PUBLISHED' OR p.verification_status = 'VERIFIED'))
    )
  );

-- Ensure property_faqs are accessible for published properties
DROP POLICY IF EXISTS property_faqs_select_public ON public.property_faqs;
CREATE POLICY property_faqs_select_public ON public.property_faqs FOR SELECT
  USING (
    is_active = true 
    AND (
      public.can_read_property(property_id) 
      OR public.is_admin()
      OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.listing_status = 'PUBLISHED' OR p.verification_status = 'VERIFIED'))
    )
  );

-- Grant select on necessary tables to anon role
GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.units TO anon;
GRANT SELECT ON public.property_rules TO anon;
GRANT SELECT ON public.property_faqs TO anon;
GRANT SELECT ON public.property_reviews TO anon;
GRANT SELECT ON public.employees TO anon;
GRANT SELECT ON public.site_settings TO anon;
