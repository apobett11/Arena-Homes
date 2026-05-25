-- ============================================================================
-- ARENA HOMES - Caretaker selected-tenant messages
-- Purpose: Let caretakers message selected assigned tenants with server-side
--          recipient ownership validation. No schema changes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_caretaker_direct_messages(
  p_tenant_ids uuid[],
  p_title text,
  p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := public.communication_require_auth();
  v_role text := public.communication_sender_role(v_sender);
  v_message_id uuid;
  v_payload jsonb;
  v_count integer := 0;
  v_invalid_count integer := 0;
  v_recipient_user_ids uuid[];
BEGIN
  IF NOT public.is_caretaker() THEN
    RAISE EXCEPTION 'Only caretakers can send caretaker tenant messages' USING ERRCODE = '42501';
  END IF;

  IF p_tenant_ids IS NULL OR array_length(p_tenant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one tenant recipient is required' USING ERRCODE = '22023';
  END IF;

  IF trim(COALESCE(p_title, '')) = '' OR trim(COALESCE(p_body, '')) = '' THEN
    RAISE EXCEPTION 'Title and body are required' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)::integer
  INTO v_invalid_count
  FROM (
    SELECT DISTINCT tenant_id
    FROM unnest(p_tenant_ids) AS requested_tenants(tenant_id)
  ) requested
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.communication_caretaker_tenant_recipients(v_sender) allowed
    WHERE allowed.tenant_id = requested.tenant_id
      AND allowed.user_id <> v_sender
  );

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'One or more tenants are not assigned to this caretaker' USING ERRCODE = '42501';
  END IF;

  SELECT array_agg(DISTINCT allowed.user_id)
  INTO v_recipient_user_ids
  FROM public.communication_caretaker_tenant_recipients(v_sender) allowed
  WHERE allowed.tenant_id = ANY(p_tenant_ids)
    AND allowed.user_id <> v_sender;

  IF v_recipient_user_ids IS NULL OR array_length(v_recipient_user_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No valid tenant recipients found' USING ERRCODE = '22023';
  END IF;

  v_payload := public.communication_build_payload(
    v_sender,
    v_role,
    'USER',
    trim(p_title),
    trim(p_body),
    'DIRECT',
    v_recipient_user_ids,
    NULL
  );

  INSERT INTO public.communication_messages (
    message_type, sender_user_id, sender_role, title, body, payload, audience
  ) VALUES (
    'DIRECT', v_sender, v_role, trim(p_title), trim(p_body), v_payload, 'USER'
  ) RETURNING id INTO v_message_id;

  INSERT INTO public.communication_recipients (
    message_id, recipient_user_id, recipient_role, recipient_tenant_id
  )
  SELECT DISTINCT
    v_message_id,
    allowed.user_id,
    allowed.tenant_role,
    allowed.tenant_id
  FROM public.communication_caretaker_tenant_recipients(v_sender) allowed
  WHERE allowed.tenant_id = ANY(p_tenant_ids)
    AND allowed.user_id <> v_sender;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM public.communication_create_notification(
    cr.recipient_user_id, trim(p_title), trim(p_body), v_message_id, 'DIRECT', 'USER', v_sender
  )
  FROM public.communication_recipients cr
  WHERE cr.message_id = v_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'recipient_count', v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_caretaker_direct_messages(uuid[], text, text) TO authenticated;
