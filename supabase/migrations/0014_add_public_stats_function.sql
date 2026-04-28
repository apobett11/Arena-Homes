-- Create a public function to get tenant count that bypasses RLS
-- This allows anonymous users to see the "Happy Students" count on the homepage

-- Function to get total active tenant count (public access)
CREATE OR REPLACE FUNCTION public.get_active_tenant_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer 
  FROM public.tenants 
  WHERE status = 'active';
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_active_tenant_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_tenant_count() TO authenticated;

-- Also add a public stats view for homepage metrics
CREATE OR REPLACE VIEW public.public_stats AS
SELECT 
  (SELECT COUNT(*)::integer FROM public.tenants WHERE status = 'active') as active_tenants,
  (SELECT COUNT(*)::integer FROM public.properties WHERE verification_status = 'VERIFIED') as verified_properties,
  (SELECT COUNT(*)::integer FROM public.units WHERE status = 'VACANT') as vacant_units;

-- Grant access to the view
GRANT SELECT ON public.public_stats TO anon;
GRANT SELECT ON public.public_stats TO authenticated;
