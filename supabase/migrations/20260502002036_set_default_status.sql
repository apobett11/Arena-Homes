-- Set default status for tenant_applications
-- This ensures status is automatically 'WAITING' when frontend doesn't send it

ALTER TABLE public.tenant_applications 
ALTER COLUMN status SET DEFAULT 'WAITING';
