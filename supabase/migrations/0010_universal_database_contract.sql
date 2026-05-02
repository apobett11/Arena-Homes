-- ============================================================================
-- ARENA HOMES - UNIVERSAL DATABASE CONTRACT MIGRATION
-- Version: 1.0.0
-- Purpose: Final database contract with normalized schema, universal naming,
--          SECURITY DEFINER helpers, RLS policies, and frontend views
-- Author: Senior Database Architect
-- Date: April 27, 2026
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- PART 1: UNIVERSAL ENUM DEFINITIONS
-- ============================================================================

DO $$
BEGIN
  -- Employee status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
    CREATE TYPE public.employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
  END IF;

  -- Tenant status enum (extended from original)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE public.tenant_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'MOVED_OUT');
  ELSE
    -- Check if we need to add new values
    BEGIN
      ALTER TYPE public.tenant_status ADD VALUE IF NOT EXISTS 'PENDING';
      ALTER TYPE public.tenant_status ADD VALUE IF NOT EXISTS 'MOVED_OUT';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Lease status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lease_status') THEN
    CREATE TYPE public.lease_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'TERMINATED');
  END IF;

  -- Payment status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
  END IF;

  -- Payment gateway enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
    CREATE TYPE public.payment_gateway AS ENUM ('MPESA', 'STRIPE', 'CASH', 'BANK_TRANSFER');
  END IF;

  -- Unit status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_status') THEN
    CREATE TYPE public.unit_status AS ENUM ('VACANT', 'TAKEN');
  END IF;

  -- Unit availability status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_availability_status') THEN
    CREATE TYPE public.unit_availability_status AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE', 'UNAVAILABLE');
  END IF;

  -- Issue status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE public.issue_status AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED');
  ELSE
    BEGIN
      ALTER TYPE public.issue_status ADD VALUE IF NOT EXISTS 'PENDING';
      ALTER TYPE public.issue_status ADD VALUE IF NOT EXISTS 'ESCALATED';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Issue priority enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
    CREATE TYPE public.issue_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
  END IF;

  -- Repair status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repair_status') THEN
    CREATE TYPE public.repair_status AS ENUM ('PENDING', 'IN_PROGRESS', 'SOLVED', 'CANCELLED');
  END IF;

  -- Property verification status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_verification_status') THEN
    CREATE TYPE public.property_verification_status AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'FLAGGED');
  END IF;

  -- Property listing status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_listing_status') THEN
    CREATE TYPE public.property_listing_status AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');
  END IF;

  -- Application status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('PENDING', 'CARETAKER_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED');
  END IF;

  -- Report status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
  END IF;

  -- Notification type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('INFO', 'WARNING', 'ALERT', 'SUCCESS');
  END IF;
END $$;

-- ============================================================================
-- FORCE UNIVERSAL CONTRACT COLUMNS
-- ============================================================================
-- This section runs BEFORE any data backfills, inserts, views, policies, triggers.
-- It guarantees every table has every column used later in the migration.

-- -------------------------------------------------
-- ROLES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert required roles
INSERT INTO public.roles (id, name, description) VALUES
  ('ADMIN', 'Administrator', 'Full system access'),
  ('ACCOUNTANT', 'Accountant', 'Financial management'),
  ('CARETAKER', 'Caretaker', 'Property management'),
  ('IT_SUPPORT', 'IT Support', 'Technical support'),
  ('PROPERTY_MANAGER', 'Property Manager', 'Property oversight'),
  ('TENANT', 'Tenant', 'Tenant/Student user')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- -------------------------------------------------
-- PROFILES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text REFERENCES public.roles(id),
  email text,
  full_name text,
  phone_number text,
  whatsapp_number text,
  avatar_url text,
  assigned_property_id uuid REFERENCES public.properties(id),
  assigned_unit_id uuid REFERENCES public.units(id),
  caretaker_user_id uuid REFERENCES auth.users(id),
  room_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_id text REFERENCES public.roles(id),
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS assigned_property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS assigned_unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS caretaker_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS room_number text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- -------------------------------------------------
-- EMPLOYEES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.roles(id),
  full_name text NOT NULL,
  phone_number text,
  whatsapp_number text,
  email text,
  status public.employee_status NOT NULL DEFAULT 'ACTIVE',
  assigned_property_id uuid REFERENCES public.properties(id),
  emergency_contact text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS role_id text REFERENCES public.roles(id),
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS status public.employee_status DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS assigned_property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- PROPERTIES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  description text,
  property_type text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  gate_latitude numeric(10, 8),
  gate_longitude numeric(11, 8),
  caretaker_employee_id uuid REFERENCES public.employees(id),
  caretaker_user_id uuid REFERENCES auth.users(id),
  verification_status text NOT NULL DEFAULT 'UNVERIFIED',
  listing_status text NOT NULL DEFAULT 'DRAFT',
  price_min numeric(12, 2),
  price_max numeric(12, 2),
  deposit_required boolean NOT NULL DEFAULT false,
  deposit_amount numeric(12, 2),
  gate_open_time time,
  gate_close_time time,
  water_source text,
  security_description text,
  parking_available boolean DEFAULT false,
  wifi_available boolean DEFAULT false,
  trash_collection text,
  rules_summary text,
  gate_photo_url text,
  cover_photo_url text,
  distance_from_school_km numeric(8, 2),
  school_gate_distance_meters integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
  ADD COLUMN IF NOT EXISTS longitude numeric(11, 8),
  ADD COLUMN IF NOT EXISTS gate_latitude numeric(10, 8),
  ADD COLUMN IF NOT EXISTS gate_longitude numeric(11, 8),
  ADD COLUMN IF NOT EXISTS caretaker_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS caretaker_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS listing_status text DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS price_min numeric(12, 2),
  ADD COLUMN IF NOT EXISTS price_max numeric(12, 2),
  ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS gate_open_time time,
  ADD COLUMN IF NOT EXISTS gate_close_time time,
  ADD COLUMN IF NOT EXISTS water_source text,
  ADD COLUMN IF NOT EXISTS security_description text,
  ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wifi_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trash_collection text,
  ADD COLUMN IF NOT EXISTS rules_summary text,
  ADD COLUMN IF NOT EXISTS gate_photo_url text,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS distance_from_school_km numeric(8, 2),
  ADD COLUMN IF NOT EXISTS school_gate_distance_meters integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- UNITS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_number text,
  room_type text NOT NULL DEFAULT 'SINGLE',
  base_price numeric(12, 2) NOT NULL DEFAULT 0,
  status public.unit_status NOT NULL DEFAULT 'VACANT',
  availability_status public.unit_availability_status NOT NULL DEFAULT 'AVAILABLE',
  bedrooms integer,
  bathrooms integer,
  capacity integer DEFAULT 1,
  deposit_amount numeric(12, 2),
  is_public boolean NOT NULL DEFAULT true,
  photos text[] DEFAULT '{}'::text[],
  amenities jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS room_number text,
  ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'SINGLE',
  ADD COLUMN IF NOT EXISTS base_price numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status public.unit_status DEFAULT 'VACANT',
  ADD COLUMN IF NOT EXISTS availability_status public.unit_availability_status DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms integer,
  ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- TENANTS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone_number text,
  whatsapp_number text,
  registration_number text,
  email text,
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  room_number text,
  caretaker_employee_id uuid REFERENCES public.employees(id),
  caretaker_user_id uuid REFERENCES auth.users(id),
  move_in_date date,
  move_out_date date,
  logo_url text,
  status text DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS room_number text,
  ADD COLUMN IF NOT EXISTS caretaker_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS caretaker_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS move_in_date date,
  ADD COLUMN IF NOT EXISTS move_out_date date,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Migrate tenant status from old enum to text if needed
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.tenants ALTER COLUMN status TYPE text;
    ALTER TABLE public.tenants ALTER COLUMN status SET DEFAULT 'ACTIVE';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- -------------------------------------------------
