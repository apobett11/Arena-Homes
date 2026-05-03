-- ============================================================================
-- FIX TENANT RLS FOR ONBOARDING
-- Issue: New tenants have user_id = NULL until they complete onboarding
--        RLS policy user_id = auth.uid() fails when user_id is NULL
-- Solution: Also allow access when tenant email matches auth user email
-- ============================================================================

-- ============================================================================
-- FIX TENANTS TABLE RLS POLICY
-- ============================================================================

DROP POLICY IF EXISTS tenants_select_own_or_staff ON public.tenants;

CREATE POLICY tenants_select_own_or_staff ON public.tenants FOR SELECT
  USING (
    -- Tenant can see their own record by user_id
    user_id = auth.uid()
    -- OR tenant can see their record by email match (for onboarding flow when user_id is NULL)
    OR (
      user_id IS NULL 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
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
-- FIX LEASES TABLE RLS POLICY (similar issue - leases created before user_id is set)
-- ============================================================================

DROP POLICY IF EXISTS leases_select_tenant_or_staff ON public.leases;

CREATE POLICY leases_select_tenant_or_staff ON public.leases FOR SELECT
  USING (
    -- Tenant can see their own lease by user_id
    tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid())
    -- OR tenant can see by email match (for onboarding flow)
    OR tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE user_id IS NULL 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    -- Admin can see all
    OR public.is_admin()
    -- Caretaker can see leases in their assigned property
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = leases.property_id
    )
  );

-- ============================================================================
-- FIX ISSUES TABLE RLS POLICY (tenants need to submit issues during onboarding)
-- ============================================================================

DROP POLICY IF EXISTS issues_select_own_or_staff ON public.issues;

CREATE POLICY issues_select_own_or_staff ON public.issues FOR SELECT
  USING (
    -- Tenant can see their own issues by user_id
    tenant_user_id = auth.uid()
    -- OR tenant can see by tenant record email match
    OR tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE user_id IS NULL 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.user_id = auth.uid() 
        AND e.role_id = 'CARETAKER' 
        AND e.assigned_property_id = issues.property_id
    )
  );

-- ============================================================================
-- UPDATE ONBOARDING COMPLETION TO SET USER_ID
-- This function is called when tenant finishes onboarding and sets password
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_onboarding_step(
  p_step text,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_emergency_contact text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_tenant public.tenants%ROWTYPE;
  v_application public.tenant_applications%ROWTYPE;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Find tenant record by email (user_id might be NULL during onboarding)
  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE email = v_user_email
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tenant record found for this email');
  END IF;
  
  -- If this is the password step and user_id is NULL, link the tenant to this user
  IF p_step = 'password' AND v_tenant.user_id IS NULL THEN
    UPDATE public.tenants
    SET user_id = v_user_id,
        status = 'ACTIVE',
        updated_at = now()
    WHERE id = v_tenant.id;
    
    -- Also update the lease to ACTIVE
    UPDATE public.leases
    SET status = 'ACTIVE',
        updated_at = now()
    WHERE tenant_id = v_tenant.id
    AND status = 'PENDING';
    
    -- Update application conversion
    SELECT * INTO v_application
    FROM public.tenant_applications
    WHERE converted_tenant_id = v_tenant.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.tenant_applications
      SET conversion_status = 'CONVERTED',
          converted_user_id = v_user_id,
          updated_at = now()
      WHERE id = v_application.id;
    END IF;
  END IF;
  
  -- Update profile info if provided
  IF p_full_name IS NOT NULL OR p_phone_number IS NOT NULL THEN
    UPDATE public.tenants
    SET full_name = COALESCE(p_full_name, full_name),
        phone_number = COALESCE(p_phone_number, phone_number),
        updated_at = now()
    WHERE id = v_tenant.id;
  END IF;
  
  -- Update emergency contact if provided
  IF p_emergency_contact IS NOT NULL THEN
    UPDATE public.profiles
    SET emergency_contact = p_emergency_contact,
        updated_at = now()
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Onboarding step completed successfully',
    'tenant_id', v_tenant.id
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.complete_onboarding_step(text, text, text, text, text) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
