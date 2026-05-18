-- ============================================================================
-- ARENA HOMES — Unified communication (messages, broadcasts, notifications)
-- Copy-paste safe for Supabase SQL Editor. Idempotent where possible.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type text NOT NULL CHECK (message_type IN ('DIRECT', 'BROADCAST')),
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience text NOT NULL DEFAULT 'USER' CHECK (
    audience IN ('USER', 'ALL', 'EMPLOYEES', 'TENANTS', 'CARETAKER_TENANTS')
  ),
  related_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role text,
  recipient_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  recipient_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, recipient_user_id)
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS communication_recipients_recipient_user_id_idx
  ON public.communication_recipients (recipient_user_id);

CREATE INDEX IF NOT EXISTS communication_recipients_message_id_idx
  ON public.communication_recipients (message_id);

CREATE INDEX IF NOT EXISTS communication_recipients_unread_idx
  ON public.communication_recipients (recipient_user_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS communication_messages_sender_idx
  ON public.communication_messages (sender_user_id);

CREATE INDEX IF NOT EXISTS communication_messages_type_created_idx
  ON public.communication_messages (message_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.communication_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS communication_messages_updated_at ON public.communication_messages;
CREATE TRIGGER communication_messages_updated_at
  BEFORE UPDATE ON public.communication_messages
  FOR EACH ROW EXECUTE FUNCTION public.communication_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Internal helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.communication_require_auth()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.communication_sender_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT e.role_id::text FROM public.employees e WHERE e.user_id = p_user_id AND e.status = 'ACTIVE' LIMIT 1),
    (SELECT p.role_id::text FROM public.profiles p WHERE p.user_id = p_user_id LIMIT 1),
    'UNKNOWN'
  );
$$;

CREATE OR REPLACE FUNCTION public.communication_sender_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(trim(p.full_name), '') FROM public.profiles p WHERE p.user_id = p_user_id),
    (SELECT NULLIF(trim(e.full_name), '') FROM public.employees e WHERE e.user_id = p_user_id LIMIT 1),
    (SELECT NULLIF(trim(t.full_name), '') FROM public.tenants t WHERE t.user_id = p_user_id LIMIT 1),
    'User'
  );
$$;