-- LEASES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id),
  lease_number text UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_amount numeric(12, 2) NOT NULL,
  deposit_amount numeric(12, 2),
  pdf_url text,
  auto_renew boolean DEFAULT true,
  status public.lease_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS lease_number text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS rent_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS status public.lease_status DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- PAYMENTS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  lease_id uuid REFERENCES public.leases(id),
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  amount numeric(12, 2) NOT NULL,
  payment_method text,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  payment_month date,
  months_covered integer DEFAULT 1,
  transaction_id text,
  mpesa_receipt text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS lease_id uuid REFERENCES public.leases(id),
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS status public.payment_status DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS payment_month date,
  ADD COLUMN IF NOT EXISTS months_covered integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS mpesa_receipt text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- ISSUES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_user_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  title text NOT NULL,
  description text,
  category text,
  priority public.issue_priority DEFAULT 'NORMAL',
  status public.issue_status DEFAULT 'PENDING',
  caretaker_employee_id uuid REFERENCES public.employees(id),
  target_role text,
  sent_to text,
  reporter_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS tenant_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS priority public.issue_priority DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS status public.issue_status DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS caretaker_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS sent_to text,
  ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- REPAIRS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  tenant_id uuid REFERENCES public.tenants(id),
  caretaker_employee_id uuid REFERENCES public.employees(id),
  title text NOT NULL,
  description text,
  status public.repair_status NOT NULL DEFAULT 'PENDING',
  before_photo_url text,
  after_photo_url text,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------
-- ANNOUNCEMENTS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  sender_user_id uuid REFERENCES auth.users(id),
  sender_employee_id uuid REFERENCES public.employees(id),
  target_role text,
  is_global boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text DEFAULT '',
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS sender_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Migrate content to body if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'body'
  ) THEN
    ALTER TABLE public.announcements RENAME COLUMN content TO body;
  END IF;
END $$;

-- -------------------------------------------------
-- MESSAGES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL REFERENCES auth.users(id),
  receiver_user_id uuid NOT NULL REFERENCES auth.users(id),
  property_id uuid REFERENCES public.properties(id),
  tenant_id uuid REFERENCES public.tenants(id),
  subject text,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------
-- NOTIFICATIONS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'INFO',
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS type public.notification_type DEFAULT 'INFO',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- PROPERTY_REVIEWS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------
-- PROPERTY_LIKES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

-- -------------------------------------------------
-- PROPERTY_INVENTORY: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer DEFAULT 1,
  condition text,
  notes text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------
-- PROPERTY_FACILITIES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  water_source text,
  water_availability_days text,
  security text,
  parking boolean DEFAULT false,
  wifi boolean DEFAULT false,
  trash_collection text,
  notes text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------
-- PROPERTY_RULES: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_rules
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- PROPERTY_FAQS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_faqs
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS answer text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- TENANT_APPLICATIONS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid REFERENCES auth.users(id),
  full_name text,
  phone_number text,
  whatsapp_number text,
  registration_number text,
  email text,
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  status application_status NOT NULL DEFAULT 'PENDING',
  caretaker_approved boolean DEFAULT false,
  caretaker_employee_id uuid REFERENCES public.employees(id),
  admin_reviewed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_applications
  ADD COLUMN IF NOT EXISTS applicant_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS caretaker_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS caretaker_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- SUSPICIOUS_REPORTS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suspicious_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id),
  reporter_user_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES public.properties(id),
  report_type text,
  description text,
  status report_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suspicious_reports
  ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reporter_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS report_type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status report_status DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -------------------------------------------------
-- SITE_SETTINGS: Universal Contract
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  site_name text NOT NULL DEFAULT 'Arena Homes',
  logo_url text,
  tagline text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  office_location text,
  support_hours text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_name text DEFAULT 'Arena Homes',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS office_location text,
  ADD COLUMN IF NOT EXISTS support_hours text,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================================
-- PART 2: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON public.employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_assigned_property_id ON public.employees(assigned_property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_caretaker_employee_id ON public.tenants(caretaker_employee_id);
CREATE INDEX IF NOT EXISTS idx_properties_caretaker_employee_id ON public.properties(caretaker_employee_id);
CREATE INDEX IF NOT EXISTS idx_properties_caretaker_user_id ON public.properties(caretaker_user_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_verification_status ON public.properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_availability_status ON public.units(availability_status);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON public.leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON public.payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_issues_tenant_id ON public.issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_issues_property_id ON public.issues(property_id);
CREATE INDEX IF NOT EXISTS idx_issues_caretaker_employee_id ON public.issues(caretaker_employee_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_repairs_issue_id ON public.repairs(issue_id);
CREATE INDEX IF NOT EXISTS idx_repairs_property_id ON public.repairs(property_id);
CREATE INDEX IF NOT EXISTS idx_repairs_caretaker_employee_id ON public.repairs(caretaker_employee_id);
CREATE INDEX IF NOT EXISTS idx_repairs_tenant_id ON public.repairs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcements_property_id ON public.announcements(property_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target_role ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_sender_user_id ON public.announcements(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_user_id ON public.messages(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_tenant_id ON public.property_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_likes_property_id ON public.property_likes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_likes_user_id ON public.property_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_property_inventory_property_id ON public.property_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_property_facilities_property_id ON public.property_facilities(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_property_id ON public.tenant_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_applicant_user_id ON public.tenant_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON public.tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_property_id ON public.suspicious_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_status ON public.suspicious_reports(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_reports_reporter_user_id ON public.suspicious_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_property_rules_property_id ON public.property_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rules_is_active ON public.property_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_property_faqs_property_id ON public.property_faqs(property_id);
CREATE INDEX IF NOT EXISTS idx_property_faqs_is_active ON public.property_faqs(is_active);

-- ============================================================================
-- PART 3: HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

-- Function: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT e.role_id FROM public.employees e WHERE e.user_id = auth.uid()),
    (SELECT p.role_id FROM public.profiles p WHERE p.user_id = auth.uid()),
    'TENANT'
  );
$$;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid() AND e.role_id = 'ADMIN' AND e.status = 'ACTIVE'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role_id IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- Function: Check if user is caretaker
CREATE OR REPLACE FUNCTION public.is_caretaker()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid() AND e.role_id = 'CARETAKER' AND e.status = 'ACTIVE'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role_id = 'CARETAKER'
  );
$$;

-- Function: Check if user is tenant
CREATE OR REPLACE FUNCTION public.is_tenant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role_id = 'TENANT'
  );
$$;

-- Function: Get current employee ID
CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1;
$$;

-- Function: Get current tenant ID
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id FROM public.tenants t WHERE t.user_id = auth.uid() LIMIT 1;
$$;

-- Function: Get current assigned property ID
CREATE OR REPLACE FUNCTION public.current_assigned_property_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT e.assigned_property_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1),
    (SELECT t.property_id FROM public.tenants t WHERE t.user_id = auth.uid() LIMIT 1)
  );
$$;

-- Function: Check if user can read a property
CREATE OR REPLACE FUNCTION public.can_read_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_admin()
    OR public.is_caretaker()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = p_property_id
        AND (p.listing_status = 'PUBLISHED' OR p.verification_status = 'VERIFIED')
    )
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.user_id = auth.uid() AND t.property_id = p_property_id
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() AND e.assigned_property_id = p_property_id
    );
$$;

-- Function: Check if user can manage a property
DROP FUNCTION IF EXISTS public.can_manage_property(uuid);
CREATE OR REPLACE FUNCTION public.can_manage_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
        AND e.assigned_property_id = p_property_id
        AND e.role_id = 'CARETAKER'
        AND e.status = 'ACTIVE'
    );
$$;

-- ============================================================================
-- PART 4: SAFE DATA BACKFILLS (NO NEW ENUM VALUES)
-- ============================================================================

-- Profiles: guarded backfill from old compatibility columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET full_name = COALESCE(full_name, display_name) WHERE display_name IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET phone_number = COALESCE(phone_number, phone) WHERE phone IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET role_id = COALESCE(role_id, UPPER(role)) WHERE role IS NOT NULL';
  END IF;
END $$;

-- Properties: guarded caretaker_id backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'caretaker_id'
  ) THEN
    EXECUTE '
      UPDATE public.properties
      SET caretaker_user_id = COALESCE(caretaker_user_id, caretaker_id),
          caretaker_employee_id = COALESCE(caretaker_employee_id, (
            SELECT e.id FROM public.employees e
            WHERE e.user_id = COALESCE(properties.caretaker_user_id, properties.caretaker_id)
            AND e.role_id = ''CARETAKER''
            LIMIT 1
          ))
      WHERE caretaker_id IS NOT NULL OR caretaker_user_id IS NOT NULL
    ';
  END IF;
END $$;

-- Units: backfill room_number from type
UPDATE public.units SET room_number = type WHERE room_number IS NULL AND type IS NOT NULL;
UPDATE public.units SET room_number = 'R-' || LPAD(id::text, 3, '0') WHERE room_number IS NULL;

-- Tenants: backfill from profiles
UPDATE public.tenants t SET
  full_name = COALESCE(t.full_name, p.full_name),
  phone_number = COALESCE(t.phone_number, p.phone_number),
  email = COALESCE(t.email, p.email)
FROM public.profiles p WHERE t.user_id = p.user_id;

-- Tenants: backfill property_id and unit_id from leases
UPDATE public.tenants SET property_id = COALESCE(property_id, (
  SELECT u.property_id FROM public.leases l
  JOIN public.units u ON u.id = l.unit_id
  WHERE l.tenant_id = tenants.id AND l.status = 'ACTIVE'
  ORDER BY l.created_at DESC LIMIT 1
)) WHERE property_id IS NULL;

