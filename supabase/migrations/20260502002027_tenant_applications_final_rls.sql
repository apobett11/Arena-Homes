-- Final RLS policy for tenant_applications
-- Anyone can submit applications, only caretaker can view/manage their property's applications

-- Drop all existing policies first
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
        EXECUTE format('DROP POLICY %I ON public.tenant_applications', pol.policyname);
    END LOOP;
END $$;

-- Anonymous users can submit applications
CREATE POLICY tenant_applications_insert_all ON public.tenant_applications FOR INSERT
  WITH CHECK (true);

-- Caretaker can view applications for their assigned property
CREATE POLICY tenant_applications_select_caretaker ON public.tenant_applications FOR SELECT
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- Caretaker can update applications for their assigned property
CREATE POLICY tenant_applications_update_caretaker ON public.tenant_applications FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );
