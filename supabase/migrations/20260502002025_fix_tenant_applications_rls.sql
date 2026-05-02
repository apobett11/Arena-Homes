-- Drop old policies
DROP POLICY IF EXISTS tenant_applications_insert_own ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_select_own_or_staff ON public.tenant_applications;
DROP POLICY IF EXISTS tenant_applications_manage_staff ON public.tenant_applications;

-- Anyone can submit applications (anonymous)
CREATE POLICY tenant_applications_insert_anonymous ON public.tenant_applications FOR INSERT
  WITH CHECK (true);

-- Only caretaker of the property can view
CREATE POLICY tenant_applications_select_caretaker ON public.tenant_applications FOR SELECT
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
  );

-- Only caretaker can update
CREATE POLICY tenant_applications_update_caretaker ON public.tenant_applications FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
  );