UPDATE public.tenants SET unit_id = COALESCE(unit_id, (
  SELECT l.unit_id FROM public.leases l
  WHERE l.tenant_id = tenants.id AND l.status = 'ACTIVE'
  ORDER BY l.created_at DESC LIMIT 1
)) WHERE unit_id IS NULL;

-- Tenants: backfill caretaker from properties
UPDATE public.tenants SET
  caretaker_user_id = COALESCE(caretaker_user_id, (
    SELECT p.caretaker_user_id FROM public.properties p WHERE p.id = tenants.property_id
  )),
  caretaker_employee_id = COALESCE(caretaker_employee_id, (
    SELECT p.caretaker_employee_id FROM public.properties p WHERE p.id = tenants.property_id
  ));

-- Tenants: backfill room_number from units
UPDATE public.tenants SET room_number = (
  SELECT u.room_number FROM public.units u WHERE u.id = tenants.unit_id
) WHERE room_number IS NULL AND unit_id IS NOT NULL;

-- Leases: backfill property_id from units
UPDATE public.leases SET property_id = (
  SELECT u.property_id FROM public.units u WHERE u.id = leases.unit_id
) WHERE property_id IS NULL;

-- Leases: generate unique lease numbers (sequential)
WITH numbered_leases AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.leases WHERE lease_number IS NULL
)
UPDATE public.leases l SET lease_number = 'LS-' || LPAD(n.rn::text, 6, '0')
FROM numbered_leases n WHERE l.id = n.id;

-- Payments: backfill property_id and unit_id from leases
UPDATE public.payments SET
  property_id = COALESCE(property_id, (SELECT l.property_id FROM public.leases l WHERE l.id = payments.lease_id)),
  unit_id = COALESCE(unit_id, (SELECT l.unit_id FROM public.leases l WHERE l.id = payments.lease_id));

UPDATE public.payments SET
  property_id = COALESCE(property_id, (SELECT t.property_id FROM public.tenants t WHERE t.id = payments.tenant_id)),
  unit_id = COALESCE(unit_id, (SELECT t.unit_id FROM public.tenants t WHERE t.id = payments.tenant_id))
WHERE property_id IS NULL OR unit_id IS NULL;

-- Issues: backfill tenant_id and tenant_user_id
UPDATE public.issues SET
  tenant_id = COALESCE(tenant_id, (SELECT t.id FROM public.tenants t WHERE t.user_id = issues.reporter_id)),
  tenant_user_id = COALESCE(tenant_user_id, reporter_id);

-- Issues: backfill property_id from unit_id
UPDATE public.issues SET property_id = (
  SELECT u.property_id FROM public.units u WHERE u.id = issues.unit_id
) WHERE property_id IS NULL AND unit_id IS NOT NULL;

-- Issues: Status backfill intentionally skipped (cannot use new enum values in same transaction)
-- Run issue status cleanup in a later migration

-- Repairs: create from maintenance_requests
INSERT INTO public.repairs (title, description, status, created_at, updated_at)
SELECT 
  title, description, 
  CASE status
    WHEN 'SCHEDULED' THEN 'PENDING'::public.repair_status
    WHEN 'COMPLETED' THEN 'SOLVED'::public.repair_status
    WHEN 'CANCELLED' THEN 'CANCELLED'::public.repair_status
  END,
  created_at, COALESCE(updated_at, created_at)
FROM public.maintenance_requests
WHERE NOT EXISTS (SELECT 1 FROM public.repairs WHERE repairs.title = maintenance_requests.title AND repairs.created_at = maintenance_requests.created_at);

-- Announcements: backfill sender data
UPDATE public.announcements SET
  sender_user_id = COALESCE(sender_user_id, author_id),
  is_published = COALESCE(is_active, true);

-- Property facilities: migrate from facilities JSONB
INSERT INTO public.property_facilities (property_id, water_source, security, parking, wifi, trash_collection, created_at, updated_at)
SELECT 
  p.id,
  p.facilities->>'water_source',
  p.facilities->>'security',
  COALESCE((p.facilities->>'parking')::boolean, false),
  COALESCE((p.facilities->>'wifi')::boolean, false),
  p.facilities->>'trash_collection',
  NOW(), NOW()
FROM public.properties p
WHERE p.facilities IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.property_facilities pf WHERE pf.property_id = p.id);

-- Property reviews: migrate from tenant_comments
INSERT INTO public.property_reviews (tenant_id, property_id, rating, comment, created_at, updated_at)
SELECT 
  tenant_id, property_id, rating, comment_text, created_at, updated_at
FROM public.tenant_comments
WHERE property_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.property_reviews pr 
    WHERE pr.tenant_id = tenant_comments.tenant_id AND pr.property_id = tenant_comments.property_id
  );

