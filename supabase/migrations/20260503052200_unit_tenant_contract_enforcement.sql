-- ============================================================================
-- MIGRATION: Unit-Tenant Contract Enforcement
-- Purpose:
--   1. Add current_tenant_id to units table (source of truth for occupancy)
--   2. Update accept_application RPC to atomically assign tenant to unit
--   3. Create database constraints to prevent inconsistent states
--   4. Update views to use current_tenant_id for accurate counts
--   5. Add vacate_unit RPC for proper move-out flow
-- ============================================================================

-- ============================================================================
-- PART 1: Add current_tenant_id column to units table
-- ============================================================================

-- Add the column (nullable, will be populated by accept_application)
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS current_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_units_current_tenant_id ON public.units(current_tenant_id);

-- Create index for vacancy queries
CREATE INDEX IF NOT EXISTS idx_units_vacancy ON public.units(property_id, availability_status) WHERE current_tenant_id IS NULL;

-- ============================================================================
-- PART 2: Create unique constraint - one active tenant per unit
-- ============================================================================

-- Ensure only one active tenant can be assigned to a unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_tenant_per_unit
ON public.tenants (unit_id)
WHERE status IN ('ACTIVE', 'PENDING_SETUP');

-- ============================================================================
-- PART 3: Update accept_application RPC with atomic unit-tenant assignment
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_application(
  p_application_id uuid,
  p_assigned_unit_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caretaker_user_id uuid := auth.uid();
  v_application public.tenant_applications%ROWTYPE;
  v_caretaker public.employees%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_unit public.units%ROWTYPE;
  v_new_tenant_id uuid;
  v_lease_id uuid;
  v_default_end_date date;
BEGIN
  v_default_end_date := COALESCE(p_end_date, CURRENT_DATE + INTERVAL '1 year');

  -- Get application (must be WAITING)
  SELECT * INTO v_application
  FROM public.tenant_applications
  WHERE id = p_application_id AND status = 'WAITING';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or not in WAITING status');
  END IF;

  -- Verify caretaker authorization
  SELECT * INTO v_caretaker
  FROM public.employees
  WHERE user_id = v_caretaker_user_id AND role_id = 'CARETAKER'
  LIMIT 1;

  IF v_caretaker.assigned_property_id IS NULL OR v_caretaker.assigned_property_id != v_application.property_id THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this property');
    END IF;
  END IF;

  -- Validate unit is provided
  IF p_assigned_unit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit must be assigned when accepting application');
  END IF;

  -- Get and lock the unit row
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_assigned_unit_id AND property_id = v_application.property_id
  FOR UPDATE;  -- Lock to prevent race conditions

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid unit - does not exist or not in this property');
  END IF;

  -- Check unit is actually available (has no tenant assigned)
  IF v_unit.current_tenant_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit already has a tenant assigned');
  END IF;

  IF v_unit.availability_status = 'OCCUPIED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit is already occupied');
  END IF;

  -- Check no other active tenant is assigned to this unit
  IF EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE unit_id = p_assigned_unit_id 
    AND status IN ('ACTIVE', 'PENDING_SETUP')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit already has an active tenant');
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = v_application.property_id;

  -- ==================================================================
  -- ATOMIC TRANSACTION: Create tenant, lease, and assign unit
  -- ==================================================================

  -- Create tenant record (PENDING_SETUP until password is set)
  INSERT INTO public.tenants (
    user_id, full_name, phone_number, whatsapp_number, registration_number,
    email, property_id, unit_id, room_number, caretaker_employee_id,
    caretaker_user_id, move_in_date, status, created_at, updated_at
  ) VALUES (
    NULL, v_application.full_name, v_application.phone_number,
    v_application.whatsapp_number, v_application.registration_number,
    v_application.email, v_application.property_id, p_assigned_unit_id,
    v_unit.room_number, v_caretaker.id, v_caretaker_user_id, p_start_date,
    'PENDING_SETUP', now(), now()
  )
  RETURNING id INTO v_new_tenant_id;

  -- Create lease
  INSERT INTO public.leases (
    tenant_id, unit_id, property_id, lease_number, start_date, end_date,
    rent_amount, deposit_amount, status, created_at, updated_at
  ) VALUES (
    v_new_tenant_id, p_assigned_unit_id, v_application.property_id,
    'LS-' || substr(v_new_tenant_id::text, 1, 8), p_start_date, v_default_end_date,
    v_unit.base_price, COALESCE(v_unit.deposit_amount, 0), 'ACTIVE', now(), now()
  )
  RETURNING id INTO v_lease_id;

  -- Update unit with tenant assignment AND status in single atomic operation
  UPDATE public.units
  SET current_tenant_id = v_new_tenant_id,
      availability_status = 'OCCUPIED',
      status = 'TAKEN',
      updated_at = now()
  WHERE id = p_assigned_unit_id;

  -- Update application record
  UPDATE public.tenant_applications
  SET status = 'ACCEPTED',
      assigned_unit_id = p_assigned_unit_id,
      converted_tenant_id = v_new_tenant_id,
      approved_at = now(),
      approved_by = v_caretaker_user_id,
      updated_at = now()
  WHERE id = p_application_id;

  -- Return success with all IDs
  RETURN jsonb_build_object(
    'success', true,
    'tenantId', v_new_tenant_id,
    'leaseId', v_lease_id,
    'unitId', p_assigned_unit_id,
    'message', 'Application accepted. Unit assigned and marked as occupied. Tenant will receive setup email.'
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically, return error
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- PART 4: Create vacate_unit RPC for proper move-out flow
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vacate_unit(
  p_unit_id uuid,
  p_tenant_id uuid DEFAULT NULL,
  p_move_out_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caretaker_user_id uuid := auth.uid();
  v_unit public.units%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_target_tenant_id uuid;
BEGIN
  -- Get and lock the unit
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit not found');
  END IF;

  -- Determine which tenant to vacate
  IF p_tenant_id IS NOT NULL THEN
    v_target_tenant_id := p_tenant_id;
  ELSE
    v_target_tenant_id := v_unit.current_tenant_id;
  END IF;

  IF v_target_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tenant assigned to this unit');
  END IF;

  -- Get tenant
  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id = v_target_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant not found');
  END IF;

  -- Verify authorization (caretaker of property or admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = v_caretaker_user_id
    AND role_id = 'CARETAKER'
    AND assigned_property_id = v_unit.property_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = v_caretaker_user_id AND role_id = 'ADMIN'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to vacate this unit');
  END IF;

  -- ==================================================================
  -- ATOMIC MOVE-OUT: Update tenant, unit, and lease
  -- ==================================================================

  -- Update tenant status
  UPDATE public.tenants
  SET status = 'MOVED_OUT',
      move_out_date = p_move_out_date,
      unit_id = NULL,  -- Clear unit reference
      updated_at = now()
  WHERE id = v_target_tenant_id;

  -- Update unit to available (clear tenant reference)
  UPDATE public.units
  SET current_tenant_id = NULL,
      availability_status = 'AVAILABLE',
      status = 'VACANT',
      updated_at = now()
  WHERE id = p_unit_id;

  -- Complete the lease
  UPDATE public.leases
  SET status = 'COMPLETED',
      end_date = p_move_out_date,
      updated_at = now()
  WHERE tenant_id = v_target_tenant_id
  AND unit_id = p_unit_id
  AND status = 'ACTIVE';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Unit vacated successfully',
    'unitId', p_unit_id,
    'tenantId', v_target_tenant_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- PART 5: Update Database Views to use current_tenant_id
-- ============================================================================

-- Update caretaker_dashboard_view
DROP VIEW IF EXISTS public.caretaker_dashboard_view;

CREATE OR REPLACE VIEW public.caretaker_dashboard_view AS
SELECT
  e.id AS caretaker_employee_id,
  e.user_id AS caretaker_user_id,
  e.full_name AS caretaker_full_name,
  e.phone_number AS caretaker_phone_number,
  e.email AS caretaker_email,
  e.assigned_property_id,
  p.name AS property_name,
  p.location AS property_location,
  -- Total rooms
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id) AS total_rooms,
  -- Occupied rooms: units with current_tenant_id set (SOURCE OF TRUTH)
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id AND u.current_tenant_id IS NOT NULL) AS occupied_rooms,
  -- Vacant rooms: no tenant AND explicitly available
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id AND u.current_tenant_id IS NULL AND u.availability_status = 'AVAILABLE') AS vacant_rooms,
  -- Tenants count: should match occupied_rooms
  (SELECT COUNT(*) FROM public.tenants t WHERE t.property_id = e.assigned_property_id AND t.status IN ('ACTIVE', 'PENDING_SETUP')) AS tenants_count,
  -- Applications waiting
  (SELECT COUNT(*) FROM public.tenant_applications ta WHERE ta.property_id = e.assigned_property_id AND ta.status = 'WAITING') AS pending_applications_count,
  -- Issues
  (SELECT COUNT(*) FROM public.issues i WHERE i.property_id = e.assigned_property_id AND i.status::text = 'PENDING') AS pending_issues_count,
  (SELECT COUNT(*) FROM public.issues i WHERE i.property_id = e.assigned_property_id AND i.status::text = 'RESOLVED') AS resolved_issues_count,
  -- Repairs
  (SELECT COUNT(*) FROM public.repairs r WHERE r.property_id = e.assigned_property_id AND r.status::text IN ('PENDING', 'IN_PROGRESS')) AS pending_repairs_count,
  (SELECT COUNT(*) FROM public.repairs r WHERE r.property_id = e.assigned_property_id AND r.status::text = 'SOLVED') AS solved_repairs_count,
  -- Announcements
  (SELECT COUNT(*) FROM public.announcements a WHERE a.sender_employee_id = e.id) AS outgoing_announcements_count,
  (SELECT COUNT(*) FROM public.announcements a
   WHERE a.target_role = 'CARETAKER' OR (a.property_id = e.assigned_property_id AND a.is_published = true)) AS incoming_announcements_count
