-- ============================================================================
-- EMAIL NOTIFICATIONS FOR APPLICATION RESPONSES
-- Sends automated emails when applications are approved or rejected
-- ============================================================================

-- Create table to store email notifications queue
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  template_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

-- Enable RLS on email notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins and system can manage email notifications
DROP POLICY IF EXISTS email_notifications_admin ON public.email_notifications;
CREATE POLICY email_notifications_admin ON public.email_notifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- EMAIL TEMPLATE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.send_application_email(
  p_recipient_email text,
  p_template_name text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject text;
  v_body text;
  v_full_name text := p_metadata->>'full_name';
  v_property_name text := p_metadata->>'property_name';
  v_status text := p_metadata->>'status';
  v_login_email text := p_metadata->>'login_email';
  v_temp_password text := p_metadata->>'temp_password';
  v_dashboard_url text := p_metadata->>'dashboard_url';
  v_rejection_reason text := p_metadata->>'rejection_reason';
BEGIN
  IF p_template_name = 'application_approved' THEN
    v_subject := 'Welcome to Arena Homes - Your Application Has Been Approved!';
    v_body := format(
      'Dear %s,

Congratulations! Your application for accommodation at %s has been APPROVED.

Your login credentials:
Email: %s
Temporary Password: %s

Please log in to your tenant dashboard at: %s

Important:
- Change your password immediately after first login
- Complete your profile setup
- Review the property rules and guidelines

We look forward to welcoming you!

Best regards,
Arena Homes Team',
      v_full_name,
      v_property_name,
      v_login_email,
      v_temp_password,
      v_dashboard_url
    );
    
  ELSIF p_template_name = 'application_rejected' THEN
    v_subject := 'Arena Homes Application Update';
    v_body := format(
      'Dear %s,

Thank you for your interest in Arena Homes and for submitting your application for accommodation at %s.

After careful consideration, we regret to inform you that we are unable to approve your application at this time.

%s

We appreciate your understanding and wish you the best in finding suitable accommodation.

If you have any questions, please feel free to contact our support team.

Best regards,
Arena Homes Team',
      v_full_name,
      v_property_name,
      COALESCE(v_rejection_reason, 'Unfortunately, all available units are currently occupied or your application did not meet our current requirements.')
    );
    
  ELSE
    v_subject := 'Arena Homes - Application Update';
    v_body := 'Your application status has been updated. Please log in to check.';
  END IF;

  -- Insert into email queue
  INSERT INTO public.email_notifications (
    recipient_email,
    subject,
    body,
    template_name,
    metadata,
    status
  ) VALUES (
    p_recipient_email,
    v_subject,
    v_body,
    p_template_name,
    p_metadata,
    'PENDING'
  );
END;
$$;

-- ============================================================================
-- TRIGGER: Send email on application status change
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_application_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_name text;
  v_temp_password text;
  v_user_id uuid;
BEGIN
  -- Only trigger on status change to APPROVED or REJECTED
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Get property name
  SELECT name INTO v_property_name
  FROM public.properties
  WHERE id = NEW.property_id;

  IF NEW.status = 'APPROVED' THEN
    -- Get the temp password from the user record that was just created
    -- The password is stored in the application metadata or we need to get it from the created user
    -- For now, we'll check if a user was created with this email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = NEW.email
    ORDER BY created_at DESC
    LIMIT 1;

    -- Send approval email with login details
    -- Note: In production, you'd need to either:
    -- 1. Store temp password temporarily during user creation
    -- 2. Or generate a password reset link instead
    PERFORM public.send_application_email(
      NEW.email,
      'application_approved',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'property_name', COALESCE(v_property_name, 'Arena Homes'),
        'login_email', NEW.email,
        'temp_password', 'Check your email for setup link', -- Placeholder - actual password handling needed
        'dashboard_url', 'https://arenahomes.com/tenant/dashboard'
      )
    );
    
  ELSIF NEW.status = 'REJECTED' THEN
    -- Send rejection email with polite message
    PERFORM public.send_application_email(
      NEW.email,
      'application_rejected',
      jsonb_build_object(
        'full_name', NEW.full_name,
        'property_name', COALESCE(v_property_name, 'Arena Homes'),
        'rejection_reason', COALESCE(NEW.caretaker_notes, 'All available units are currently occupied or your application did not meet our current requirements.')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_notify_application_response ON public.tenant_applications;

-- Create trigger to send emails on status change
CREATE TRIGGER trg_notify_application_response
  AFTER UPDATE OF status ON public.tenant_applications
  FOR EACH ROW
  WHEN (NEW.status IN ('APPROVED', 'REJECTED'))
  EXECUTE FUNCTION public.notify_application_response();
