-- ============================================================================
-- EMERGENCY FIX: Remove all PENDING references from application pipeline
-- ============================================================================

-- 1. First, check and fix the table default constraint
DO $$
DECLARE
  v_default_value text;
BEGIN
  -- Get current default
  SELECT pg_get_expr(d.adbin, d.adrelid)
  INTO v_default_value
  FROM pg_attribute a
  JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  WHERE a.attrelid = 'public.tenant_applications'::regclass
  AND a.attname = 'status';
  
  -- If default is PENDING or doesn't exist, fix it
  IF v_default_value IS NULL OR v_default_value LIKE '%PENDING%' THEN
    ALTER TABLE public.tenant_applications 
    ALTER COLUMN status SET DEFAULT 'WAITING';
  END IF;
END $$;

-- 2. Update the check_email_availability function to use WAITING
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
  
  -- Check if email exists in WAITING applications (FIXED: was PENDING)
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

-- 3. Recreate the trigger function (ensures no status manipulation)
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

-- 4. Recreate the triggers
DROP TRIGGER IF EXISTS trg_prevent_duplicate_email ON public.tenant_applications;
CREATE TRIGGER trg_prevent_duplicate_email
  BEFORE INSERT ON public.tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_application_email();

DROP TRIGGER IF EXISTS trg_prevent_duplicate_email_update ON public.tenant_applications;
CREATE TRIGGER trg_prevent_duplicate_email_update
  BEFORE UPDATE OF email ON public.tenant_applications
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.prevent_duplicate_application_email();

-- 5. Ensure any existing NULL or invalid statuses are fixed
UPDATE public.tenant_applications 
SET status = 'WAITING'
WHERE status IS NULL OR status = 'PENDING' OR status = '';
