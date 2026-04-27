-- ============================================================================
-- FIX RLS INFINITE RECURSION
-- Issue: current_assigned_property_id() queries tables with RLS policies
-- Solution: Inline the subqueries in policies instead of using the function
-- ============================================================================

-- ============================================================================
-- FIX TENANTS POLICY
-- ============================================================================

DROP POLICY IF EXISTS tenants_select_own_or_staff ON public.tenants;

CREATE POLICY tenants_select_own_or_staff ON public.tenants FOR SELECT
  USING (
    -- Tenant can see their own record
    user_id = auth.uid()
    -- Admin can see all
    OR public.is_admin()
    -- Caretaker can see tenants in their assigned property
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = tenants.property_id
    )
  );

-- ============================================================================
-- FIX ISSUES POLICY
-- ============================================================================

DROP POLICY IF EXISTS issues_select_own_or_staff ON public.issues;

CREATE POLICY issues_select_own_or_staff ON public.issues FOR SELECT
  USING (
    tenant_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = issues.property_id
    )
  );

DROP POLICY IF EXISTS issues_manage_staff ON public.issues;

CREATE POLICY issues_manage_staff ON public.issues FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = issues.property_id
    )
  );

-- ============================================================================
-- FIX REPAIRS POLICY
-- ============================================================================

DROP POLICY IF EXISTS repairs_select_own_or_staff ON public.repairs;

CREATE POLICY repairs_select_own_or_staff ON public.repairs FOR SELECT
  USING (
    tenant_id = public.current_tenant_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = repairs.property_id
    )
  );

DROP POLICY IF EXISTS repairs_manage_staff ON public.repairs;

CREATE POLICY repairs_manage_staff ON public.repairs FOR ALL
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = repairs.property_id
    )
  )
  WITH CHECK (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = repairs.property_id
    )
  );

-- ============================================================================
-- FIX ANNOUNCEMENTS POLICY
-- ============================================================================

DROP POLICY IF EXISTS announcements_select_published ON public.announcements;

CREATE POLICY announcements_select_published ON public.announcements FOR SELECT
  USING (
    (is_published = true AND (
      is_global = true 
      OR EXISTS (
        SELECT 1 FROM public.employees e 
        WHERE e.user_id = auth.uid() 
          AND e.assigned_property_id = announcements.property_id
      )
      OR EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.user_id = auth.uid() 
          AND t.property_id = announcements.property_id
      )
      OR target_role = public.current_user_role()
    ))
    OR public.is_admin() 
    OR sender_user_id = auth.uid()
  );

DROP POLICY IF EXISTS announcements_manage_staff ON public.announcements;

CREATE POLICY announcements_manage_staff ON public.announcements FOR ALL
  USING (
    public.is_admin() 
    OR sender_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.assigned_property_id = announcements.property_id
    )
  )
  WITH CHECK (
    public.is_admin() 
    OR sender_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.assigned_property_id = announcements.property_id
    )
  );

-- ============================================================================
-- FIX TENANT_APPLICATIONS POLICY
-- ============================================================================

DROP POLICY IF EXISTS tenant_applications_select_own_or_staff ON public.tenant_applications;

CREATE POLICY tenant_applications_select_own_or_staff ON public.tenant_applications FOR SELECT
  USING (
    applicant_user_id = auth.uid() 
    OR public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = tenant_applications.property_id
    )
  );

DROP POLICY IF EXISTS tenant_applications_manage_staff ON public.tenant_applications;

CREATE POLICY tenant_applications_manage_staff ON public.tenant_applications FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
