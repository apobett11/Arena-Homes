-- Arena Supabase architecture migration
-- Covers missing domain schema, auth profile sync, helper functions, RLS, and baseline policies.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'unit_status') then
    create type public.unit_status as enum ('VACANT', 'TAKEN');
  end if;
  if not exists (select 1 from pg_type where typname = 'tenant_status') then
    create type public.tenant_status as enum ('PROSPECT', 'ACTIVE', 'PAST', 'EVICTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'lease_status') then
    create type public.lease_status as enum ('PENDING', 'ACTIVE', 'COMPLETED', 'TERMINATED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('PENDING', 'SUCCESS', 'FAILED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_gateway') then
    create type public.payment_gateway as enum ('MPESA', 'STRIPE', 'CASH', 'BANK_TRANSFER');
  end if;
  if not exists (select 1 from pg_type where typname = 'ledger_account_type') then
    create type public.ledger_account_type as enum ('TENANT', 'PROPERTY', 'PLATFORM', 'EXTERNAL');
  end if;
  if not exists (select 1 from pg_type where typname = 'ledger_entry_direction') then
    create type public.ledger_entry_direction as enum ('DEBIT', 'CREDIT');
  end if;
  if not exists (select 1 from pg_type where typname = 'budget_status') then
    create type public.budget_status as enum ('DRAFT', 'ACTIVE', 'CLOSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'snapshot_status') then
    create type public.snapshot_status as enum ('DRAFT', 'FINALIZED');
  end if;
  if not exists (select 1 from pg_type where typname = 'issue_status') then
    create type public.issue_status as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'issue_priority') then
    create type public.issue_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  end if;
  if not exists (select 1 from pg_type where typname = 'maintenance_status') then
    create type public.maintenance_status as enum ('SCHEDULED', 'COMPLETED', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('INFO', 'WARNING', 'ALERT', 'SUCCESS');
  end if;
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id text references public.roles(id),
  email text,
  full_name text,
  phone_number text,
  assigned_property_id uuid,
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  caretaker_id uuid references auth.users(id),
  logo_url text,
  facilities jsonb,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  type text not null,
  description text,
  base_price numeric(10,2) not null,
  status public.unit_status not null default 'VACANT',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.unit_availability_snapshots (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id),
  status public.unit_status not null,
  snapshot_date timestamp not null default now(),
  reason text
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  status public.tenant_status not null default 'PROSPECT',
  total_months_paid integer default 0,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  unit_id uuid not null references public.units(id),
  start_date date not null,
  end_date date not null,
  status public.lease_status not null default 'PENDING',
  pdf_url text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.lease_history (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases(id),
  change_type text not null,
  previous_status text,
  new_status text,
  changed_at timestamp not null default now(),
  reason text
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  lease_id uuid,
  amount numeric(12,2) not null,
  currency text not null default 'KES',
  status public.payment_status not null default 'PENDING',
  gateway public.payment_gateway not null,
  gateway_transaction_id text,
  description text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  reference_id text,
  reference_type text,
  posted_at timestamp not null default now(),
  metadata text
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id),
  account_id uuid not null,
  account_type public.ledger_account_type not null,
  amount numeric(12,2) not null,
  direction public.ledger_entry_direction not null,
  created_at timestamp not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period_start timestamp not null,
  period_end timestamp not null,
  total_amount numeric(12,2) not null,
  status public.budget_status not null default 'DRAFT',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id),
  category text not null,
  allocated_amount numeric(12,2) not null,
  version integer not null default 1,
  created_at timestamp not null default now()
);

create table if not exists public.financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  month integer not null,
  year integer not null,
  property_id uuid references public.properties(id),
  total_income numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  net_profit numeric(12,2) not null default 0,
  discrepancy_amount numeric(12,2) default 0,
  status public.snapshot_status not null default 'DRAFT',
  pdf_url text,
  generated_at timestamp not null default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id),
  unit_id uuid references public.units(id),
  type text not null,
  title text not null,
  description text,
  status public.issue_status not null default 'OPEN',
  priority public.issue_priority not null default 'LOW',
  assigned_to_id uuid references auth.users(id),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scheduled_date timestamp not null,
  status public.maintenance_status not null default 'SCHEDULED',
  assigned_to_id uuid references auth.users(id),
  created_at timestamp not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid not null references auth.users(id),
  target_role text,
  is_active boolean not null default true,
  created_at timestamp not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  message text not null,
  type public.notification_type not null default 'INFO',
  is_read boolean not null default false,
  link_url text,
  created_at timestamp not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  "order" integer default 0,
  created_at timestamp not null default now()
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text,
  created_at timestamp not null default now()
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  type text default 'DIRECT',
  created_at timestamp not null default now()
);

