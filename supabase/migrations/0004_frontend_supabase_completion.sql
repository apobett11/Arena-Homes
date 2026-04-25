-- Frontend-complete Supabase architecture for Arena web app.
-- PostgreSQL/Supabase SQL only. Extends existing schema without destructive changes.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'employee_status') then
    create type public.employee_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'maintenance_priority') then
    create type public.maintenance_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
  end if;
  if not exists (select 1 from pg_type where typname = 'warning_severity') then
    create type public.warning_severity as enum ('NOTICE', 'WARNING', 'FINAL_WARNING');
  end if;
end $$;

create table if not exists public.employee_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id text not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.employee_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(role_id, permission_id)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role_id text not null references public.roles(id),
  full_name text,
  email text,
  phone_number text,
  status public.employee_status not null default 'ACTIVE',
  emergency_contact text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_property_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  assignment_type text not null default 'PRIMARY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, property_id, assignment_type)
);

create table if not exists public.tenant_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  phone_number text,
  whatsapp_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  enable_email_notifications boolean not null default true,
  enable_sms_notifications boolean not null default false,
  dark_mode boolean not null default false,
  language_code text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_unit_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  lease_id uuid references public.leases(id) on delete set null,
  is_primary boolean not null default true,
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_lease_documents (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_terms_acceptance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  accepted_ip inet,
  accepted_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, property_id, terms_version)
);

create table if not exists public.tenant_warnings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  issued_by uuid not null references auth.users(id),
  severity public.warning_severity not null default 'WARNING',
  title text not null,
  details text,
  issued_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  property_id uuid references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment_text text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_request_updates (
  id uuid primary key default gen_random_uuid(),
  maintenance_request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  updated_by uuid references auth.users(id),
  old_status public.maintenance_status,
  new_status public.maintenance_status,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.property_faqs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  details text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_terms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  version text not null,
  title text not null,
  body text not null,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, version)
);

create table if not exists public.house_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  photo_url text not null,
  caption text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.house_amenities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_key text not null,
  amenity_label text not null,
  icon_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, amenity_key)
);

create table if not exists public.house_nearby_places (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  place_name text not null,
  place_type text,
  distance_km numeric(8,2),
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.house_map_locations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  gate_label text not null,
  plot_label text not null,
  gate_lat numeric(10,7) not null,
  gate_lng numeric(10,7) not null,
  house_lat numeric(10,7) not null,
  house_lng numeric(10,7) not null,
  invite_pin_code text unique,
  realtime_map_max_uses integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(announcement_id, user_id)
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  uploaded_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bucket, path)
);

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties add column if not exists listing_status public.listing_status not null default 'PUBLISHED';
alter table public.properties add column if not exists distance_from_school_km numeric(8,2);
alter table public.properties add column if not exists description text;

alter table public.units add column if not exists room_type text;
alter table public.units add column if not exists bedrooms integer;
alter table public.units add column if not exists bathrooms integer;
alter table public.units add column if not exists is_public boolean not null default true;

alter table public.maintenance_requests add column if not exists tenant_id uuid references public.tenants(id) on delete set null;
alter table public.maintenance_requests add column if not exists unit_id uuid references public.units(id) on delete set null;
alter table public.maintenance_requests add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.maintenance_requests add column if not exists priority public.maintenance_priority not null default 'MEDIUM';
alter table public.maintenance_requests add column if not exists updated_at timestamptz not null default now();

alter table public.announcements add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.announcements add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_properties_location on public.properties(location);
create index if not exists idx_properties_listing_status on public.properties(listing_status);
create index if not exists idx_properties_distance on public.properties(distance_from_school_km);
create index if not exists idx_units_status on public.units(status);
create index if not exists idx_units_room_type on public.units(room_type);
create index if not exists idx_units_price on public.units(base_price);
create index if not exists idx_maintenance_requests_status on public.maintenance_requests(status);
create index if not exists idx_maintenance_requests_priority on public.maintenance_requests(priority);
create index if not exists idx_tenant_warnings_tenant_id on public.tenant_warnings(tenant_id);
create index if not exists idx_tenant_comments_property_id on public.tenant_comments(property_id);
create index if not exists idx_house_nearby_places_property on public.house_nearby_places(property_id);

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_employee()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role_id in ('SUPER_ADMIN','ADMIN','LANDLORD','PROPERTY_MANAGER','CARETAKER','ACCOUNTANT','MAINTENANCE_STAFF','SUPPORT_STAFF','IT_SUPPORT')
  )