-- Tenant applications: migrate from old table (guarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenant_applications_old'
  ) THEN
    INSERT INTO public.tenant_applications (
      id, applicant_user_id, full_name, phone_number, whatsapp_number, registration_number, 
      email, property_id, status, caretaker_approved, created_at, updated_at
    )
    SELECT 
      id, user_id, full_name, phone_number, whatsapp_number, university_reg_no,
      email, property_id,
      CASE 
        WHEN status = 'PENDING' THEN 'PENDING'::public.application_status
        WHEN status = 'APPROVED' THEN 'APPROVED'::public.application_status
        WHEN status = 'REJECTED' THEN 'REJECTED'::public.application_status
        ELSE 'PENDING'::public.application_status
      END,
      CASE WHEN caretaker_notes IS NOT NULL THEN true ELSE false END,
      created_at, updated_at
    FROM public.tenant_applications_old
    WHERE NOT EXISTS (SELECT 1 FROM public.tenant_applications ta WHERE ta.id = tenant_applications_old.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Suspicious reports: backfill reporter_user_id
UPDATE public.suspicious_reports SET reporter_user_id = reporter_id WHERE reporter_user_id IS NULL;

-- Site settings: insert default
INSERT INTO public.site_settings (id, site_name) VALUES ('default', 'Arena Homes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 5: CHECK CONSTRAINTS (only for text columns, not enums)
-- ============================================================================

DO $$
BEGIN
  -- Only add verification_status check if it's text/varchar (not enum)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'verification_status'
    AND data_type IN ('text', 'character varying')
  ) THEN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_verification_status_check;
    ALTER TABLE public.properties ADD CONSTRAINT properties_verification_status_check
      CHECK (verification_status IN ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'FLAGGED'));
  END IF;

  -- Only add listing_status check if it's text/varchar (not enum) - HIDDEN removed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'listing_status'
    AND data_type IN ('text', 'character varying')
  ) THEN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_status_check;
    ALTER TABLE public.properties ADD CONSTRAINT properties_listing_status_check
      CHECK (listing_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
  END IF;
END $$;

-- ============================================================================
-- PART 6: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 7: RLS POLICIES
-- ============================================================================

-- PROFILES policies
DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;
CREATE POLICY profiles_select_self_or_admin ON public.profiles FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- EMPLOYEES policies
DROP POLICY IF EXISTS employees_select_own_or_admin ON public.employees;
CREATE POLICY employees_select_own_or_admin ON public.employees FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS employees_manage_admin ON public.employees;
CREATE POLICY employees_manage_admin ON public.employees FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TENANTS policies
DROP POLICY IF EXISTS tenants_select_own_or_staff ON public.tenants;
CREATE POLICY tenants_select_own_or_staff ON public.tenants FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_admin()
    OR (public.is_caretaker() AND property_id = public.current_assigned_property_id())
  );

DROP POLICY IF EXISTS tenants_manage_admin ON public.tenants;
CREATE POLICY tenants_manage_admin ON public.tenants FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROPERTIES policies
DROP POLICY IF EXISTS properties_select_public_or_auth ON public.properties;
CREATE POLICY properties_select_public_or_auth ON public.properties FOR SELECT
  USING (
    public.can_read_property(id) OR public.is_admin() OR caretaker_user_id = auth.uid()
  );

DROP POLICY IF EXISTS properties_manage_admin_or_caretaker ON public.properties;
CREATE POLICY properties_manage_admin_or_caretaker ON public.properties FOR ALL
  USING (public.is_admin() OR public.can_manage_property(id))
  WITH CHECK (public.is_admin() OR public.can_manage_property(id));

