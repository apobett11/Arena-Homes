-- ADD STATUS COLUMN - It was dropped by previous migrations
-- First create the enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('WAITING', 'ACCEPTED', 'REJECTED');
  END IF;
END $$;

-- Add the status column if it doesn't exist
ALTER TABLE public.tenant_applications 
ADD COLUMN IF NOT EXISTS status public.application_status NOT NULL DEFAULT 'WAITING';

-- Ensure default is set
ALTER TABLE public.tenant_applications 
ALTER COLUMN status SET DEFAULT 'WAITING';
