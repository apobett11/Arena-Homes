-- Relationship integrity migration for tenant ↔ property ↔ caretaker two-way links
-- Adds missing columns, indexes, and foreign keys for proper data relationships

-- Add missing columns to properties table for explicit caretaker relationships
alter table public.properties 
add column if not exists caretaker_employee_id uuid references public.employees(id),
add column if not exists caretaker_user_id uuid references auth.users(id);

-- Add missing columns to employees table for two-way property relationship  
alter table public.employees
add column if not exists assigned_property_id uuid references public.properties(id);

-- Add missing columns to tenants table for complete relationship tracking
alter table public.tenants
add column if not exists property_id uuid references public.properties(id),
add column if not exists caretaker_user_id uuid references auth.users(id),
add column if not exists caretaker_employee_id uuid references public.employees(id),
add column if not exists unit_id uuid references public.units(id),
add column if not exists room_number text;

-- Add missing columns to units table for better room identification
alter table public.units
add column if not exists room_number text;

-- Create indexes for performance and relationship queries
create index if not exists idx_properties_caretaker_employee_id on public.properties(caretaker_employee_id);
create index if not exists idx_properties_caretaker_user_id on public.properties(caretaker_user_id);
create index if not exists idx_employees_assigned_property_id on public.employees(assigned_property_id);
create index if not exists idx_tenants_property_id on public.tenants(property_id);
create index if not exists idx_tenants_unit_id on public.tenants(unit_id);
create index if not exists idx_tenants_caretaker_employee_id on public.tenants(caretaker_employee_id);
create index if not exists idx_tenants_caretaker_user_id on public.tenants(caretaker_user_id);
create index if not exists idx_units_room_number on public.units(room_number);
create index if not exists idx_units_availability_status on public.units(availability_status);

-- Update existing data to establish relationships based on current caretaker_id
update public.properties 
set 
    caretaker_user_id = caretaker_id,
    caretaker_employee_id = (
        select e.id 
        from public.employees e 
        where e.user_id = public.properties.caretaker_id 
        and e.role_id = 'CARETAKER'
        limit 1
    )
where caretaker_id is not null;

-- Update employees to have assigned_property_id based on property relationships
update public.employees 
set assigned_property_id = (
    select p.id 
    from public.properties p 
    where p.caretaker_employee_id = public.employees.id 
    limit 1
)
where role_id = 'CARETAKER' 
and assigned_property_id is null;

-- Update tenants to have property_id and caretaker relationships based on leases
update public.tenants 
set 
    property_id = (
        select u.property_id 
        from public.leases l 
        join public.units u on u.id = l.unit_id 
        where l.tenant_id = public.tenants.id 
        and l.status = 'ACTIVE'
        order by l.created_at desc 
        limit 1
    ),
    unit_id = (
        select l.unit_id 
        from public.leases l 
        where l.tenant_id = public.tenants.id 
        and l.status = 'ACTIVE'
        order by l.created_at desc 
        limit 1
    ),
    caretaker_user_id = (
        select p.caretaker_user_id 
        from public.properties p 
        join public.leases l on l.unit_id in (
            select u.id from public.units u where u.property_id = p.id
        )
        where l.tenant_id = public.tenants.id 
        and l.status = 'ACTIVE'
        order by l.created_at desc 
        limit 1
    ),
    caretaker_employee_id = (
        select p.caretaker_employee_id 
        from public.properties p 
        join public.leases l on l.unit_id in (
            select u.id from public.units u where u.property_id = p.id
        )
        where l.tenant_id = public.tenants.id 
        and l.status = 'ACTIVE'
        order by l.created_at desc 
        limit 1
    )
where exists (
    select 1 from public.leases l 
    where l.tenant_id = public.tenants.id 
    and l.status = 'ACTIVE'
);

-- Update units to have room_number from type if missing
update public.units 
set room_number = type 
where room_number is null 
and type is not null;


-- Enhanced RLS policies for tenant relationship access
drop policy if exists "tenant_self_or_staff_select" on public.tenants;
create policy "tenant_self_or_staff_select" on public.tenants for select
using (
    user_id = auth.uid() 
    or public.is_admin() 
    or public.has_role('CARETAKER')
    or (
        public.has_role('CARETAKER') and 
        exists (
            select 1 from public.properties p 
            where p.id = property_id 
            and p.caretaker_user_id = auth.uid()
        )
    )
);

-- Enhanced property access for tenants
drop policy if exists "property_select" on public.properties;
create policy "property_select" on public.properties for select using (
    true or public.is_admin() or caretaker_id = auth.uid() or caretaker_user_id = auth.uid()
    or exists (
        select 1 from public.tenants t 
        where t.property_id = id 
        and t.user_id = auth.uid()
    )
);

-- Enhanced unit access for tenants
drop policy if exists "unit_select" on public.units;
create policy "unit_select" on public.units for select using (
    public.can_access_property(property_id) or true
    or exists (
        select 1 from public.tenants t 
        where t.unit_id = id 
        and t.user_id = auth.uid()
    )
);

-- Enable RLS on employees table and add policy
alter table public.employees enable row level security;
drop policy if exists "employees_select" on public.employees;
create policy "employees_select" on public.employees for select using (
    public.is_admin() or user_id = auth.uid()
    or exists (
        select 1 from public.tenants t 
        where t.caretaker_employee_id = id 
        and t.user_id = auth.uid()
    )
    or exists (
        select 1 from public.properties p 
        where p.caretaker_employee_id = id 
        and exists (
            select 1 from public.tenants t 
            where t.property_id = p.id 
            and t.user_id = auth.uid()
        )
    )
);

-- Helper function to get tenant's complete relationship data
create or replace function public.get_tenant_relationship_data(p_user_id uuid default auth.uid())
returns table (
    tenant_id uuid,
    property_id uuid,
    unit_id uuid,
    room_number text,
    caretaker_user_id uuid,
    caretaker_employee_id uuid,
    caretaker_name text,
    caretaker_phone text,
    caretaker_email text,
    property_name text,
    property_location text,
    lease_id uuid,
    lease_status text,
    lease_start_date date,
    lease_end_date date
)
language sql
stable
security definer
as $$
    select 
        t.id as tenant_id,
        t.property_id,
        t.unit_id,
        t.room_number,
        t.caretaker_user_id,
        t.caretaker_employee_id,
        coalesce(e.full_name, p.full_name) as caretaker_name,
        coalesce(e.phone_number, p.phone_number) as caretaker_phone,
        coalesce(e.email, p.email) as caretaker_email,
        prop.name as property_name,
        prop.location as property_location,
        l.id as lease_id,
        l.status as lease_status,
        l.start_date as lease_start_date,
        l.end_date as lease_end_date
    from public.tenants t
    left join public.profiles p on p.user_id = t.caretaker_user_id
    left join public.employees e on e.id = t.caretaker_employee_id
    left join public.properties prop on prop.id = t.property_id
    left join public.leases l on l.tenant_id = t.id and l.status = 'ACTIVE'
    where t.user_id = p_user_id
    limit 1;
$$;
