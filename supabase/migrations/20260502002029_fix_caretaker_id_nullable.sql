-- Fix caretaker_id NOT NULL constraint on tenant_applications
-- Make it nullable so anonymous applications can be submitted

-- Allow NULL values in caretaker_id
ALTER TABLE public.tenant_applications ALTER COLUMN caretaker_id DROP NOT NULL;

-- Also rename to caretaker_user_id for consistency with other tables
-- (or drop it if caretaker_employee_id is the preferred column)
-- For now, just make it nullable to fix the immediate issue

-- If caretaker_id doesn't exist, add it as nullable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_applications' 
    AND column_name = 'caretaker_id'
  ) THEN
    ALTER TABLE public.tenant_applications ADD COLUMN caretaker_id uuid REFERENCES auth.users(id);
  END IF;
END $$;
