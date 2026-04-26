-- Listings page enhancements migration
-- Adds property likes, site contact settings, and unit vacancy tracking

create extension if not exists pgcrypto;

-- 1. Property likes table
 create table if not exists public.property_likes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  created_at timestamptz not null default now(),
  unique(property_id, user_id),
  unique(property_id, visitor_id)
);

-- 2. Add more contact fields to site_settings
alter table public.site_settings 
  add column if not exists whatsapp_number text,
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists twitter_url text,
  add column if not exists youtube_url text,
  add column if not exists tiktok_url text,
  add column if not exists telegram_url text,
  add column if not exists office_address text,
  add column if not exists business_hours text,
  add column if not exists enable_social_sharing boolean not null default true;

-- 3. Add room tracking to units
alter table public.units
  add column if not exists total_rooms integer not null default 1,
  add column if not exists occupied_rooms integer not null default 0,
  add column if not exists max_occupancy integer not null default 1,
  add column if not exists likes_count integer not null default 0;

-- Function to update likes count
 create or replace function public.update_property_likes_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.units set likes_count = likes_count + 1 where id = new.property_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.units set likes_count = likes_count - 1 where id = old.property_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists property_likes_count_trigger on public.property_likes;
create trigger property_likes_count_trigger
  after insert or delete on public.property_likes
  for each row execute function public.update_property_likes_count();

-- Function to get available rooms for a unit
 create or replace function public.get_unit_available_rooms(p_unit_id uuid)
returns integer
language plpgsql
as $$
declare
  v_total integer;
  v_occupied integer;
  v_active_leases integer;
begin
  -- Get total and occupied from units table
  select total_rooms, occupied_rooms
  into v_total, v_occupied
  from public.units
  where id = p_unit_id;
  
  -- Also count active leases for this unit
  select count(*)
  into v_active_leases
  from public.leases
  where unit_id = p_unit_id
    and status = 'ACTIVE';
  
  -- Return the minimum of (total - occupied) and (total - active_leases)
  return greatest(0, least(
    coalesce(v_total, 0) - coalesce(v_occupied, 0),
    coalesce(v_total, 0) - coalesce(v_active_leases, 0)
  ));
end;
$$;

-- Update public_listings view to include available rooms and likes
 create or replace view public.public_listings as
select 
  u.id as unit_id,
  p.id as property_id,
  u.type as unit_type,
  u.description as unit_description,
  u.base_price as rent_amount,
  null::numeric as deposit_amount,
  case 
    when public.get_unit_available_rooms(u.id) > 0 then 'AVAILABLE'::text
    else 'OCCUPIED'::text
  end as availability_status,
  null::jsonb as unit_amenities,
  null::text[] as unit_photos,
  u.updated_at as last_updated,
  p.name as property_name,
  p.location as property_location,
  p.latitude as property_latitude,
  p.longitude as property_longitude,
  (p.facilities->>'gateLatitude')::numeric as gate_latitude,
  (p.facilities->>'gateLongitude')::numeric as gate_longitude,
  (p.facilities->>'schoolGateDistance')::numeric as school_gate_distance_meters,
  p.facilities->>'landmark' as landmark,
  'VERIFIED'::text as property_verification_status,
  p.logo_url as property_logo,
  (p.facilities->>'walkingTimeMinutes')::integer as walking_time_minutes,
  p.logo_url as primary_photo_url,
  public.get_unit_available_rooms(u.id) as available_rooms,
  u.total_rooms,
  u.likes_count,
  u.max_occupancy
from public.units u
join public.properties p on u.property_id = p.id
where public.get_unit_available_rooms(u.id) > 0;

-- RLS policies
 alter table public.property_likes enable row level security;

drop policy if exists property_likes_public_insert on public.property_likes;
create policy property_likes_public_insert on public.property_likes
  for insert with check (true);

drop policy if exists property_likes_public_delete on public.property_likes;
create policy property_likes_public_delete on public.property_likes
  for delete using (true);

drop policy if exists property_likes_public_read on public.property_likes;
create policy property_likes_public_read on public.property_likes
  for select using (true);

-- Grant permissions
 grant select on public.public_listings to anon, authenticated;
grant select, insert, delete on public.property_likes to anon, authenticated;
grant execute on function public.get_unit_available_rooms(uuid) to anon, authenticated;