create table if not exists public.chat_participants (
  thread_id uuid not null references public.chat_threads(id),
  user_id uuid not null references auth.users(id),
  joined_at timestamp not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id),
  sender_id uuid not null references auth.users(id),
  content text not null,
  is_read boolean default false,
  created_at timestamp not null default now()
);

create table if not exists public.tenant_applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  caretaker_id uuid not null references auth.users(id),
  full_name text not null,
  email text not null,
  phone_number text not null,
  whatsapp_number text,
  university_reg_no text,
  preferred_move_in_date timestamp,
  message text,
  status public.application_status not null default 'PENDING',
  caretaker_notes text,
  responded_at timestamp,
  user_id uuid references auth.users(id),
  has_set_password boolean default false,
  has_completed_profile boolean default false,
  has_accepted_agreement boolean default false,
  temp_password text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_profiles_role_id on public.profiles(role_id);
create index if not exists idx_properties_caretaker on public.properties(caretaker_id);
create index if not exists idx_units_property_id on public.units(property_id);
create index if not exists idx_tenants_user_id on public.tenants(user_id);
create index if not exists idx_leases_tenant_id on public.leases(tenant_id);
create index if not exists idx_leases_unit_id on public.leases(unit_id);
create index if not exists idx_payments_tenant_id on public.payments(tenant_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_ledger_entries_tx_id on public.ledger_entries(transaction_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_applications_email on public.tenant_applications(email);
create index if not exists idx_chat_messages_thread_id on public.chat_messages(thread_id);

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role_id = role_name
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.has_role('SUPER_ADMIN') or public.has_role('ADMIN')
$$;

create or replace function public.can_access_property(target_property_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.properties p
      where p.id = target_property_id
        and p.caretaker_id = auth.uid()
    )
$$;

create or replace function public.can_manage_property(target_property_id uuid)
returns boolean
language sql
stable
as $$
  select public.can_access_property(target_property_id)
$$;

create or replace function public.can_access_unit(target_unit_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.units u
    where u.id = target_unit_id
      and public.can_access_property(u.property_id)
  )
  or exists (
    select 1
    from public.leases l
    join public.tenants t on t.id = l.tenant_id
    where l.unit_id = target_unit_id
      and t.user_id = auth.uid()
  )
$$;

create or replace function public.can_access_lease(target_lease_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.leases l
      join public.tenants t on t.id = l.tenant_id
      where l.id = target_lease_id
        and t.user_id = auth.uid()
    )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
drop trigger if exists set_units_updated_at on public.units;
create trigger set_units_updated_at before update on public.units for each row execute function public.set_updated_at();
drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();
drop trigger if exists set_leases_updated_at on public.leases;
create trigger set_leases_updated_at before update on public.leases for each row execute function public.set_updated_at();
drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
drop trigger if exists set_issues_updated_at on public.issues;
create trigger set_issues_updated_at before update on public.issues for each row execute function public.set_updated_at();
drop trigger if exists set_tenant_applications_updated_at on public.tenant_applications;
create trigger set_tenant_applications_updated_at before update on public.tenant_applications for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.unit_availability_snapshots enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.lease_history enable row level security;
alter table public.payments enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.financial_snapshots enable row level security;
alter table public.issues enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.faqs enable row level security;
alter table public.rules enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tenant_applications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select
using (user_id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles for update
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "property_select" on public.properties;
create policy "property_select" on public.properties for select using (true);
drop policy if exists "property_manage" on public.properties;
create policy "property_manage" on public.properties for all
using (public.is_admin() or caretaker_id = auth.uid())
with check (public.is_admin() or caretaker_id = auth.uid());

drop policy if exists "unit_select" on public.units;
create policy "unit_select" on public.units for select using (public.can_access_property(property_id) or true);
drop policy if exists "unit_manage" on public.units;
create policy "unit_manage" on public.units for all
using (public.can_manage_property(property_id))
with check (public.can_manage_property(property_id));

drop policy if exists "tenant_self_or_staff_select" on public.tenants;
create policy "tenant_self_or_staff_select" on public.tenants for select
using (user_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists "tenant_staff_manage" on public.tenants;
create policy "tenant_staff_manage" on public.tenants for all
using (public.is_admin() or public.has_role('CARETAKER'))
with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists "leases_access_policy" on public.leases;
create policy "leases_access_policy" on public.leases for select
using (public.can_access_lease(id) or public.has_role('CARETAKER'));
drop policy if exists "leases_manage_policy" on public.leases;
create policy "leases_manage_policy" on public.leases for all
using (public.is_admin() or public.has_role('CARETAKER'))
with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists "payments_access_policy" on public.payments;
create policy "payments_access_policy" on public.payments for select
using (
  public.is_admin()
  or public.has_role('ACCOUNTANT')
  or exists (
    select 1 from public.tenants t
    where t.id = tenant_id and t.user_id = auth.uid()
  )
);
drop policy if exists "payments_insert_policy" on public.payments;
create policy "payments_insert_policy" on public.payments for insert
with check (
  public.is_admin()
  or public.has_role('ACCOUNTANT')
  or exists (
    select 1 from public.tenants t
    where t.id = tenant_id and t.user_id = auth.uid()
  )
);
drop policy if exists "payments_update_policy" on public.payments;
create policy "payments_update_policy" on public.payments for update
using (public.is_admin() or public.has_role('ACCOUNTANT'))
with check (public.is_admin() or public.has_role('ACCOUNTANT'));

drop policy if exists "ledger_read_finance" on public.ledger_transactions;
create policy "ledger_read_finance" on public.ledger_transactions for select using (public.is_admin() or public.has_role('ACCOUNTANT'));
drop policy if exists "ledger_entries_read_finance" on public.ledger_entries;
create policy "ledger_entries_read_finance" on public.ledger_entries for select using (public.is_admin() or public.has_role('ACCOUNTANT'));

drop policy if exists "budget_finance_policy" on public.budgets;
create policy "budget_finance_policy" on public.budgets for all
using (public.is_admin() or public.has_role('ACCOUNTANT'))
with check (public.is_admin() or public.has_role('ACCOUNTANT'));
drop policy if exists "budget_alloc_finance_policy" on public.budget_allocations;
create policy "budget_alloc_finance_policy" on public.budget_allocations for all
using (public.is_admin() or public.has_role('ACCOUNTANT'))
with check (public.is_admin() or public.has_role('ACCOUNTANT'));

drop policy if exists "snapshot_finance_policy" on public.financial_snapshots;
create policy "snapshot_finance_policy" on public.financial_snapshots for all
using (public.is_admin() or public.has_role('ACCOUNTANT'))
with check (public.is_admin() or public.has_role('ACCOUNTANT'));

drop policy if exists "issues_select" on public.issues;
create policy "issues_select" on public.issues for select
using (reporter_id = auth.uid() or assigned_to_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists "issues_insert" on public.issues;
create policy "issues_insert" on public.issues for insert
with check (reporter_id = auth.uid() or public.is_admin() or public.has_role('CARETAKER'));
drop policy if exists "issues_update" on public.issues;
create policy "issues_update" on public.issues for update
using (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists "maintenance_policy" on public.maintenance_requests;
create policy "maintenance_policy" on public.maintenance_requests for all
using (public.is_admin() or public.has_role('CARETAKER'))
with check (public.is_admin() or public.has_role('CARETAKER'));

drop policy if exists "announcement_select_public" on public.announcements;
create policy "announcement_select_public" on public.announcements for select using (true);
drop policy if exists "announcement_manage_admin" on public.announcements;
create policy "announcement_manage_admin" on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notifications_user_rw" on public.notifications;
create policy "notifications_user_rw" on public.notifications for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "faq_select_public" on public.faqs;
create policy "faq_select_public" on public.faqs for select using (true);
drop policy if exists "faq_manage_admin" on public.faqs;
create policy "faq_manage_admin" on public.faqs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "rules_select_public" on public.rules;
create policy "rules_select_public" on public.rules for select using (true);
drop policy if exists "rules_manage_admin" on public.rules;
create policy "rules_manage_admin" on public.rules for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chat_thread_participant_select" on public.chat_threads;
create policy "chat_thread_participant_select" on public.chat_threads for select
using (exists (select 1 from public.chat_participants p where p.thread_id = id and p.user_id = auth.uid()));
drop policy if exists "chat_participant_rw" on public.chat_participants;
create policy "chat_participant_rw" on public.chat_participants for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "chat_message_select" on public.chat_messages;
create policy "chat_message_select" on public.chat_messages for select
using (exists (select 1 from public.chat_participants p where p.thread_id = thread_id and p.user_id = auth.uid()));
drop policy if exists "chat_message_insert" on public.chat_messages;
create policy "chat_message_insert" on public.chat_messages for insert
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.chat_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
);

drop policy if exists "applications_submit_public" on public.tenant_applications;
create policy "applications_submit_public" on public.tenant_applications for insert
with check (true);
drop policy if exists "applications_select_owner_or_staff" on public.tenant_applications;
create policy "applications_select_owner_or_staff" on public.tenant_applications for select
using (user_id = auth.uid() or caretaker_id = auth.uid() or public.is_admin());
drop policy if exists "applications_manage_staff" on public.tenant_applications;
create policy "applications_manage_staff" on public.tenant_applications for update
using (caretaker_id = auth.uid() or public.is_admin())
with check (caretaker_id = auth.uid() or public.is_admin());

drop policy if exists "audit_read_admin" on public.audit_logs;
create policy "audit_read_admin" on public.audit_logs for select
using (public.is_admin() or public.has_role('IT_SUPPORT'));

create or replace function public.confirm_payment(p_payment_id uuid, p_gateway_tx_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_amount numeric(12,2);
  v_tx_id uuid;
begin
  if not (public.is_admin() or public.has_role('ACCOUNTANT')) then
    raise exception 'forbidden';
  end if;

  update public.payments
  set status = 'SUCCESS', gateway_transaction_id = p_gateway_tx_id, updated_at = now()
  where id = p_payment_id
  returning tenant_id, amount into v_tenant_id, v_amount;

  if v_tenant_id is null then
    raise exception 'payment not found';
  end if;

  insert into public.ledger_transactions(description, reference_id, reference_type)
  values ('Payment confirmed', p_payment_id::text, 'PAYMENT')
  returning id into v_tx_id;

  insert into public.ledger_entries(transaction_id, account_id, account_type, amount, direction)
  values
    (v_tx_id, v_tenant_id, 'TENANT', v_amount, 'CREDIT'),
    (v_tx_id, v_tenant_id, 'PLATFORM', v_amount, 'DEBIT');

  return v_tx_id;
end;
$$;

create or replace function public.generate_financial_snapshot(p_month integer, p_year integer, p_property_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_income numeric(12,2);
  v_expenses numeric(12,2);
  v_snapshot_id uuid;
begin
  if not (public.is_admin() or public.has_role('ACCOUNTANT')) then
    raise exception 'forbidden';
  end if;

  select coalesce(sum(case when le.direction = 'CREDIT' then le.amount else 0 end), 0),
         coalesce(sum(case when le.direction = 'DEBIT' then le.amount else 0 end), 0)
  into v_income, v_expenses
  from public.ledger_entries le
  join public.ledger_transactions lt on lt.id = le.transaction_id
  where extract(month from lt.posted_at) = p_month
    and extract(year from lt.posted_at) = p_year;

  insert into public.financial_snapshots(month, year, property_id, total_income, total_expenses, net_profit, status)
  values (p_month, p_year, p_property_id, v_income, v_expenses, v_income - v_expenses, 'FINALIZED')
  returning id into v_snapshot_id;

  return v_snapshot_id;
end;
$$;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'arena-generate-monthly-snapshot') then
    perform cron.schedule(
      'arena-generate-monthly-snapshot',
      '0 2 1 * *',
      $cron$select public.generate_financial_snapshot(extract(month from now() - interval '1 month')::int, extract(year from now() - interval '1 month')::int, null);$cron$
    );
  end if;
end $$;