CREATE OR REPLACE FUNCTION public.communication_build_payload(
  p_sender_user_id uuid,
  p_sender_role text,
  p_audience text,
  p_title text,
  p_body text,
  p_message_type text,
  p_recipient_user_ids uuid[] DEFAULT NULL,
  p_property_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'from', jsonb_build_object(
      'user_id', p_sender_user_id,
      'role', p_sender_role,
      'name', public.communication_sender_name(p_sender_user_id)
    ),
    'to', jsonb_build_object(
      'audience', p_audience,
      'user_ids', COALESCE(to_jsonb(p_recipient_user_ids), '[]'::jsonb),
      'property_id', p_property_id
    ),
    'title', p_title,
    'body', p_body,
    'message_type', p_message_type,
    'created_at', to_jsonb(now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.communication_notifications_has_column(p_column text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = p_column
  );
$$;

CREATE OR REPLACE FUNCTION public.communication_create_notification(
  p_user_id uuid,
  p_title text,
  p_body_preview text,
  p_message_id uuid,
  p_message_type text,
  p_audience text,
  p_sender_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data jsonb := jsonb_build_object(
    'communication_message_id', p_message_id,
    'message_id', p_message_id,
    'message_type', p_message_type,
    'sender_user_id', p_sender_user_id,
    'audience', p_audience
  );
  v_has_body boolean := public.communication_notifications_has_column('body');
  v_has_message boolean := public.communication_notifications_has_column('message');
  v_has_read_at boolean := public.communication_notifications_has_column('read_at');
  v_has_is_read boolean := public.communication_notifications_has_column('is_read');
  v_has_data boolean := public.communication_notifications_has_column('data');
  v_preview text := left(COALESCE(p_body_preview, ''), 500);
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND v_has_data
      AND n.data->>'communication_message_id' = p_message_id::text
  ) THEN
    RETURN;
  END IF;

  IF v_has_body AND v_has_message AND v_has_data AND v_has_read_at THEN
    INSERT INTO public.notifications (user_id, title, body, message, type, data, read_at, created_at)
    VALUES (p_user_id, p_title, v_preview, v_preview, 'INFO'::public.notification_type, v_data, NULL, now());
  ELSIF v_has_body AND v_has_data AND v_has_read_at THEN
    INSERT INTO public.notifications (user_id, title, body, type, data, read_at, created_at)
    VALUES (p_user_id, p_title, v_preview, 'INFO'::public.notification_type, v_data, NULL, now());
  ELSIF v_has_message AND v_has_is_read AND v_has_data THEN
    INSERT INTO public.notifications (user_id, title, message, type, data, is_read, created_at)
    VALUES (p_user_id, p_title, v_preview, 'INFO'::public.notification_type, v_data, false, now());
  ELSIF v_has_message AND v_has_is_read THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
    VALUES (p_user_id, p_title, v_preview, 'INFO'::public.notification_type, false, now());
  ELSE
  INSERT INTO public.notifications (user_id, title, type, created_at)
    VALUES (p_user_id, p_title, 'INFO'::public.notification_type, now());
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.communication_mark_notifications_read(p_message_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.communication_notifications_has_column('read_at') THEN
    UPDATE public.notifications n
    SET read_at = COALESCE(n.read_at, now())
    WHERE n.user_id = p_user_id
      AND (
        (public.communication_notifications_has_column('data') AND (
          n.data->>'communication_message_id' = p_message_id::text
          OR n.data->>'message_id' = p_message_id::text
        ))
        OR NOT public.communication_notifications_has_column('data')
      );
  END IF;

  IF public.communication_notifications_has_column('is_read') THEN
    UPDATE public.notifications n
    SET is_read = true
    WHERE n.user_id = p_user_id
      AND COALESCE(n.is_read, false) = false
      AND (
        public.communication_notifications_has_column('data')
        AND (
          n.data->>'communication_message_id' = p_message_id::text
          OR n.data->>'message_id' = p_message_id::text
        )
      );
  END IF;
END;
$$;

-- Caretaker-scoped tenant recipients
CREATE OR REPLACE FUNCTION public.communication_caretaker_tenant_recipients(p_caretaker_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  tenant_role text,
  property_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    t.user_id,
    t.id AS tenant_id,
    COALESCE(p.role_id::text, 'TENANT') AS tenant_role,
    t.property_id
  FROM public.tenants t
  LEFT JOIN public.profiles p ON p.user_id = t.user_id
  WHERE t.user_id IS NOT NULL
    AND t.status::text IN ('ACTIVE', 'PENDING_SETUP', 'PENDING')
    AND (
      t.caretaker_user_id = p_caretaker_user_id
      OR t.property_id IN (
        SELECT e.assigned_property_id
        FROM public.employees e
        WHERE e.user_id = p_caretaker_user_id
          AND e.role_id = 'CARETAKER'
          AND e.status = 'ACTIVE'
          AND e.assigned_property_id IS NOT NULL
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communication_messages_select ON public.communication_messages;
CREATE POLICY communication_messages_select ON public.communication_messages
  FOR SELECT TO authenticated
  USING (
    sender_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.communication_recipients cr
      WHERE cr.message_id = communication_messages.id
        AND cr.recipient_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS communication_recipients_select ON public.communication_recipients;
CREATE POLICY communication_recipients_select ON public.communication_recipients
  FOR SELECT TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.communication_messages cm
      WHERE cm.id = communication_recipients.message_id
        AND cm.sender_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS communication_recipients_update_own ON public.communication_recipients;
CREATE POLICY communication_recipients_update_own ON public.communication_recipients
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- No INSERT/DELETE policies for authenticated (RPC only)

GRANT SELECT ON public.communication_messages TO authenticated;
GRANT SELECT, UPDATE ON public.communication_recipients TO authenticated;

-- Neutralize unsafe legacy policies
DROP POLICY IF EXISTS "System can create message recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "System can create announcement recipients" ON public.announcement_recipients;

-- ---------------------------------------------------------------------------
-- 6. Core RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_direct_message(
  p_recipient_user_id uuid,
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
BEGIN
  IF p_recipient_user_id IS NULL THEN
    RAISE EXCEPTION 'Recipient is required' USING ERRCODE = '22023';
  END IF;
  IF p_recipient_user_id = v_sender THEN
    RAISE EXCEPTION 'Cannot message yourself' USING ERRCODE = '22023';
  END IF;
  IF trim(COALESCE(p_title, '')) = '' OR trim(COALESCE(p_body, '')) = '' THEN
    RAISE EXCEPTION 'Title and body are required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_recipient_user_id) THEN
    RAISE EXCEPTION 'Recipient not found' USING ERRCODE = '22023';
  END IF;

  v_payload := public.communication_build_payload(
    v_sender, v_role, 'USER', trim(p_title), trim(p_body), 'DIRECT',
    ARRAY[p_recipient_user_id], NULL
  );

  INSERT INTO public.communication_messages (
    message_type, sender_user_id, sender_role, title, body, payload, audience
  ) VALUES (
    'DIRECT', v_sender, v_role, trim(p_title), trim(p_body), v_payload, 'USER'
  ) RETURNING id INTO v_message_id;

  INSERT INTO public.communication_recipients (
    message_id, recipient_user_id, recipient_role
  ) VALUES (
    v_message_id, p_recipient_user_id, public.communication_sender_role(p_recipient_user_id)
  );

  PERFORM public.communication_create_notification(
    p_recipient_user_id, trim(p_title), trim(p_body), v_message_id, 'DIRECT', 'USER', v_sender
  );

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'recipient_count', 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_broadcast(
  p_audience text,
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
  v_audience text := upper(trim(COALESCE(p_audience, '')));
  v_count integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can send admin broadcasts' USING ERRCODE = '42501';
  END IF;
  IF v_audience NOT IN ('ALL', 'EMPLOYEES', 'TENANTS') THEN
    RAISE EXCEPTION 'Invalid audience. Use ALL, EMPLOYEES, or TENANTS' USING ERRCODE = '22023';
  END IF;
  IF trim(COALESCE(p_title, '')) = '' OR trim(COALESCE(p_body, '')) = '' THEN
    RAISE EXCEPTION 'Title and body are required' USING ERRCODE = '22023';
  END IF;

  v_payload := public.communication_build_payload(
    v_sender, v_role, v_audience, trim(p_title), trim(p_body), 'BROADCAST', NULL, NULL
  );

  INSERT INTO public.communication_messages (
    message_type, sender_user_id, sender_role, title, body, payload, audience
  ) VALUES (
    'BROADCAST', v_sender, v_role, trim(p_title), trim(p_body), v_payload, v_audience
  ) RETURNING id INTO v_message_id;

  IF v_audience = 'TENANTS' THEN
    INSERT INTO public.communication_recipients (
      message_id, recipient_user_id, recipient_role, recipient_tenant_id
    )
    SELECT v_message_id, t.user_id, COALESCE(p.role_id::text, 'TENANT'), t.id
    FROM public.tenants t
    LEFT JOIN public.profiles p ON p.user_id = t.user_id
    WHERE t.user_id IS NOT NULL
      AND t.user_id <> v_sender
      AND t.status::text IN ('ACTIVE', 'PENDING_SETUP', 'PENDING');
  ELSIF v_audience = 'EMPLOYEES' THEN
    INSERT INTO public.communication_recipients (
      message_id, recipient_user_id, recipient_role, recipient_employee_id
    )
    SELECT v_message_id, e.user_id, e.role_id::text, e.id
    FROM public.employees e
    WHERE e.user_id IS NOT NULL
      AND e.user_id <> v_sender
      AND e.status = 'ACTIVE';
  ELSE
    INSERT INTO public.communication_recipients (
      message_id, recipient_user_id, recipient_role, recipient_tenant_id, recipient_employee_id
    )
    SELECT DISTINCT ON (x.user_id)
      v_message_id, x.user_id, x.role_label, x.tenant_id, x.employee_id
    FROM (
      SELECT t.user_id, COALESCE(p.role_id::text, 'TENANT') AS role_label, t.id AS tenant_id, NULL::uuid AS employee_id
      FROM public.tenants t
      LEFT JOIN public.profiles p ON p.user_id = t.user_id
      WHERE t.user_id IS NOT NULL AND t.user_id <> v_sender
        AND t.status::text IN ('ACTIVE', 'PENDING_SETUP', 'PENDING')
      UNION ALL
      SELECT e.user_id, e.role_id::text, NULL::uuid, e.id
      FROM public.employees e
      WHERE e.user_id IS NOT NULL AND e.user_id <> v_sender AND e.status = 'ACTIVE'
    ) x
    ORDER BY x.user_id;
  END IF;

  PERFORM public.communication_create_notification(
    cr.recipient_user_id, trim(p_title), trim(p_body), v_message_id, 'BROADCAST', v_audience, v_sender
  )
  FROM public.communication_recipients cr
  WHERE cr.message_id = v_message_id;

  SELECT COUNT(*)::integer INTO v_count FROM public.communication_recipients WHERE message_id = v_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'recipient_count', v_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_caretaker_broadcast(
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
  v_property_id uuid;
BEGIN
  IF NOT public.is_caretaker() THEN
    RAISE EXCEPTION 'Only caretakers can send caretaker broadcasts' USING ERRCODE = '42501';
  END IF;
  IF trim(COALESCE(p_title, '')) = '' OR trim(COALESCE(p_body, '')) = '' THEN
    RAISE EXCEPTION 'Title and body are required' USING ERRCODE = '22023';
  END IF;

  SELECT e.assigned_property_id INTO v_property_id
  FROM public.employees e
  WHERE e.user_id = v_sender AND e.role_id = 'CARETAKER' AND e.status = 'ACTIVE'
  LIMIT 1;

  v_payload := public.communication_build_payload(
    v_sender, v_role, 'CARETAKER_TENANTS', trim(p_title), trim(p_body), 'BROADCAST', NULL, v_property_id
  );

  INSERT INTO public.communication_messages (
    message_type, sender_user_id, sender_role, title, body, payload, audience, related_property_id
  ) VALUES (
    'BROADCAST', v_sender, v_role, trim(p_title), trim(p_body), v_payload, 'CARETAKER_TENANTS', v_property_id
  ) RETURNING id INTO v_message_id;

  INSERT INTO public.communication_recipients (
    message_id, recipient_user_id, recipient_role, recipient_tenant_id
  )
  SELECT v_message_id, r.user_id, r.tenant_role, r.tenant_id
  FROM public.communication_caretaker_tenant_recipients(v_sender) r
  WHERE r.user_id <> v_sender;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No tenants assigned to this caretaker' USING ERRCODE = '22023';
  END IF;

  PERFORM public.communication_create_notification(
    cr.recipient_user_id, trim(p_title), trim(p_body), v_message_id, 'BROADCAST', 'CARETAKER_TENANTS', v_sender
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

CREATE OR REPLACE FUNCTION public.mark_communication_read(p_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.communication_require_auth();
  v_read_at timestamptz;
BEGIN
  IF p_message_id IS NULL THEN
    RAISE EXCEPTION 'message_id is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.communication_recipients cr
  SET read_at = now()
  WHERE cr.message_id = p_message_id
    AND cr.recipient_user_id = v_uid
    AND cr.read_at IS NULL
  RETURNING cr.read_at INTO v_read_at;

  IF v_read_at IS NULL THEN
    SELECT cr.read_at INTO v_read_at
    FROM public.communication_recipients cr
    WHERE cr.message_id = p_message_id AND cr.recipient_user_id = v_uid;
  END IF;

  IF v_read_at IS NULL THEN
    RAISE EXCEPTION 'Message not found or not addressed to you' USING ERRCODE = '42501';
  END IF;

  PERFORM public.communication_mark_notifications_read(p_message_id, v_uid);

  RETURN jsonb_build_object('success', true, 'read_at', v_read_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_messages()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.communication_require_auth();
  v_rows jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_data ORDER BY sort_ts DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'message_id', cm.id,
      'direction', 'INBOX',
      'message_type', cm.message_type,
      'title', cm.title,
      'body', cm.body,
      'body_preview', left(cm.body, 200),
      'sender_user_id', cm.sender_user_id,
      'sender_name', public.communication_sender_name(cm.sender_user_id),
      'sender_role', cm.sender_role,
      'audience', cm.audience,
      'created_at', cm.created_at,
      'read_at', cr.read_at,
      'related_property_id', cm.related_property_id
    ) AS row_data,
    cm.created_at AS sort_ts
    FROM public.communication_recipients cr
    JOIN public.communication_messages cm ON cm.id = cr.message_id
    WHERE cr.recipient_user_id = v_uid

    UNION ALL

    SELECT jsonb_build_object(
      'message_id', cm.id,
      'direction', 'SENT',
      'message_type', cm.message_type,
      'title', cm.title,
      'body', cm.body,
      'body_preview', left(cm.body, 200),
      'sender_user_id', cm.sender_user_id,
      'sender_name', public.communication_sender_name(cm.sender_user_id),
      'sender_role', cm.sender_role,
      'audience', cm.audience,
      'created_at', cm.created_at,
      'read_at', NULL,
      'related_property_id', cm.related_property_id
    ),
    cm.created_at
    FROM public.communication_messages cm
    WHERE cm.sender_user_id = v_uid
  ) combined;

  RETURN jsonb_build_object('messages', v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_notifications()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.communication_require_auth();
  v_rows jsonb;
BEGIN
  IF public.communication_notifications_has_column('body') THEN
    SELECT COALESCE(jsonb_agg(x.item ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'body', COALESCE(n.body, ''),
        'type', n.type::text,
        'data', COALESCE(n.data, '{}'::jsonb),
        'is_read', (n.read_at IS NOT NULL),
        'read_at', n.read_at,
        'created_at', n.created_at
      ) AS item,
      n.created_at
      FROM public.notifications n
      WHERE n.user_id = v_uid
      ORDER BY n.created_at DESC
      LIMIT 50
    ) x;
  ELSE
    SELECT COALESCE(jsonb_agg(x.item ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
      SELECT jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'body', COALESCE(n.message, ''),
        'type', n.type::text,
        'data', COALESCE(n.data, '{}'::jsonb),
        'is_read', COALESCE(n.is_read, false),
        'read_at', NULL,
        'created_at', n.created_at
      ) AS item,
      n.created_at
      FROM public.notifications n
      WHERE n.user_id = v_uid
      ORDER BY n.created_at DESC
      LIMIT 50
    ) x;
  END IF;

  RETURN jsonb_build_object('notifications', v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_broadcast_stats(p_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_read integer;
  v_emp_total integer;
  v_emp_read integer;
  v_tnt_total integer;
  v_tnt_read integer;
  v_recipients jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.communication_messages cm
    WHERE cm.id = p_message_id AND cm.message_type = 'BROADCAST'
  ) THEN
    RAISE EXCEPTION 'Broadcast not found' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)::integer,
         COUNT(*) FILTER (WHERE cr.read_at IS NOT NULL)::integer
  INTO v_total, v_read
  FROM public.communication_recipients cr
  WHERE cr.message_id = p_message_id;

  SELECT COUNT(*)::integer,
         COUNT(*) FILTER (WHERE cr.read_at IS NOT NULL)::integer
  INTO v_emp_total, v_emp_read
  FROM public.communication_recipients cr
  WHERE cr.message_id = p_message_id
    AND cr.recipient_role IN ('CARETAKER', 'ACCOUNTANT', 'IT_SUPPORT', 'ADMIN', 'EMPLOYEE');

  SELECT COUNT(*)::integer,
         COUNT(*) FILTER (WHERE cr.read_at IS NOT NULL)::integer
  INTO v_tnt_total, v_tnt_read
  FROM public.communication_recipients cr
  WHERE cr.message_id = p_message_id
    AND (cr.recipient_role = 'TENANT' OR cr.recipient_tenant_id IS NOT NULL);

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', cr.recipient_user_id,
      'name', COALESCE(
        (SELECT p.full_name FROM public.profiles p WHERE p.user_id = cr.recipient_user_id),
        (SELECT e.full_name FROM public.employees e WHERE e.user_id = cr.recipient_user_id LIMIT 1),
        (SELECT t.full_name FROM public.tenants t WHERE t.user_id = cr.recipient_user_id LIMIT 1)
      ),
      'email', (SELECT p.email FROM public.profiles p WHERE p.user_id = cr.recipient_user_id),
      'role', cr.recipient_role,
      'read_at', cr.read_at
    ) ORDER BY cr.read_at NULLS LAST
  ), '[]'::jsonb)
  INTO v_recipients
  FROM public.communication_recipients cr
  WHERE cr.message_id = p_message_id;

  RETURN jsonb_build_object(
    'total_recipients', v_total,
    'read_count', v_read,
    'unread_count', v_total - v_read,
    'read_percentage', CASE WHEN v_total > 0 THEN round((v_read::numeric / v_total) * 100, 2) ELSE 0 END,
    'employee_total', v_emp_total,
    'employee_read', v_emp_read,
    'employee_read_percentage', CASE WHEN v_emp_total > 0 THEN round((v_emp_read::numeric / v_emp_total) * 100, 2) ELSE 0 END,
    'tenant_total', v_tnt_total,
    'tenant_read', v_tnt_read,
    'tenant_read_percentage', CASE WHEN v_tnt_total > 0 THEN round((v_tnt_read::numeric / v_tnt_total) * 100, 2) ELSE 0 END,
    'recipients', v_recipients
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_caretaker_broadcast_stats(p_message_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.communication_require_auth();
  v_total integer;
  v_read integer;
  v_read_tenants jsonb;
  v_unread_tenants jsonb;
BEGIN
  IF NOT public.is_caretaker() THEN
    RAISE EXCEPTION 'Caretaker only' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.communication_messages cm
    WHERE cm.id = p_message_id
      AND cm.message_type = 'BROADCAST'
      AND cm.audience = 'CARETAKER_TENANTS'
      AND cm.sender_user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Broadcast not found or not owned by you' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)::integer,
         COUNT(*) FILTER (WHERE cr.read_at IS NOT NULL)::integer
  INTO v_total, v_read
  FROM public.communication_recipients cr
  WHERE cr.message_id = p_message_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', cr.recipient_user_id,
      'tenant_id', cr.recipient_tenant_id,
      'name', COALESCE(t.full_name, p.full_name, 'Tenant'),
      'read_at', cr.read_at
    )
  ), '[]'::jsonb)
  INTO v_read_tenants
  FROM public.communication_recipients cr
  LEFT JOIN public.tenants t ON t.id = cr.recipient_tenant_id
  LEFT JOIN public.profiles p ON p.user_id = cr.recipient_user_id
  WHERE cr.message_id = p_message_id AND cr.read_at IS NOT NULL;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', cr.recipient_user_id,
      'tenant_id', cr.recipient_tenant_id,
      'name', COALESCE(t.full_name, p.full_name, 'Tenant'),
      'read_at', cr.read_at
    )
  ), '[]'::jsonb)
  INTO v_unread_tenants
  FROM public.communication_recipients cr
  LEFT JOIN public.tenants t ON t.id = cr.recipient_tenant_id
  LEFT JOIN public.profiles p ON p.user_id = cr.recipient_user_id
  WHERE cr.message_id = p_message_id AND cr.read_at IS NULL;

  RETURN jsonb_build_object(
    'total_tenants', v_total,
    'read_count', v_read,
    'unread_count', v_total - v_read,
    'read_percentage', CASE WHEN v_total > 0 THEN round((v_read::numeric / v_total) * 100, 2) ELSE 0 END,
    'read_tenants', v_read_tenants,
    'unread_tenants', v_unread_tenants
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_communication_count()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.communication_require_auth();
  v_msg_unread integer;
  v_notif_unread integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_msg_unread
  FROM public.communication_recipients cr
  WHERE cr.recipient_user_id = v_uid AND cr.read_at IS NULL;

  IF public.communication_notifications_has_column('read_at') THEN
    SELECT COUNT(*)::integer INTO v_notif_unread
    FROM public.notifications n
    WHERE n.user_id = v_uid AND n.read_at IS NULL;
  ELSIF public.communication_notifications_has_column('is_read') THEN
    SELECT COUNT(*)::integer INTO v_notif_unread
    FROM public.notifications n
    WHERE n.user_id = v_uid AND COALESCE(n.is_read, false) = false;
  ELSE
    v_notif_unread := 0;
  END IF;

  RETURN jsonb_build_object(
    'unread_messages', v_msg_unread,
    'unread_notifications', v_notif_unread,
    'total_unread', v_msg_unread + v_notif_unread
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Secure compatibility wrappers (replace unsafe versions)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.send_broadcast_message(text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.send_broadcast_message(text, text, text);
DROP FUNCTION IF EXISTS public.send_broadcast_message(text, text, text, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.send_broadcast_message(
  p_target_role text,
  p_message_head jsonb DEFAULT '{}'::jsonb,
  p_message_body jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
  v_audience text;
  v_result jsonb;
BEGIN
  v_title := COALESCE(NULLIF(trim(p_message_head->>'title'), ''), 'Broadcast');
  v_body := COALESCE(
    NULLIF(trim(p_message_body->>'content'), ''),
    NULLIF(trim(p_message_body->>'body'), ''),
    ''
  );
  v_audience := upper(COALESCE(p_target_role, 'ALL'));
  IF v_audience = 'EMPLOYEE' THEN v_audience := 'EMPLOYEES'; END IF;
  IF v_audience = 'TENANT' THEN v_audience := 'TENANTS'; END IF;
  v_result := public.create_admin_broadcast(v_audience, v_title, v_body);
  RETURN (v_result->>'message_id')::uuid;
END;
$$;

-- Title/content signature used by older SQL migrations
CREATE OR REPLACE FUNCTION public.send_broadcast_message(
  p_target_role text,
  p_title text,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.create_admin_broadcast(
    CASE upper(p_target_role)
      WHEN 'EMPLOYEE' THEN 'EMPLOYEES'
      WHEN 'TENANT' THEN 'TENANTS'
      ELSE upper(p_target_role)
    END,
    trim(p_title),
    trim(p_content)
  );
  RETURN (v_result->>'message_id')::uuid;
END;
$$;

DROP FUNCTION IF EXISTS public.send_private_message(uuid, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.send_private_message(
  p_to_user_id uuid,
  p_message_head jsonb DEFAULT '{}'::jsonb,
  p_message_body jsonb DEFAULT '{}'::jsonb,
  p_title text DEFAULT NULL,
  p_body text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text := COALESCE(NULLIF(trim(p_title), ''), NULLIF(trim(p_message_head->>'title'), ''), 'Message');
  v_body text := COALESCE(
    NULLIF(trim(p_body), ''),
    NULLIF(trim(p_message_body->>'content'), ''),
    NULLIF(trim(p_message_body->>'body'), ''),
    ''
  );
  v_result jsonb;
BEGIN
  v_result := public.create_direct_message(p_to_user_id, v_title, v_body);
  RETURN (v_result->>'message_id')::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_message_read(p_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.mark_communication_read(p_message_id);
  RETURN COALESCE((v_result->>'success')::boolean, false);
END;
$$;

-- Lock down legacy analytics
CREATE OR REPLACE FUNCTION public.get_broadcast_analytics()
RETURNS TABLE (
  total_announcements bigint,
  total_recipients bigint,
  total_read bigint,
  read_percentage numeric,
  tenant_read_percentage numeric,
  employee_read_percentage numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.communication_messages WHERE message_type = 'BROADCAST')::bigint,
    (SELECT COUNT(*) FROM public.communication_recipients)::bigint,
    (SELECT COUNT(*) FROM public.communication_recipients WHERE read_at IS NOT NULL)::bigint,
    0::numeric, 0::numeric, 0::numeric;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grants / revokes
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_broadcast_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_broadcast_analytics() TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_direct_message(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_broadcast(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_caretaker_broadcast(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_communication_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_broadcast_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_caretaker_broadcast_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_communication_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_broadcast_message(text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_broadcast_message(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_private_message(uuid, jsonb, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated;
