-- CRITICAL FIX: The default status was still 'PENDING' from old schema
-- but 'PENDING' is not in the new enum. Set it to 'WAITING'.

ALTER TABLE public.tenant_applications 
ALTER COLUMN status SET DEFAULT 'WAITING';

-- Also ensure any existing NULLs are set to WAITING
UPDATE public.tenant_applications 
SET status = 'WAITING' 
WHERE status IS NULL;