$$;

create or replace function public.is_tenant()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.tenants t
    where t.user_id = auth.uid()
  )
$$;

create or replace function public.can_access_house(house_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = house_id
      and (
        p.listing_status = 'PUBLISHED'
        or public.is_admin()
        or p.caretaker_id = auth.uid()
      )
  )
$$;

create or replace function public.create_tenant_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.tenants(user_id, status)
  values (p_user_id, 'PROSPECT')
  on conflict (user_id) do update set updated_at = now()
  returning id into v_tenant_id;

  update public.profiles
  set full_name = coalesce(p_full_name, full_name),
      phone_number = coalesce(p_phone, phone_number),
      role_id = coalesce(role_id, 'TENANT')
  where user_id = p_user_id;

  insert into public.tenant_contacts(tenant_id, phone_number)
  values (v_tenant_id, p_phone)
  on conflict (tenant_id) do update
  set phone_number = excluded.phone_number,
      updated_at = now();

  return v_tenant_id;
end;
$$;

create or replace function public.update_tenant_profile(
  p_full_name text,
  p_phone text,
  p_emergency_contact_name text,
  p_emergency_contact_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id
  from public.tenants
  where user_id = auth.uid();

  if v_tenant_id is null then
    raise exception 'tenant profile not found';
  end if;

  update public.profiles
  set full_name = coalesce(p_full_name, full_name),
      phone_number = coalesce(p_phone, phone_number),
      updated_at = now()
  where user_id = auth.uid();

  insert into public.tenant_contacts(
    tenant_id,
    phone_number,
    emergency_contact_name,
    emergency_contact_phone
  )
  values (
    v_tenant_id,
    p_phone,
    p_emergency_contact_name,
    p_emergency_contact_phone
  )
  on conflict (tenant_id) do update
  set phone_number = excluded.phone_number,
      emergency_contact_name = excluded.emergency_contact_name,
      emergency_contact_phone = excluded.emergency_contact_phone,
      updated_at = now();

  return jsonb_build_object('tenant_id', v_tenant_id, 'updated', true);
end;
$$;

create or replace function public.create_maintenance_request(
  p_property_id uuid,
  p_unit_id uuid,
  p_title text,
  p_description text,
  p_priority public.maintenance_priority default 'MEDIUM'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_request_id uuid;
begin
  select id into v_tenant_id from public.tenants where user_id = auth.uid();
  if v_tenant_id is null then
    raise exception 'only tenant can create maintenance request';
  end if;

  insert into public.maintenance_requests(
    title, description, status, tenant_id, unit_id, property_id, priority, scheduled_date
  )
  values (
    trim(p_title), trim(p_description), 'SCHEDULED', v_tenant_id, p_unit_id, p_property_id, p_priority, now()
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.assign_maintenance_request(
  p_request_id uuid,
  p_assigned_to uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.has_role('CARETAKER')) then
    raise exception 'forbidden';
  end if;

  update public.maintenance_requests
  set assigned_to_id = p_assigned_to,
      updated_at = now()
  where id = p_request_id;

  insert into public.maintenance_request_updates(
    maintenance_request_id, updated_by, old_status, new_status, note
  )
  select p_request_id, auth.uid(), null, status, coalesce(p_note, 'assigned')
  from public.maintenance_requests where id = p_request_id;

  return jsonb_build_object('ok', true, 'request_id', p_request_id);
end;
$$;

create or replace function public.update_maintenance_status(
  p_request_id uuid,
  p_status public.maintenance_status,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.maintenance_status;
begin
  if not (public.is_admin() or public.has_role('CARETAKER') or public.has_role('MAINTENANCE_STAFF')) then
    raise exception 'forbidden';
  end if;

  select status into v_old from public.maintenance_requests where id = p_request_id;

  update public.maintenance_requests
  set status = p_status,
      updated_at = now()
  where id = p_request_id;

  insert into public.maintenance_request_updates(
    maintenance_request_id, updated_by, old_status, new_status, note
  )
  values (p_request_id, auth.uid(), v_old, p_status, p_note);

  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

create or replace function public.create_announcement(
  p_title text,
  p_content text,
  p_target_role text,
  p_property_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.is_admin() or public.has_role('CARETAKER')) then
    raise exception 'forbidden';
  end if;

  insert into public.announcements(title, content, target_role, author_id, property_id)
  values (trim(p_title), trim(p_content), p_target_role, auth.uid(), p_property_id)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.mark_announcement_read(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.announcement_reads(announcement_id, user_id)
  values (p_announcement_id, auth.uid())
  on conflict (announcement_id, user_id) do nothing;
end;
$$;

create or replace function public.create_tenant_warning(
  p_tenant_id uuid,
  p_title text,
  p_details text,
  p_severity public.warning_severity default 'WARNING'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_property_id uuid;
begin
  if not (public.is_admin() or public.has_role('CARETAKER')) then
    raise exception 'forbidden';
  end if;

  select u.property_id into v_property_id
  from public.tenant_unit_assignments tua
  join public.units u on u.id = tua.unit_id
  where tua.tenant_id = p_tenant_id
  order by tua.created_at desc
  limit 1;

  insert into public.tenant_warnings(tenant_id, property_id, issued_by, severity, title, details)
  values (p_tenant_id, v_property_id, auth.uid(), p_severity, p_title, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.accept_house_terms(
  p_property_id uuid,
  p_terms_version text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_id uuid;
begin
  select id into v_tenant_id from public.tenants where user_id = auth.uid();
  if v_tenant_id is null then
    raise exception 'tenant not found';
  end if;

  insert into public.tenant_terms_acceptance(tenant_id, property_id, terms_version)
  values (v_tenant_id, p_property_id, p_terms_version)
  on conflict (tenant_id, property_id, terms_version) do update
  set accepted_at = now(),
      updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.assign_tenant_to_unit(
  p_tenant_id uuid,
  p_unit_id uuid,
  p_lease_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.is_admin() or public.has_role('CARETAKER')) then
    raise exception 'forbidden';
  end if;

  insert into public.tenant_unit_assignments(tenant_id, unit_id, lease_id, is_primary)
  values (p_tenant_id, p_unit_id, p_lease_id, true)
  returning id into v_id;

  update public.units set status = 'TAKEN', updated_at = now() where id = p_unit_id;

  return v_id;
end;
$$;

create or replace function public.set_unit_vacancy_status(
  p_unit_id uuid,
  p_status public.unit_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.has_role('CARETAKER')) then
    raise exception 'forbidden';
  end if;

  update public.units
  set status = p_status, updated_at = now()
  where id = p_unit_id;

  insert into public.unit_availability_snapshots(unit_id, status, reason)
  values (p_unit_id, p_status, p_reason);
end;
$$;

create or replace function public.create_house_listing(
  p_name text,
  p_location text,
  p_description text,
  p_logo_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.is_admin() or public.has_role('CARETAKER') or public.has_role('PROPERTY_MANAGER')) then
    raise exception 'forbidden';
  end if;

  insert into public.properties(name, location, description, logo_url, caretaker_id, listing_status)
  values (trim(p_name), trim(p_location), p_description, p_logo_url, auth.uid(), 'PUBLISHED')
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.update_house_listing(
  p_property_id uuid,
  p_name text default null,
  p_location text default null,
  p_description text default null,
  p_logo_url text default null,
  p_listing_status public.listing_status default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.can_manage_property(p_property_id)) then
    raise exception 'forbidden';
  end if;

  update public.properties
  set name = coalesce(p_name, name),
      location = coalesce(p_location, location),
      description = coalesce(p_description, description),
      logo_url = coalesce(p_logo_url, logo_url),
      listing_status = coalesce(p_listing_status, listing_status),
      updated_at = now()
  where id = p_property_id;
end;
$$;

create or replace function public.get_house_listing_details(p_house_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'property', to_jsonb(p),
    'units', coalesce((select jsonb_agg(to_jsonb(u)) from public.units u where u.property_id = p.id), '[]'::jsonb),
    'photos', coalesce((select jsonb_agg(to_jsonb(hp) order by hp.sort_order) from public.house_photos hp where hp.property_id = p.id), '[]'::jsonb),
    'faqs', coalesce((select jsonb_agg(to_jsonb(f) order by f.sort_order) from public.property_faqs f where f.property_id = p.id and f.is_active), '[]'::jsonb),
    'rules', coalesce((select jsonb_agg(to_jsonb(r) order by r.sort_order) from public.property_rules r where r.property_id = p.id and r.is_active), '[]'::jsonb),
    'terms', coalesce((select jsonb_agg(to_jsonb(t)) from public.property_terms t where t.property_id = p.id and t.is_active), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(to_jsonb(c)) from public.tenant_comments c where c.property_id = p.id and c.is_public), '[]'::jsonb),
    'map_location', (select to_jsonb(ml) from public.house_map_locations ml where ml.property_id = p.id)
  )
  from public.properties p
  where p.id = p_house_id
$$;

create or replace function public.search_house_listings(
  p_location text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_room_type text default null,
  p_only_vacant boolean default true,
  p_sort text default 'price_asc'
)
returns table (
  unit_id uuid,
  property_id uuid,
  property_name text,
  location text,
  room_type text,
  base_price numeric,
  unit_status public.unit_status,
  listing_status public.listing_status
)
language plpgsql
stable
as $$
begin
  return query
  select
    u.id,
    p.id,
    p.name,
    p.location,
    coalesce(u.room_type, u.type) as room_type,
    u.base_price,
    u.status,
    p.listing_status
  from public.units u
  join public.properties p on p.id = u.property_id
  where p.listing_status = 'PUBLISHED'
    and (p_location is null or p.location ilike '%' || p_location || '%')
    and (p_min_price is null or u.base_price >= p_min_price)
    and (p_max_price is null or u.base_price <= p_max_price)
    and (p_room_type is null or coalesce(u.room_type, u.type) = p_room_type)
    and (not p_only_vacant or u.status = 'VACANT')
  order by
    case when p_sort = 'price_desc' then u.base_price end desc,
    case when p_sort <> 'price_desc' then u.base_price end asc;
end;
$$;

create or replace function public.log_audit_event(
  p_action text,
  p_resource text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs(user_id, action, resource, metadata)
  values (auth.uid(), p_action, p_resource, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.notify_on_announcement_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(user_id, title, message, type)
  select p.user_id, 'New announcement', new.title, 'INFO'
  from public.profiles p
  where new.target_role is null or new.target_role = 'PUBLIC' or p.role_id = new.target_role;
  return new;
end;
$$;

create or replace function public.notify_on_warning_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select t.user_id into v_user_id from public.tenants t where t.id = new.tenant_id;
  if v_user_id is not null then
    insert into public.notifications(user_id, title, message, type)
    values (v_user_id, new.title, coalesce(new.details, ''), 'WARNING');
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_maintenance_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if old.status is distinct from new.status and new.tenant_id is not null then
    select t.user_id into v_user_id from public.tenants t where t.id = new.tenant_id;
    if v_user_id is not null then
      insert into public.notifications(user_id, title, message, type)
      values (
        v_user_id,
        'Maintenance update',
        coalesce(new.title, 'Request') || ' is now ' || new.status::text,
        'INFO'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_announcement_insert on public.announcements;
create trigger trg_notify_announcement_insert
after insert on public.announcements
for each row execute function public.notify_on_announcement_insert();

drop trigger if exists trg_notify_warning_insert on public.tenant_warnings;
create trigger trg_notify_warning_insert
after insert on public.tenant_warnings
for each row execute function public.notify_on_warning_insert();

drop trigger if exists trg_notify_maintenance_status on public.maintenance_requests;
create trigger trg_notify_maintenance_status
after update on public.maintenance_requests
for each row execute function public.notify_on_maintenance_status_change();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists set_employee_property_assignments_updated_at on public.employee_property_assignments;
create trigger set_employee_property_assignments_updated_at before update on public.employee_property_assignments for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_contacts_updated_at on public.tenant_contacts;
create trigger set_tenant_contacts_updated_at before update on public.tenant_contacts for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_preferences_updated_at on public.tenant_preferences;
create trigger set_tenant_preferences_updated_at before update on public.tenant_preferences for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_unit_assignments_updated_at on public.tenant_unit_assignments;
create trigger set_tenant_unit_assignments_updated_at before update on public.tenant_unit_assignments for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_lease_documents_updated_at on public.tenant_lease_documents;
create trigger set_tenant_lease_documents_updated_at before update on public.tenant_lease_documents for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_terms_acceptance_updated_at on public.tenant_terms_acceptance;
create trigger set_tenant_terms_acceptance_updated_at before update on public.tenant_terms_acceptance for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_warnings_updated_at on public.tenant_warnings;
create trigger set_tenant_warnings_updated_at before update on public.tenant_warnings for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_comments_updated_at on public.tenant_comments;
create trigger set_tenant_comments_updated_at before update on public.tenant_comments for each row execute function public.set_updated_at();
drop trigger if exists set_property_faqs_updated_at on public.property_faqs;
create trigger set_property_faqs_updated_at before update on public.property_faqs for each row execute function public.set_updated_at();
drop trigger if exists set_property_rules_updated_at on public.property_rules;
create trigger set_property_rules_updated_at before update on public.property_rules for each row execute function public.set_updated_at();
drop trigger if exists set_property_terms_updated_at on public.property_terms;
create trigger set_property_terms_updated_at before update on public.property_terms for each row execute function public.set_updated_at();
drop trigger if exists set_house_photos_updated_at on public.house_photos;
create trigger set_house_photos_updated_at before update on public.house_photos for each row execute function public.set_updated_at();
drop trigger if exists set_house_amenities_updated_at on public.house_amenities;
create trigger set_house_amenities_updated_at before update on public.house_amenities for each row execute function public.set_updated_at();
drop trigger if exists set_house_nearby_places_updated_at on public.house_nearby_places;
create trigger set_house_nearby_places_updated_at before update on public.house_nearby_places for each row execute function public.set_updated_at();
drop trigger if exists set_house_map_locations_updated_at on public.house_map_locations;
create trigger set_house_map_locations_updated_at before update on public.house_map_locations for each row execute function public.set_updated_at();
drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();
drop trigger if exists set_files_updated_at on public.files;
create trigger set_files_updated_at before update on public.files for each row execute function public.set_updated_at();
drop trigger if exists set_system_events_updated_at on public.system_events;
create trigger set_system_events_updated_at before update on public.system_events for each row execute function public.set_updated_at();
drop trigger if exists set_maintenance_requests_updated_at on public.maintenance_requests;
create trigger set_maintenance_requests_updated_at before update on public.maintenance_requests for each row execute function public.set_updated_at();
drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at before update on public.announcements for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
alter table public.employee_permissions enable row level security;
alter table public.employee_role_permissions enable row level security;
alter table public.employee_property_assignments enable row level security;
alter table public.tenant_contacts enable row level security;
alter table public.tenant_preferences enable row level security;
alter table public.tenant_unit_assignments enable row level security;
alter table public.tenant_lease_documents enable row level security;
alter table public.tenant_terms_acceptance enable row level security;
alter table public.tenant_warnings enable row level security;
alter table public.tenant_comments enable row level security;
alter table public.maintenance_request_updates enable row level security;
alter table public.property_faqs enable row level security;
alter table public.property_rules enable row level security;
alter table public.property_terms enable row level security;
alter table public.house_photos enable row level security;
alter table public.house_amenities enable row level security;
alter table public.house_nearby_places enable row level security;
alter table public.house_map_locations enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.app_settings enable row level security;
alter table public.files enable row level security;
alter table public.system_events enable row level security;

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees for select using (public.is_admin() or public.is_employee());
drop policy if exists employees_manage on public.employees;
create policy employees_manage on public.employees for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists tenant_contacts_self_or_staff on public.tenant_contacts;
create policy tenant_contacts_self_or_staff on public.tenant_contacts for all
using (
  public.is_admin()
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
  or public.has_role('CARETAKER')
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
  or public.has_role('CARETAKER')
);

drop policy if exists tenant_preferences_self on public.tenant_preferences;
create policy tenant_preferences_self on public.tenant_preferences for all
using (
  public.is_admin()
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
);

drop policy if exists tenant_terms_self_or_staff on public.tenant_terms_acceptance;
create policy tenant_terms_self_or_staff on public.tenant_terms_acceptance for all
using (
  public.is_admin()
  or public.has_role('CARETAKER')
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or public.has_role('CARETAKER')
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
);

drop policy if exists tenant_warnings_view on public.tenant_warnings;
create policy tenant_warnings_view on public.tenant_warnings for select
using (
  public.is_admin()
  or public.has_role('CARETAKER')
  or exists (
    select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid()
  )
);
drop policy if exists tenant_warnings_manage on public.tenant_warnings;
create policy tenant_warnings_manage on public.tenant_warnings for insert with check (public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists tenant_warnings_update on public.tenant_warnings;
create policy tenant_warnings_update on public.tenant_warnings for update using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists tenant_comments_public_read on public.tenant_comments;
create policy tenant_comments_public_read on public.tenant_comments for select
using (is_public or public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists tenant_comments_write on public.tenant_comments;
create policy tenant_comments_write on public.tenant_comments for insert
with check (public.is_admin() or public.is_tenant());

drop policy if exists maintenance_updates_read on public.maintenance_request_updates;
create policy maintenance_updates_read on public.maintenance_request_updates for select
using (
  public.is_admin()
  or public.has_role('CARETAKER')
  or exists (
    select 1
    from public.maintenance_requests mr
    join public.tenants t on t.id = mr.tenant_id
    where mr.id = maintenance_request_id and t.user_id = auth.uid()
  )
);

drop policy if exists property_faqs_public_read on public.property_faqs;
create policy property_faqs_public_read on public.property_faqs for select using (is_active);
drop policy if exists property_faqs_manage on public.property_faqs;
create policy property_faqs_manage on public.property_faqs for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists property_rules_public_read on public.property_rules;
create policy property_rules_public_read on public.property_rules for select using (is_active);
drop policy if exists property_rules_manage on public.property_rules;
create policy property_rules_manage on public.property_rules for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists property_terms_read on public.property_terms;
create policy property_terms_read on public.property_terms for select using (is_active or public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists property_terms_manage on public.property_terms;
create policy property_terms_manage on public.property_terms for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists house_photos_public_read on public.house_photos;
create policy house_photos_public_read on public.house_photos for select using (true);
drop policy if exists house_photos_manage on public.house_photos;
create policy house_photos_manage on public.house_photos for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists house_amenities_public_read on public.house_amenities;
create policy house_amenities_public_read on public.house_amenities for select using (true);
drop policy if exists house_amenities_manage on public.house_amenities;
create policy house_amenities_manage on public.house_amenities for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists house_nearby_places_public_read on public.house_nearby_places;
create policy house_nearby_places_public_read on public.house_nearby_places for select using (true);
drop policy if exists house_nearby_places_manage on public.house_nearby_places;
create policy house_nearby_places_manage on public.house_nearby_places for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists house_map_locations_public_read on public.house_map_locations;
create policy house_map_locations_public_read on public.house_map_locations for select using (true);
drop policy if exists house_map_locations_manage on public.house_map_locations;
create policy house_map_locations_manage on public.house_map_locations for all using (public.is_admin() or public.has_role('CARETAKER')) with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists announcement_reads_self on public.announcement_reads;
create policy announcement_reads_self on public.announcement_reads for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select
using (is_public or public.is_admin());
drop policy if exists app_settings_manage on public.app_settings;
create policy app_settings_manage on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists files_read on public.files;
create policy files_read on public.files for select using (public.is_admin() or uploaded_by = auth.uid());
drop policy if exists files_manage on public.files;
create policy files_manage on public.files for all using (public.is_admin() or uploaded_by = auth.uid()) with check (public.is_admin() or uploaded_by = auth.uid());

drop policy if exists system_events_read on public.system_events;
create policy system_events_read on public.system_events for select using (public.is_admin() or public.has_role('IT_SUPPORT'));
drop policy if exists system_events_insert on public.system_events;
create policy system_events_insert on public.system_events for insert with check (public.is_admin() or public.has_role('IT_SUPPORT'));

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'arena-expire-old-listings') then
    perform cron.schedule(
      'arena-expire-old-listings',
      '0 3 * * *',
      $cron_expire$update public.properties set listing_status = 'ARCHIVED', updated_at = now()
        where listing_status = 'PUBLISHED'
          and created_at < now() - interval '365 days';$cron_expire$
    );
  end if;

  if not exists (select 1 from cron.job where jobname = 'arena-lease-expiry-reminders') then
    perform cron.schedule(
      'arena-lease-expiry-reminders',
      '30 8 * * *',
      $cron_lease$insert into public.notifications(user_id, title, message, type)
        select t.user_id, 'Lease expiry reminder', 'Your lease expires within 30 days.', 'INFO'
        from public.leases l
        join public.tenants t on t.id = l.tenant_id
        where l.status = 'ACTIVE'
          and l.end_date between current_date and current_date + interval '30 days';$cron_lease$
    );
  end if;

  if not exists (select 1 from cron.job where jobname = 'arena-maintenance-escalation') then
    perform cron.schedule(
      'arena-maintenance-escalation',
      '0 * * * *',
      $cron_escalate$insert into public.system_events(event_type, payload)
        select 'MAINTENANCE_ESCALATION',
               jsonb_build_object('request_id', id, 'status', status, 'updated_at', updated_at)
        from public.maintenance_requests
        where status = 'SCHEDULED'
          and updated_at < now() - interval '72 hours';$cron_escalate$
    );
  end if;
end $$;
