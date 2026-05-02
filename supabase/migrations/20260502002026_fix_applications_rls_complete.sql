-- ============================================================================
-- COMPLETE FIX FOR TENANT_APPLICATIONS RLS
-- Drop ALL existing policies on tenant_applications to ensure clean slate
-- ============================================================================

-- Drop all possible policy names that might exist
DROP POLICY IF EXISTS tenant_applications_insert_anonymous ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_insert_own ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_select_own_or_staff ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_select_caretaker ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_manage_staff ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_update_caretaker ON public.tenant_applications;

-- Also drop any other common naming patterns
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tenant_applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_applications', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- CREATE NEW POLICIES
-- ============================================================================

-- POLICY 1: Anyone can submit an application (anonymous inserts allowed)
-- This is the critical fix - allows public submissions without authentication
CREATE POLICY tenant_applications_insert_anonymous ON public.tenant_applications FOR INSERT
  WITH CHECK (true);

-- POLICY 2: Only caretaker assigned to the property or admin can view applications
CREATE POLICY tenant_applications_select_caretaker ON public.tenant_applications FOR SELECT
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- POLICY 3: Only caretaker assigned to the property or admin can update applications
CREATE POLICY tenant_applications_update_caretaker ON public.tenant_applications FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- POLICY 4: Only caretaker or admin can delete applications
CREATE POLICY tenant_applications_delete_caretaker ON public.tenant_applications FOR DELETE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFY POLICIES WERE CREATED
-- ============================================================================

-- List all policies on tenant_applications for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'tenant_applications';