FROM public.employees e
LEFT JOIN public.properties p ON p.id = e.assigned_property_id
WHERE e.role_id = 'CARETAKER' AND e.status = 'ACTIVE';

-- Update admin_properties_view
DROP VIEW IF EXISTS public.admin_properties_view;

CREATE OR REPLACE VIEW public.admin_properties_view AS
SELECT
  p.id AS property_id,
  p.name AS property_name,
  p.location,
  p.property_type,
  p.caretaker_employee_id,
  p.caretaker_user_id,
  ce.full_name AS caretaker_full_name,
  ce.phone_number AS caretaker_phone_number,
  ce.email AS caretaker_email,
  p.verification_status,
  p.listing_status,
  -- Total rooms
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id) AS total_rooms,
  -- Occupied: has tenant assigned
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.current_tenant_id IS NOT NULL) AS occupied_rooms,
  -- Available: no tenant and available
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.current_tenant_id IS NULL AND u.availability_status = 'AVAILABLE') AS available_rooms,
  -- Reserved
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'RESERVED') AS reserved_rooms,
  -- Maintenance
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'UNDER_MAINTENANCE') AS maintenance_rooms,
  -- Tenant count
  (SELECT COUNT(*) FROM public.tenants t WHERE t.property_id = p.id AND t.status IN ('ACTIVE', 'PENDING_SETUP')) AS active_tenants,
  -- Financial
  COALESCE(p.price_min, (SELECT MIN(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_min,
  COALESCE(p.price_max, (SELECT MAX(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_max,
  p.deposit_required,
  p.deposit_amount,
  p.latitude,
  p.longitude,
  -- Stats
  (SELECT ROUND(AVG(pr.rating), 1) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS overall_rating,
  (SELECT COUNT(*) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS review_count,
  (SELECT COUNT(*) FROM public.property_likes pl WHERE pl.property_id = p.id) AS likes_count,
  p.created_at,
  p.updated_at
FROM public.properties p
LEFT JOIN public.employees ce ON ce.id = p.caretaker_employee_id;

-- Update public_properties_view
DROP VIEW IF EXISTS public.public_properties_view;

CREATE OR REPLACE VIEW public.public_properties_view AS
SELECT
  p.id AS property_id,
  p.name AS property_name,
  p.location,
  p.property_type,
  p.description,
  p.verification_status,
  p.listing_status,
  p.cover_photo_url,
  p.gate_photo_url,
  p.logo_url,
  p.latitude,
  p.longitude,
  -- Total rooms
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id) AS total_rooms,
  -- Vacant: no tenant AND available (this is what applicants can book)
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.current_tenant_id IS NULL AND u.availability_status = 'AVAILABLE') AS vacant_rooms,
  -- Occupied: has tenant
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.current_tenant_id IS NOT NULL) AS occupied_rooms,
  -- Pricing
  COALESCE(p.price_min, (SELECT MIN(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_min,
  COALESCE(p.price_max, (SELECT MAX(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_max,
  p.deposit_required,
  -- Caretaker info
  CASE WHEN p.caretaker_employee_id IS NOT NULL THEN true ELSE false END AS caretaker_assigned,
  ce.full_name AS caretaker_name,
  -- Stats
  (SELECT ROUND(AVG(pr.rating), 1) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS overall_rating,
  (SELECT COUNT(*) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS review_count,
  (SELECT COUNT(*) FROM public.property_likes pl WHERE pl.property_id = p.id) AS likes_count,
  p.created_at
FROM public.properties p
LEFT JOIN public.employees ce ON ce.id = p.caretaker_employee_id
WHERE p.verification_status != 'SUSPENDED' AND p.listing_status = 'PUBLISHED';

-- ============================================================================
-- PART 6: Create helper function to check unit availability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_unit_available(p_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = p_unit_id
    AND current_tenant_id IS NULL
    AND availability_status = 'AVAILABLE'
  );
$$;

-- ============================================================================
-- PART 7: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.accept_application(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vacate_unit(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_unit_available(uuid) TO authenticated;

GRANT SELECT ON public.caretaker_dashboard_view TO authenticated;
GRANT SELECT ON public.admin_properties_view TO authenticated;
GRANT SELECT ON public.public_properties_view TO anon;
GRANT SELECT ON public.public_properties_view TO authenticated;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON COLUMN public.units.current_tenant_id IS 'The currently assigned tenant. NULL = vacant. This is the source of truth for unit occupancy.';
COMMENT ON FUNCTION public.accept_application(uuid, uuid, date, date) IS 'Accepts an application and atomically assigns the tenant to the unit, updating unit.current_tenant_id';
COMMENT ON FUNCTION public.vacate_unit(uuid, uuid, date) IS 'Properly vacates a unit: clears current_tenant_id, marks tenant as MOVED_OUT, completes lease';
COMMENT ON FUNCTION public.is_unit_available(uuid) IS 'Checks if a unit is truly available (no tenant assigned AND availability_status = AVAILABLE)';

-- ============================================================================
-- COMPLETION
-- ============================================================================
