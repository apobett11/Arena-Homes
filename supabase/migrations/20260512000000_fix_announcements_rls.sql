-- ============================================================================
-- ARENA HOMES - FIX ANNOUNCEMENTS RLS AND CONSTRAINTS
-- Version: 1.0.1
-- Purpose: Fix announcements table RLS policies and constraint issues
--          - Make author_id nullable to prevent constraint violations
--          - Add proper RLS policies for admin override
--          - Add read status tracking for announcements
-- Date: May 12, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: FIX ANNOUNCEMENTS TABLE CONSTRAINTS
-- ============================================================================

-- Make author_id nullable to prevent constraint violations
ALTER TABLE public.announcements 
ALTER COLUMN author_id DROP NOT NULL;

-- Add missing columns if they don't exist
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================================
-- PART 2: UPDATE ANNOUNCEMENTS RLS POLICIES
-- ============================================================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Create new RLS policies with proper admin override
CREATE POLICY "Users can view announcements" ON public.announcements
    FOR SELECT USING (
        -- Everyone can view published announcements
        is_published = true
    );

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        -- Admins can manage all announcements
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    )
    WITH CHECK (
        -- Admins can insert/update any announcement
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    );

-- ============================================================================
-- PART 3: CREATE ANNOUNCEMENT RECIPIENTS TABLE
-- ============================================================================

-- Create table to track announcement read status per user
CREATE TABLE IF NOT EXISTS public.announcement_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement_id ON public.announcement_recipients(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user_id ON public.announcement_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_is_read ON public.announcement_recipients(is_read);

-- ============================================================================
-- PART 4: RLS FOR ANNOUNCEMENT RECIPIENTS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their announcement recipients" ON public.announcement_recipients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their read status" ON public.announcement_recipients
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create announcement recipients" ON public.announcement_recipients
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 5: UPDATE TRIGGERS
-- ============================================================================

-- Function to update read status and timestamp
CREATE OR REPLACE FUNCTION public.mark_announcement_read()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.announcement_recipients 
    SET is_read = true, read_at = now()
    WHERE announcement_id = NEW.announcement_id 
    AND user_id = auth.uid() 
    AND is_read = false;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically mark announcements as read when viewed
DROP TRIGGER IF EXISTS mark_announcement_read_trigger ON public.announcements;
CREATE TRIGGER mark_announcement_read_trigger
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_announcement_read();

-- ============================================================================
-- PART 6: HELPER FUNCTIONS FOR BROADCAST ANALYTICS
-- ============================================================================

-- Function to get broadcast analytics for admin
CREATE OR REPLACE FUNCTION public.get_broadcast_analytics()
RETURNS TABLE (
    total_announcements bigint,
    total_recipients bigint,
    total_read bigint,
    read_percentage numeric,
    tenant_read_percentage numeric,
    employee_read_percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    announcement_stats AS (
        SELECT 
            COUNT(*) as total_announcements,
            COALESCE(SUM(CASE WHEN is_published THEN 1 ELSE 0 END), 0) as published_count
        FROM public.announcements
    ),
    recipient_stats AS (
        SELECT 
            COUNT(*) as total_recipients,
            COUNT(CASE WHEN ar.is_read THEN 1 ELSE 0 END) as total_read
        FROM public.announcement_recipients ar
        JOIN public.announcements a ON ar.announcement_id = a.id
        WHERE a.is_published = true
    ),
    tenant_stats AS (
        SELECT 
            COUNT(CASE WHEN ar.is_read THEN 1 ELSE 0 END)::float / 
            COUNT(*)::float * 100 as tenant_read_percentage
        FROM public.announcement_recipients ar
        JOIN public.announcements a ON ar.announcement_id = a.id
        JOIN public.profiles p ON ar.user_id = p.user_id
        WHERE a.is_published = true AND p.role_id = 'TENANT'
    ),
    employee_stats AS (
        SELECT 
            COUNT(CASE WHEN ar.is_read THEN 1 ELSE 0 END)::float / 
            COUNT(*)::float * 100 as employee_read_percentage
        FROM public.announcement_recipients ar
        JOIN public.announcements a ON ar.announcement_id = a.id
        JOIN public.profiles p ON ar.user_id = p.user_id
        WHERE a.is_published = true AND p.role_id IN ('CARETAKER', 'ACCOUNTANT', 'IT_SUPPORT')
    )
    SELECT 
        ast.total_announcements,
        rs.total_recipients,
        rs.total_read,
        CASE 
            WHEN rs.total_recipients > 0 THEN (rs.total_read::float / rs.total_recipients::float) * 100 
            ELSE 0 
        END as read_percentage,
        ts.tenant_read_percentage,
        es.employee_read_percentage
    FROM announcement_stats ast
    CROSS JOIN recipient_stats rs ON true
    CROSS JOIN tenant_stats ts ON true
    CROSS JOIN employee_stats es ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's announcement read status
CREATE OR REPLACE FUNCTION public.get_user_announcement_read_status(p_user_id uuid)
RETURNS TABLE (
    announcement_id uuid,
    title text,
    is_read boolean,
    read_at timestamptz,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as announcement_id,
        a.title,
        COALESCE(ar.is_read, false) as is_read,
        ar.read_at,
        a.created_at
    FROM public.announcements a
    LEFT JOIN public.announcement_recipients ar ON a.id = ar.announcement_id AND ar.user_id = p_user_id
    WHERE a.is_published = true
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: GRANTS
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.announcement_recipients TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_announcement_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_broadcast_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_announcement_read_status() TO authenticated;

-- Grant service role for system operations
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.announcement_recipients TO service_role;
