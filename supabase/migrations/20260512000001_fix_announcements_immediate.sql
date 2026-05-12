-- ============================================================================
-- ARENA HOMES - IMMEDIATE FIX FOR ANNOUNCEMENTS TABLE
-- Version: 1.0.2
-- Purpose: Immediate fix for announcements table author_id constraint
-- Date: May 12, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: IMMEDIATE CONSTRAINT FIX
-- ============================================================================

-- Make author_id nullable immediately to prevent constraint violations
ALTER TABLE public.announcements 
ALTER COLUMN author_id DROP NOT NULL;

-- Set default values for existing rows with null author_id
UPDATE public.announcements 
SET author_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE author_id IS NULL;

-- ============================================================================
-- PART 2: TEMPORARY FIX FOR BROADCAST FUNCTION
-- ============================================================================

-- Create or replace broadcast function that works with announcements table
CREATE OR REPLACE FUNCTION public.send_broadcast_message(
    p_target_role text, -- 'TENANT', 'EMPLOYEE', 'ALL'
    p_title text,
    p_content text
)
RETURNS uuid AS $$
DECLARE
    v_announcement_id uuid;
    v_author_id uuid;
BEGIN
    -- Get current user ID or use system UUID if not available
    v_author_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Create the announcement
    INSERT INTO public.announcements (
        title, 
        content, 
        author_id, 
        is_published, 
        created_at
    )
    VALUES (
        p_title, 
        p_content, 
        v_author_id, 
        true, 
        now()
    )
    RETURNING id INTO v_announcement_id;
    
    -- Create recipients for read tracking
    IF p_target_role = 'ALL' THEN
        INSERT INTO public.announcement_recipients (announcement_id, user_id)
        SELECT v_announcement_id, user_id FROM public.profiles WHERE user_id != v_author_id;
    ELSIF p_target_role = 'TENANT' THEN
        INSERT INTO public.announcement_recipients (announcement_id, user_id)
        SELECT v_announcement_id, user_id FROM public.profiles 
        WHERE role_id = 'TENANT' AND user_id != v_author_id;
    ELSIF p_target_role = 'EMPLOYEE' THEN
        INSERT INTO public.announcement_recipients (announcement_id, user_id)
        SELECT v_announcement_id, user_id FROM public.profiles 
        WHERE role_id IN ('CARETAKER', 'ACCOUNTANT', 'IT_SUPPORT') AND user_id != v_author_id;
    END IF;
    
    RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Create new policies
CREATE POLICY "Users can view announcements" ON public.announcements
    FOR SELECT USING (
        is_published = true
    );

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role_id = 'ADMIN'
        )
    );

-- ============================================================================
-- PART 4: GRANTS
-- ============================================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.announcement_recipients TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_broadcast_message TO authenticated;

-- Grant service role permissions
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.announcement_recipients TO service_role;
