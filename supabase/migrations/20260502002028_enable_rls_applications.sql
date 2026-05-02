-- Enable RLS on tenant_applications and set policies
-- This ensures RLS is actually active

-- First enable RLS on the table
ALTER TABLE public.tenant_applications ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too
ALTER TABLE public.tenant_applications FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean slate
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

-- Create fresh policies
-- Anyone can insert applications (anonymous submissions allowed)
CREATE POLICY tenant_applications_insert_all ON public.tenant_applications FOR INSERT
  WITH CHECK (true);

-- Only caretaker of the property or admin can view
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

-- Only caretaker of the property or admin can update
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