-- UNITS policies
DROP POLICY IF EXISTS units_select_accessible ON public.units;
CREATE POLICY units_select_accessible ON public.units FOR SELECT
  USING (
    public.can_read_property(property_id) OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.unit_id = id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS units_manage_property_staff ON public.units;
CREATE POLICY units_manage_property_staff ON public.units FOR ALL
  USING (public.can_manage_property(property_id) OR public.is_admin())
  WITH CHECK (public.can_manage_property(property_id) OR public.is_admin());

-- LEASES policies
DROP POLICY IF EXISTS leases_select_own_or_staff ON public.leases;
CREATE POLICY leases_select_own_or_staff ON public.leases FOR SELECT
  USING (
    tenant_id = public.current_tenant_id() OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenants t 
      JOIN public.employees e ON e.assigned_property_id = t.property_id
      WHERE t.id = leases.tenant_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS leases_manage_admin ON public.leases;
CREATE POLICY leases_manage_admin ON public.leases FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PAYMENTS policies
DROP POLICY IF EXISTS payments_select_own_or_admin ON public.payments;
CREATE POLICY payments_select_own_or_admin ON public.payments FOR SELECT
  USING (tenant_id = public.current_tenant_id() OR public.is_admin());

DROP POLICY IF EXISTS payments_manage_admin ON public.payments;
CREATE POLICY payments_manage_admin ON public.payments FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ISSUES policies
DROP POLICY IF EXISTS issues_select_own_or_staff ON public.issues;
CREATE POLICY issues_select_own_or_staff ON public.issues FOR SELECT
  USING (
    tenant_user_id = auth.uid() OR public.is_admin()
    OR (public.is_caretaker() AND property_id = public.current_assigned_property_id())
  );

DROP POLICY IF EXISTS issues_insert_tenant ON public.issues;
CREATE POLICY issues_insert_tenant ON public.issues FOR INSERT
  WITH CHECK (tenant_user_id = auth.uid());

DROP POLICY IF EXISTS issues_manage_staff ON public.issues;
CREATE POLICY issues_manage_staff ON public.issues FOR UPDATE
  USING (public.is_admin() OR (public.is_caretaker() AND property_id = public.current_assigned_property_id()));

-- REPAIRS policies
DROP POLICY IF EXISTS repairs_select_own_or_staff ON public.repairs;
CREATE POLICY repairs_select_own_or_staff ON public.repairs FOR SELECT
  USING (
    tenant_id = public.current_tenant_id() OR public.is_admin()
    OR (public.is_caretaker() AND property_id = public.current_assigned_property_id())
  );

DROP POLICY IF EXISTS repairs_manage_staff ON public.repairs;
CREATE POLICY repairs_manage_staff ON public.repairs FOR ALL
  USING (public.is_admin() OR (public.is_caretaker() AND property_id = public.current_assigned_property_id()))
  WITH CHECK (public.is_admin() OR (public.is_caretaker() AND property_id = public.current_assigned_property_id()));

-- ANNOUNCEMENTS policies
DROP POLICY IF EXISTS announcements_select_published ON public.announcements;
CREATE POLICY announcements_select_published ON public.announcements FOR SELECT
  USING (
    is_published = true AND (is_global = true OR property_id = public.current_assigned_property_id() OR target_role = public.current_user_role())
    OR public.is_admin() OR sender_user_id = auth.uid()
  );

DROP POLICY IF EXISTS announcements_manage_staff ON public.announcements;
CREATE POLICY announcements_manage_staff ON public.announcements FOR ALL
  USING (public.is_admin() OR sender_user_id = auth.uid() OR (public.is_caretaker() AND property_id = public.current_assigned_property_id()))
  WITH CHECK (public.is_admin() OR sender_user_id = auth.uid() OR (public.is_caretaker() AND property_id = public.current_assigned_property_id()));

-- PROPERTY_RULES policies
DROP POLICY IF EXISTS property_rules_select_public ON public.property_rules;
CREATE POLICY property_rules_select_public ON public.property_rules FOR SELECT
  USING (is_active = true AND (public.can_read_property(property_id) OR public.is_admin()));

DROP POLICY IF EXISTS property_rules_manage_staff ON public.property_rules;
CREATE POLICY property_rules_manage_staff ON public.property_rules FOR ALL
  USING (public.is_admin() OR public.can_manage_property(property_id))
  WITH CHECK (public.is_admin() OR public.can_manage_property(property_id));

-- PROPERTY_FAQS policies
DROP POLICY IF EXISTS property_faqs_select_public ON public.property_faqs;
CREATE POLICY property_faqs_select_public ON public.property_faqs FOR SELECT
  USING (is_active = true AND (public.can_read_property(property_id) OR public.is_admin()));

DROP POLICY IF EXISTS property_faqs_manage_staff ON public.property_faqs;
CREATE POLICY property_faqs_manage_staff ON public.property_faqs FOR ALL
  USING (public.is_admin() OR public.can_manage_property(property_id))
  WITH CHECK (public.is_admin() OR public.can_manage_property(property_id));

-- MESSAGES policies
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT
  USING (sender_user_id = auth.uid() OR receiver_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
CREATE POLICY messages_insert_sender ON public.messages FOR INSERT
  WITH CHECK (sender_user_id = auth.uid());

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- PROPERTY_REVIEWS policies
DROP POLICY IF EXISTS property_reviews_select_public ON public.property_reviews;
CREATE POLICY property_reviews_select_public ON public.property_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS property_reviews_insert_tenant ON public.property_reviews;
CREATE POLICY property_reviews_insert_tenant ON public.property_reviews FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.property_id = property_reviews.property_id)
  );

DROP POLICY IF EXISTS property_reviews_manage_admin ON public.property_reviews;
CREATE POLICY property_reviews_manage_admin ON public.property_reviews FOR UPDATE
  USING (public.is_admin());

-- PROPERTY_LIKES policies
DROP POLICY IF EXISTS property_likes_select_public ON public.property_likes;
CREATE POLICY property_likes_select_public ON public.property_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS property_likes_manage_own ON public.property_likes;
CREATE POLICY property_likes_manage_own ON public.property_likes FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- PROPERTY_INVENTORY policies
DROP POLICY IF EXISTS property_inventory_select_staff ON public.property_inventory;
CREATE POLICY property_inventory_select_staff ON public.property_inventory FOR SELECT
  USING (public.can_read_property(property_id) OR public.is_admin());

DROP POLICY IF EXISTS property_inventory_manage_staff ON public.property_inventory;
CREATE POLICY property_inventory_manage_staff ON public.property_inventory FOR ALL
  USING (public.can_manage_property(property_id) OR public.is_admin())
  WITH CHECK (public.can_manage_property(property_id) OR public.is_admin());

-- PROPERTY_FACILITIES policies
DROP POLICY IF EXISTS property_facilities_select_public ON public.property_facilities;
CREATE POLICY property_facilities_select_public ON public.property_facilities FOR SELECT
  USING (public.can_read_property(property_id) OR public.is_admin());

DROP POLICY IF EXISTS property_facilities_manage_staff ON public.property_facilities;
CREATE POLICY property_facilities_manage_staff ON public.property_facilities FOR ALL
  USING (public.can_manage_property(property_id) OR public.is_admin())
  WITH CHECK (public.can_manage_property(property_id) OR public.is_admin());

-- TENANT_APPLICATIONS policies
-- Anyone can submit an application (anonymous inserts allowed)
DROP POLICY IF EXISTS tenant_applications_insert_anonymous ON public.tenant_applications;
CREATE POLICY tenant_applications_insert_anonymous ON public.tenant_applications FOR INSERT
  WITH CHECK (true);

-- Only caretaker of the property or admin can view applications
DROP POLICY IF EXISTS tenant_applications_select_caretaker ON public.tenant_applications;
CREATE POLICY tenant_applications_select_caretaker ON public.tenant_applications FOR SELECT
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- Only caretaker of the property or admin can update applications
DROP POLICY IF EXISTS tenant_applications_update_caretaker ON public.tenant_applications;
CREATE POLICY tenant_applications_update_caretaker ON public.tenant_applications FOR UPDATE
  USING (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tenant_applications.property_id 
      AND p.caretaker_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() 
      AND e.role_id = 'CARETAKER'
      AND e.assigned_property_id = tenant_applications.property_id
    )
  );

