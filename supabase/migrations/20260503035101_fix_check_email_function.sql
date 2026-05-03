-- ============================================================================
-- FIX: Update check_email_availability function to use WAITING instead of PENDING
-- ============================================================================

-- Update function to check if email is already in use
-- Changed: status = 'PENDING' -> status = 'WAITING'
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
  v_waiting_application bigint;
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
  
  -- Check if email exists in waiting applications (changed from PENDING to WAITING)
  SELECT COUNT(*) INTO v_waiting_application
  FROM public.tenant_applications
  WHERE LOWER(email) = LOWER(p_email)
  AND status = 'WAITING';
  
  IF v_waiting_application > 0 THEN
    RETURN QUERY SELECT false::boolean, 'An application with this email is already waiting review'::text;
    RETURN;
  END IF;
  
  -- Email is available
  RETURN QUERY SELECT true::boolean, null::text;
END;
$$;

-- Recreate the trigger function to ensure it's up to date
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
  
  -- DO NOT set status here - let the database default handle it
  RETURN NEW;
END;
$$;
