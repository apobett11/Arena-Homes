-- Tenant dashboard enhancements for complaints, activity logs, and share codes.
-- Safe additive migration.

create extension if not exists pgcrypto;

alter table if exists public.issues
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
alter table if exists public.issues
  add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table if exists public.issues
  add column if not exists lease_id uuid references public.leases(id) on delete set null;
alter table if exists public.issues
  add column if not exists target_audience text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'issues_target_audience_check'
  ) then
    alter table public.issues
      add constraint issues_target_audience_check
      check (target_audience is null or target_audience in ('CARETAKER', 'ADMIN'));
  end if;
end $$;

create index if not exists idx_issues_reporter_created_at on public.issues(reporter_id, created_at desc);
create index if not exists idx_issues_target_audience on public.issues(target_audience);
create index if not exists idx_issues_tenant_id on public.issues(tenant_id);

create table if not exists public.tenant_activity_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_activity_logs_user_created on public.tenant_activity_logs(tenant_user_id, created_at desc);
create index if not exists idx_tenant_activity_logs_type on public.tenant_activity_logs(activity_type);

alter table public.tenant_activity_logs enable row level security;

drop policy if exists tenant_activity_logs_select on public.tenant_activity_logs;
create policy tenant_activity_logs_select
on public.tenant_activity_logs
for select
using (tenant_user_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists tenant_activity_logs_insert on public.tenant_activity_logs;
create policy tenant_activity_logs_insert
on public.tenant_activity_logs
for insert
with check (tenant_user_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));

create table if not exists public.location_share_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  tenant_user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_location_share_codes_tenant on public.location_share_codes(tenant_user_id, created_at desc);
create index if not exists idx_location_share_codes_code on public.location_share_codes(code);

alter table public.location_share_codes enable row level security;

drop policy if exists location_share_codes_owner_all on public.location_share_codes;
create policy location_share_codes_owner_all
on public.location_share_codes
for all
using (tenant_user_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'))
with check (tenant_user_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));

create or replace function public.get_location_share_code(p_code text)
returns table (
  code text,
  property_id uuid,
  unit_id uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select lsc.code, lsc.property_id, lsc.unit_id, lsc.created_at
  from public.location_share_codes lsc
  where lsc.code = upper(trim(p_code))
    and (lsc.expires_at is null or lsc.expires_at > now())
  limit 1
$$;