-- SUSPICIOUS_REPORTS policies
DROP POLICY IF EXISTS suspicious_reports_select_own_or_admin ON public.suspicious_reports;
CREATE POLICY suspicious_reports_select_own_or_admin ON public.suspicious_reports FOR SELECT
  USING (reporter_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS suspicious_reports_insert_auth ON public.suspicious_reports;
CREATE POLICY suspicious_reports_insert_auth ON public.suspicious_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS suspicious_reports_manage_admin ON public.suspicious_reports;
CREATE POLICY suspicious_reports_manage_admin ON public.suspicious_reports FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SITE_SETTINGS policies
DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;
CREATE POLICY site_settings_select_public ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS site_settings_manage_admin ON public.site_settings;
CREATE POLICY site_settings_manage_admin ON public.site_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- PART 8: TRIGGERS
-- ============================================================================

-- Universal updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
  tables text[] := ARRAY[
    'profiles', 'employees', 'tenants', 'properties', 'units', 
    'leases', 'payments', 'issues', 'repairs', 'announcements',
    'property_rules', 'property_faqs', 'property_reviews', 
    'property_inventory', 'property_facilities', 'tenant_applications',
    'suspicious_reports', 'site_settings', 'messages'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%s', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- Auth user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'TENANT')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- PART 9: DATABASE VIEWS FOR FRONTEND
-- ============================================================================

-- View 1: Tenant Dashboard View (uses to_jsonb for safe column access)
CREATE OR REPLACE VIEW public.tenant_dashboard_view AS
SELECT 
  t.id AS tenant_id,
  t.user_id AS tenant_user_id,
  COALESCE(to_jsonb(t)->>'full_name', to_jsonb(t)->>'first_name', p.full_name, au.email) AS tenant_full_name,
  COALESCE(to_jsonb(t)->>'phone_number', to_jsonb(t)->>'phone') AS tenant_phone_number,
  to_jsonb(t)->>'whatsapp_number' AS tenant_whatsapp_number,
  to_jsonb(t)->>'registration_number' AS tenant_registration_number,
  COALESCE(to_jsonb(t)->>'email', au.email) AS tenant_email,
  to_jsonb(t)->>'logo_url' AS tenant_logo_url,
  t.property_id,
  prop.name AS property_name,
  prop.property_type,
  prop.latitude AS property_latitude,
  prop.longitude AS property_longitude,
  t.unit_id,
  u.room_number,
  u.room_type,
  u.base_price AS room_price,
  t.caretaker_employee_id,
  t.caretaker_user_id,
  ce.full_name AS caretaker_full_name,
  ce.phone_number AS caretaker_phone_number,
  ce.whatsapp_number AS caretaker_whatsapp_number,
  ce.email AS caretaker_email,
  l.id AS lease_id,
  l.lease_number,
  l.start_date AS lease_start_date,
  l.end_date AS lease_end_date,
  l.status AS lease_status,
  l.pdf_url AS lease_pdf_url,
  COALESCE((SELECT SUM(py.months_covered) FROM public.payments py WHERE py.tenant_id = t.id AND py.status = 'SUCCESS'), 0) AS paid_months,
  (to_jsonb(t)->>'move_in_date')::date AS move_in_date,
  (to_jsonb(t)->>'move_out_date')::date AS move_out_date,
  (SELECT COUNT(*) FROM public.issues i WHERE i.tenant_id = t.id AND i.status::text = 'PENDING') AS pending_issues_count,
  (SELECT COUNT(*) FROM public.issues i WHERE i.tenant_id = t.id AND i.status::text = 'RESOLVED') AS resolved_issues_count,
  (SELECT COUNT(*) FROM public.repairs r WHERE r.tenant_id = t.id AND r.status::text IN ('PENDING', 'IN_PROGRESS')) AS pending_repairs_count,
  (SELECT COUNT(*) FROM public.repairs r WHERE r.tenant_id = t.id AND r.status::text = 'SOLVED') AS solved_repairs_count,
  (SELECT COUNT(*) FROM public.notifications n WHERE n.user_id = t.user_id AND n.read_at IS NULL) AS notifications_count,
  (SELECT COUNT(*) FROM public.announcements a 
   WHERE a.is_published = true AND (a.is_global = true OR a.property_id = t.property_id OR a.target_role = 'TENANT')) AS announcements_count,
  (SELECT ROUND(AVG(pr.rating), 1) FROM public.property_reviews pr WHERE pr.property_id = t.property_id) AS average_property_rating
FROM public.tenants t
LEFT JOIN public.profiles p ON p.user_id = t.user_id
LEFT JOIN auth.users au ON au.id = t.user_id
LEFT JOIN public.properties prop ON prop.id = t.property_id
LEFT JOIN public.units u ON u.id = t.unit_id
LEFT JOIN public.employees ce ON ce.id = t.caretaker_employee_id
LEFT JOIN public.leases l ON l.tenant_id = t.id AND l.status = 'ACTIVE';

-- View 2: Admin Properties View
CREATE OR REPLACE VIEW public.admin_properties_view AS
SELECT 
  p.id AS property_id,
  p.name AS property_name,
  p.location,
  p.property_type,
  p.caretaker_employee_id,
  p.caretaker_user_id,
  ce.full_name AS caretaker_full_name,
  ce.phone_number AS caretaker_phone_number,
  ce.email AS caretaker_email,
  p.verification_status,
  p.listing_status,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id) AS total_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND (u.status = 'TAKEN' OR u.availability_status = 'OCCUPIED')) AS occupied_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND (u.status = 'VACANT' OR u.availability_status = 'AVAILABLE')) AS vacant_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'RESERVED') AS reserved_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND u.availability_status = 'UNDER_MAINTENANCE') AS maintenance_rooms,
  COALESCE(p.price_min, (SELECT MIN(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_min,
  COALESCE(p.price_max, (SELECT MAX(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_max,
  p.deposit_required,
  p.deposit_amount,
  p.latitude,
  p.longitude,
  (SELECT ROUND(AVG(pr.rating), 1) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS overall_rating,
  (SELECT COUNT(*) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS review_count,
  (SELECT COUNT(*) FROM public.property_likes pl WHERE pl.property_id = p.id) AS likes_count,
  (SELECT COUNT(*) FROM public.tenants t WHERE t.property_id = p.id) AS tenant_count,
  p.created_at,
  p.updated_at
FROM public.properties p
LEFT JOIN public.employees ce ON ce.id = p.caretaker_employee_id;

-- View 3: Public Properties View
CREATE OR REPLACE VIEW public.public_properties_view AS
SELECT 
  p.id AS property_id,
  p.name AS property_name,
  p.location,
  p.property_type,
  p.description,
  p.verification_status,
  p.listing_status,
  p.cover_photo_url,
  p.gate_photo_url,
  p.logo_url,
  p.latitude,
  p.longitude,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id) AS total_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND (u.status = 'VACANT' OR u.availability_status = 'AVAILABLE')) AS vacant_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id AND (u.status = 'TAKEN' OR u.availability_status = 'OCCUPIED')) AS occupied_rooms,
  COALESCE(p.price_min, (SELECT MIN(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_min,
  COALESCE(p.price_max, (SELECT MAX(u.base_price) FROM public.units u WHERE u.property_id = p.id)) AS price_max,
  p.deposit_required,
  CASE WHEN p.caretaker_employee_id IS NOT NULL THEN true ELSE false END AS caretaker_assigned,
  ce.full_name AS caretaker_name,
  (SELECT ROUND(AVG(pr.rating), 1) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS overall_rating,
  (SELECT COUNT(*) FROM public.property_reviews pr WHERE pr.property_id = p.id) AS review_count,
  (SELECT COUNT(*) FROM public.property_likes pl WHERE pl.property_id = p.id) AS likes_count,
  p.created_at
FROM public.properties p
LEFT JOIN public.employees ce ON ce.id = p.caretaker_employee_id
WHERE p.verification_status != 'SUSPENDED' AND p.listing_status = 'PUBLISHED';

-- View 4: Caretaker Dashboard View
CREATE OR REPLACE VIEW public.caretaker_dashboard_view AS
SELECT 
  e.id AS caretaker_employee_id,
  e.user_id AS caretaker_user_id,
  e.full_name AS caretaker_full_name,
  e.phone_number AS caretaker_phone_number,
  e.email AS caretaker_email,
  e.assigned_property_id,
  p.name AS property_name,
  p.location AS property_location,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id) AS total_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id AND (u.status = 'TAKEN' OR u.availability_status = 'OCCUPIED')) AS occupied_rooms,
  (SELECT COUNT(*) FROM public.units u WHERE u.property_id = e.assigned_property_id AND (u.status = 'VACANT' OR u.availability_status = 'AVAILABLE')) AS vacant_rooms,
  (SELECT COUNT(*) FROM public.tenants t WHERE t.property_id = e.assigned_property_id) AS tenants_count,
  (SELECT COUNT(*) FROM public.issues i WHERE i.property_id = e.assigned_property_id AND i.status::text = 'PENDING') AS pending_issues_count,
  (SELECT COUNT(*) FROM public.issues i WHERE i.property_id = e.assigned_property_id AND i.status::text = 'RESOLVED') AS resolved_issues_count,
  (SELECT COUNT(*) FROM public.repairs r WHERE r.property_id = e.assigned_property_id AND r.status::text IN ('PENDING', 'IN_PROGRESS')) AS pending_repairs_count,
  (SELECT COUNT(*) FROM public.repairs r WHERE r.property_id = e.assigned_property_id AND r.status::text = 'SOLVED') AS solved_repairs_count,
  (SELECT COUNT(*) FROM public.tenant_applications ta WHERE ta.property_id = e.assigned_property_id AND ta.status::text = 'PENDING') AS pending_applications_count,
  (SELECT COUNT(*) FROM public.announcements a WHERE a.sender_employee_id = e.id) AS outgoing_announcements_count,
  (SELECT COUNT(*) FROM public.announcements a 
   WHERE a.target_role = 'CARETAKER' OR (a.property_id = e.assigned_property_id AND a.is_published = true)) AS incoming_announcements_count
FROM public.employees e
LEFT JOIN public.properties p ON p.id = e.assigned_property_id
WHERE e.role_id = 'CARETAKER' AND e.status = 'ACTIVE';

-- ============================================================================
-- PART 10: GRANT PERMISSIONS ON VIEWS
-- ============================================================================

GRANT SELECT ON public.tenant_dashboard_view TO authenticated;
GRANT SELECT ON public.admin_properties_view TO authenticated;
GRANT SELECT ON public.public_properties_view TO anon;
GRANT SELECT ON public.public_properties_view TO authenticated;
GRANT SELECT ON public.caretaker_dashboard_view TO authenticated;

-- ============================================================================
-- PART 11: VALIDATION QUERY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_universal_contract()
RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'migration_name', '0010_universal_database_contract.sql',
    'executed_at', now(),
    'tables', jsonb_build_object(
      'profiles', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles'),
      'employees', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees'),
      'tenants', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants'),
      'properties', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties'),
      'units', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units'),
      'leases', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leases'),
      'payments', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments'),
      'issues', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'issues'),
      'repairs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'repairs'),
      'announcements', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements'),
      'messages', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'),
      'notifications', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications'),
      'property_reviews', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_reviews'),
      'property_likes', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_likes'),
      'property_inventory', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_inventory'),
      'property_facilities', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_facilities'),
      'property_rules', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_rules'),
      'property_faqs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_faqs'),
      'tenant_applications', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_applications'),
      'suspicious_reports', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suspicious_reports'),
      'site_settings', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings')
    ),
    'views', jsonb_build_object(
      'tenant_dashboard_view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tenant_dashboard_view'),
      'admin_properties_view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'admin_properties_view'),
      'public_properties_view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'public_properties_view'),
      'caretaker_dashboard_view', EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'caretaker_dashboard_view')
    ),
    'counts', jsonb_build_object(
      'properties', (SELECT COUNT(*) FROM public.properties),
      'units', (SELECT COUNT(*) FROM public.units),
      'tenants', (SELECT COUNT(*) FROM public.tenants),
      'employees', (SELECT COUNT(*) FROM public.employees),
      'caretakers', (SELECT COUNT(*) FROM public.employees WHERE role_id = 'CARETAKER'),
      'leases', (SELECT COUNT(*) FROM public.leases),
      'payments', (SELECT COUNT(*) FROM public.payments),
      'issues', (SELECT COUNT(*) FROM public.issues),
      'repairs', (SELECT COUNT(*) FROM public.repairs)
    )
  );
$$;

-- Run validation
SELECT public.validate_universal_contract();

-- ============================================================================
-- MIGRATION COMPLETE - UNIVERSAL CONTRACT ENFORCED
-- ============================================================================

COMMENT ON FUNCTION public.validate_universal_contract() IS 'Validates the universal database contract is properly applied';
