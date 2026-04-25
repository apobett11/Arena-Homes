-- Admin dashboard enhancement schema additions.
-- Additive and safe: no destructive changes.

create table if not exists public.site_settings (
  id text primary key default 'default',
  site_name text not null default 'Arena Homes',
  logo_url text,
  tagline text,
  contact_email text,
  contact_phone text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  is_published boolean not null default false,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  last_online timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.employee_metrics (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  completion_percent numeric(5,2) check (completion_percent >= 0 and completion_percent <= 100),
  assigned_jobs_count integer not null default 0,
  resolved_jobs_count integer not null default 0,
  open_jobs_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists set_legal_documents_updated_at on public.legal_documents;
create trigger set_legal_documents_updated_at before update on public.legal_documents for each row execute function public.set_updated_at();
drop trigger if exists set_employee_activity_updated_at on public.employee_activity;
create trigger set_employee_activity_updated_at before update on public.employee_activity for each row execute function public.set_updated_at();
drop trigger if exists set_employee_metrics_updated_at on public.employee_metrics;
create trigger set_employee_metrics_updated_at before update on public.employee_metrics for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.legal_documents enable row level security;
alter table public.employee_activity enable row level security;
alter table public.employee_metrics enable row level security;

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select using (true);
drop policy if exists site_settings_admin_manage on public.site_settings;
create policy site_settings_admin_manage on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists legal_documents_public_read on public.legal_documents;
create policy legal_documents_public_read on public.legal_documents for select
using (is_published or public.is_admin());
drop policy if exists legal_documents_admin_manage on public.legal_documents;
create policy legal_documents_admin_manage on public.legal_documents for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists employee_activity_admin_read on public.employee_activity;
create policy employee_activity_admin_read on public.employee_activity for select
using (public.is_admin() or user_id = auth.uid());
drop policy if exists employee_activity_self_write on public.employee_activity;
create policy employee_activity_self_write on public.employee_activity for insert
with check (public.is_admin() or user_id = auth.uid());
drop policy if exists employee_activity_update_self on public.employee_activity;
create policy employee_activity_update_self on public.employee_activity for update
using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

drop policy if exists employee_metrics_admin_read on public.employee_metrics;
create policy employee_metrics_admin_read on public.employee_metrics for select using (public.is_admin());
drop policy if exists employee_metrics_admin_manage on public.employee_metrics;
create policy employee_metrics_admin_manage on public.employee_metrics for all
using (public.is_admin())
with check (public.is_admin());

