-- ============================================================================
-- ARENA HOMES - MESSAGES SYSTEM MIGRATION
-- Version: 1.0.0
-- Purpose: Complete messaging system with JSON storage, read/unread tracking
--          - Private messages between users
--          - Broadcast messages as system messages
--          - Message head and body stored as JSON
--          - Read status tracking
--          - RLS policies for secure access
-- Date: May 11, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: MESSAGE TYPE ENUM
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE public.message_type AS ENUM ('PRIVATE', 'BROADCAST', 'SYSTEM', 'WARNING');
  END IF;
END $$;

-- ============================================================================
-- PART 2: MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for broadcasts
  message_type public.message_type NOT NULL DEFAULT 'PRIVATE',
  message_head jsonb NOT NULL DEFAULT '{}', -- JSON object with title, priority, etc.
  message_body jsonb NOT NULL DEFAULT '{}', -- JSON object with content, metadata
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT check_recipient_or_broadcast CHECK (
    (message_type = 'BROADCAST' AND to_user_id IS NULL) OR 
    (message_type != 'BROADCAST' AND to_user_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON public.messages(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================================================
-- PART 3: MESSAGE RECipients TABLE (for broadcasts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_user_id ON public.message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_read ON public.message_recipients(is_read);

-- ============================================================================
-- PART 4: SUSPENSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspension_reason text NOT NULL,
  suspension_duration_days integer, -- NULL for "until further notice"
  suspended_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz, -- Calculated from duration or NULL for indefinite
  is_active boolean NOT NULL DEFAULT true,
  ended_at timestamptz,
  ended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT check_suspension_dates CHECK (
    (suspension_duration_days IS NOT NULL AND ends_at IS NOT NULL) OR 
    (suspension_duration_days IS NULL AND ends_at IS NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suspensions_user_id ON public.suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_is_active ON public.suspensions(is_active);
CREATE INDEX IF NOT EXISTS idx_suspensions_ends_at ON public.suspensions(ends_at);

-- ============================================================================
-- PART 5: UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suspensions_updated_at BEFORE UPDATE ON public.suspensions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 6: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspensions ENABLE ROW LEVEL SECURITY;

-- Messages RLS policies
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        to_user_id = auth.uid() OR 
        from_user_id = auth.uid() OR 
        (message_type = 'BROADCAST' AND EXISTS (
            SELECT 1 FROM public.message_recipients 
            WHERE message_id = messages.id AND user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can create messages" ON public.messages
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can mark their messages as read" ON public.messages
    FOR UPDATE USING (to_user_id = auth.uid() OR from_user_id = auth.uid())
    WITH CHECK (to_user_id = auth.uid() OR from_user_id = auth.uid());

-- Message recipients RLS policies
CREATE POLICY "Users can view their message recipients" ON public.message_recipients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create message recipients" ON public.message_recipients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their read status" ON public.message_recipients
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Suspensions RLS policies
CREATE POLICY "Admins can view all suspensions" ON public.suspensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    );

CREATE POLICY "Users can view their own suspensions" ON public.suspensions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage suspensions" ON public.suspensions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    );

-- ============================================================================
-- PART 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to send a private message
CREATE OR REPLACE FUNCTION public.send_private_message(
    p_to_user_id uuid,
    p_message_head jsonb,
    p_message_body jsonb
)
RETURNS uuid AS $$
DECLARE
    v_message_id uuid;
BEGIN
    INSERT INTO public.messages (from_user_id, to_user_id, message_type, message_head, message_body)
    VALUES (auth.uid(), p_to_user_id, 'PRIVATE', p_message_head, p_message_body)
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a broadcast message
CREATE OR REPLACE FUNCTION public.send_broadcast_message(
    p_target_role text, -- 'TENANT', 'EMPLOYEE', 'ALL'
    p_message_head jsonb,
    p_message_body jsonb
)
RETURNS uuid AS $$
DECLARE
    v_message_id uuid;
BEGIN
    -- Create the broadcast message
    INSERT INTO public.messages (from_user_id, message_type, message_head, message_body)
    VALUES (auth.uid(), 'BROADCAST', p_message_head, p_message_body)
    RETURNING id INTO v_message_id;
    
    -- Create recipients based on target role
    IF p_target_role = 'ALL' THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT v_message_id, user_id FROM public.profiles WHERE user_id != auth.uid();
    ELSIF p_target_role = 'TENANT' THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT v_message_id, user_id FROM public.profiles 
        WHERE role_id = 'TENANT' AND user_id != auth.uid();
    ELSIF p_target_role = 'EMPLOYEE' THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT v_message_id, user_id FROM public.profiles 
        WHERE role_id IN ('CARETAKER', 'ACCOUNTANT', 'IT_SUPPORT') AND user_id != auth.uid();
    END IF;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_read(
    p_message_id uuid
)
RETURNS boolean AS $$
BEGIN
    -- Update direct message
    UPDATE public.messages 
    SET is_read = true, read_at = now()
    WHERE id = p_message_id AND to_user_id = auth.uid() AND is_read = false;
    
    -- Update broadcast recipient
    UPDATE public.message_recipients 
    SET is_read = true, read_at = now()
    WHERE message_id = p_message_id AND user_id = auth.uid() AND is_read = false;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend user
CREATE OR REPLACE FUNCTION public.suspend_user(
    p_user_id uuid,
    p_reason text,
    p_duration_days integer DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_suspension_id uuid;
    v_current_user_role text;
    v_target_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT role_id INTO v_current_user_role 
    FROM public.profiles WHERE user_id = auth.uid();
    
    IF v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Only admins can suspend users';
    END IF;
    
    -- Prevent self-suspension
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot suspend yourself';
    END IF;
    
    -- Get target user role
    SELECT role_id INTO v_target_user_role 
    FROM public.profiles WHERE user_id = p_user_id;
    
    -- Create suspension
    INSERT INTO public.suspensions (
        user_id, 
        suspended_by, 
        suspension_reason, 
        suspension_duration_days,
        ends_at,
        notes
    ) VALUES (
        p_user_id,
        auth.uid(),
        p_reason,
        p_duration_days,
        CASE 
            WHEN p_duration_days IS NOT NULL THEN now() + (p_duration_days || ' days')::interval
            ELSE NULL
        END,
        p_notes
    )
    RETURNING id INTO v_suspension_id;
    
    -- Update user status to suspended
    UPDATE public.profiles 
    SET status = 'SUSPENDED' 
    WHERE user_id = p_user_id;
    
    RETURN v_suspension_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke user access
CREATE OR REPLACE FUNCTION public.revoke_user_access(
    p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
    v_current_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT role_id INTO v_current_user_role 
    FROM public.profiles WHERE user_id = auth.uid();
    
    IF v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Only admins can revoke access';
    END IF;
    
    -- Prevent self-revocation
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot revoke your own access';
    END IF;
    
    -- Update user status to inactive
    UPDATE public.profiles 
    SET status = 'INACTIVE' 
    WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore user access
CREATE OR REPLACE FUNCTION public.restore_user_access(
    p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
    v_current_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT role_id INTO v_current_user_role 
    FROM public.profiles WHERE user_id = auth.uid();
    
    IF v_current_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Only admins can restore access';
    END IF;
    
    -- End any active suspensions
    UPDATE public.suspensions 
    SET is_active = false, ended_at = now(), ended_by = auth.uid()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Update user status to active
    UPDATE public.profiles 
    SET status = 'ACTIVE' 
    WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(
    p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.suspensions 
        WHERE user_id = p_user_id 
        AND is_active = true 
        AND (ends_at IS NULL OR ends_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user's inbox
CREATE OR REPLACE VIEW public.user_inbox AS
SELECT 
    m.id,
    m.from_user_id,
    m.to_user_id,
    m.message_type,
    m.message_head,
    m.message_body,
    COALESCE(m.is_read, mr.is_read, false) as is_read,
    COALESCE(m.read_at, mr.read_at) as read_at,
    m.created_at,
    CASE 
        WHEN m.message_type = 'BROADCAST' THEN mr.user_id
        ELSE m.to_user_id
    END as recipient_id
FROM public.messages m
LEFT JOIN public.message_recipients mr ON m.id = mr.message_id
WHERE (m.to_user_id = auth.uid() OR mr.user_id = auth.uid())
ORDER BY m.created_at DESC;

-- View for user's sent messages
CREATE OR REPLACE VIEW public.user_sent_messages AS
SELECT 
    m.*,
    p.full_name as recipient_name,
    p.email as recipient_email
FROM public.messages m
LEFT JOIN public.profiles p ON (m.to_user_id = p.user_id)
WHERE m.from_user_id = auth.uid()
ORDER BY m.created_at DESC;

-- View for active suspensions
CREATE OR REPLACE VIEW public.active_suspensions AS
SELECT 
    s.*,
    suspended_by_profile.full_name as suspended_by_name,
    user_profile.full_name as user_name,
    user_profile.email as user_email,
    user_profile.role_id as user_role
FROM public.suspensions s
JOIN public.profiles suspended_by_profile ON s.suspended_by = suspended_by_profile.user_id
JOIN public.profiles user_profile ON s.user_id = user_profile.user_id
WHERE s.is_active = true
ORDER BY s.suspended_at DESC;

-- ============================================================================
-- PART 9: GRANTS
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.message_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.suspensions TO authenticated;

GRANT EXECUTE ON FUNCTION public.send_private_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_broadcast_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_suspended TO authenticated;

GRANT EXECUTE ON FUNCTION public.suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_user_access TO authenticated;

GRANT SELECT ON public.user_inbox TO authenticated;
GRANT SELECT ON public.user_sent_messages TO authenticated;
GRANT SELECT ON public.active_suspensions TO authenticated;
