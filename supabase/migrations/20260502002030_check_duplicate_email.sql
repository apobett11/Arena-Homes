-- ============================================================================
-- DUPLICATE EMAIL CHECK FOR TENANT APPLICATIONS
-- Prevents applications if email exists in pending applications or as a tenant
-- ============================================================================

-- Create function to check if email is already in use
CREATE OR REPLACE FUNCTION public.check_email_availability(p_email text)
RETURNS TABLE (
  is_available boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_tenant bigint;
  v_pending_application bigint;
BEGIN
  -- Check if email exists as an active tenant
  SELECT COUNT(*) INTO v_existing_tenant
  FROM public.tenants
  WHERE email = LOWER(p_email)
  AND status IN ('ACTIVE', 'PENDING');
  
  IF v_existing_tenant > 0 THEN
    RETURN QUERY SELECT false::boolean, 'This email is already registered as a tenant'::text;
    RETURN;
  END IF;
  
  -- Check if email exists in pending applications
  SELECT COUNT(*) INTO v_pending_application
  FROM public.tenant_applications
  WHERE LOWER(email) = LOWER(p_email)
  AND status = 'PENDING';
  
  IF v_pending_application > 0 THEN
    RETURN QUERY SELECT false::boolean, 'An application with this email is already pending review'::text;
    RETURN;
  END IF;
  
  -- Email is available
  RETURN QUERY SELECT true::boolean, null::text;
END;
$$;

-- Create trigger function to prevent duplicate emails on insert
CREATE OR REPLACE FUNCTION public.prevent_duplicate_application_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check record;
BEGIN
  -- Check email availability
  SELECT * INTO v_check FROM public.check_email_availability(NEW.email);
  
  IF NOT v_check.is_available THEN
    RAISE EXCEPTION 'Email already in use: %', v_check.reason
      USING HINT = 'Please use a different email address or contact support if you believe this is an error.';
  END IF;
  
  -- Normalize email to lowercase
  NEW.email = LOWER(NEW.email);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_prevent_duplicate_email ON public.tenant_applications;

-- Create trigger to run before insert
CREATE TRIGGER trg_prevent_duplicate_email
  BEFORE INSERT ON public.tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_application_email();

-- Also prevent duplicates on email update
DROP TRIGGER IF EXISTS trg_prevent_duplicate_email_update ON public.tenant_applications;

CREATE TRIGGER trg_prevent_duplicate_email_update
  BEFORE UPDATE OF email ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.prevent_duplicate_application_email();
