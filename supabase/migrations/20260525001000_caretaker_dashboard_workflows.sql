-- ============================================================================
-- ARENA HOMES - Caretaker dashboard workflow RPCs
-- Purpose:
--   - Forward caretaker-scoped tenant issues to Admin without duplicating rows.
--   - Reserve caretaker-scoped available units safely.
-- Notes:
--   - No table/column/schema changes.
--   - Uses existing RLS helper functions and existing issues/units fields.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.forward_caretaker_issues_to_admin(
  p_issue_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_property_id uuid := public.current_assigned_property_id();
  v_requested_count integer := 0;
  v_invalid_count integer := 0;
  v_duplicate_count integer := 0;
  v_forwarded_count integer := 0;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_caretaker() THEN
    RAISE EXCEPTION 'Only caretakers can forward issues' USING ERRCODE = '42501';
  END IF;

  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Caretaker has no assigned property' USING ERRCODE = '42501';
  END IF;

  IF p_issue_ids IS NULL OR array_length(p_issue_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one issue is required' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)::integer
  INTO v_requested_count
  FROM (SELECT DISTINCT issue_id FROM unnest(p_issue_ids) AS requested(issue_id)) requested;

  SELECT COUNT(*)::integer
  INTO v_invalid_count
  FROM (SELECT DISTINCT issue_id FROM unnest(p_issue_ids) AS requested(issue_id)) requested
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.issues i
    WHERE i.id = requested.issue_id
      AND i.property_id = v_property_id
  );

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'One or more issues are not assigned to this caretaker' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)::integer
  INTO v_duplicate_count
  FROM public.issues i
  WHERE i.id = ANY(p_issue_ids)
    AND i.property_id = v_property_id
    AND upper(COALESCE(i.target_role, '')) = 'ADMIN'
    AND upper(COALESCE(i.sent_to, '')) = 'ADMIN';

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'One or more issues have already been forwarded to Admin' USING ERRCODE = '22023';
  END IF;

  UPDATE public.issues i
  SET
    target_role = 'ADMIN',
    sent_to = 'ADMIN',
    status = 'ESCALATED',
    updated_at = now()
  WHERE i.id = ANY(p_issue_ids)
    AND i.property_id = v_property_id
    AND NOT (
      upper(COALESCE(i.target_role, '')) = 'ADMIN'
      AND upper(COALESCE(i.sent_to, '')) = 'ADMIN'
    );

  GET DIAGNOSTICS v_forwarded_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'requested_count', v_requested_count,
    'forwarded_count', v_forwarded_count,
    'from', 'TENANT',
    'to', 'ADMIN',
    'status', 'FORWARDED'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_caretaker_unit(
  p_unit_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid := public.current_assigned_property_id();
  v_unit public.units%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_caretaker() THEN
    RAISE EXCEPTION 'Only caretakers can reserve units' USING ERRCODE = '42501';
  END IF;

  IF p_unit_id IS NULL THEN
    RAISE EXCEPTION 'Unit is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_unit
  FROM public.units
  WHERE id = p_unit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit not found' USING ERRCODE = '22023';
  END IF;

  IF v_unit.property_id IS DISTINCT FROM v_property_id THEN
    RAISE EXCEPTION 'Unit is not assigned to this caretaker' USING ERRCODE = '42501';
  END IF;

  IF v_unit.current_tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot reserve an occupied unit' USING ERRCODE = '22023';
  END IF;

  IF v_unit.availability_status <> 'AVAILABLE' THEN
    RAISE EXCEPTION 'Only available units can be reserved' USING ERRCODE = '22023';
  END IF;

  UPDATE public.units
  SET
    availability_status = 'RESERVED',
    status = 'VACANT',
    updated_at = now()
  WHERE id = p_unit_id;

  RETURN jsonb_build_object(
    'success', true,
    'unit_id', p_unit_id,
    'availability_status', 'RESERVED'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.forward_caretaker_issues_to_admin(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_caretaker_unit(uuid) TO authenticated;
