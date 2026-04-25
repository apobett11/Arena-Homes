# Arena Frontend -> Supabase Deep Audit

This audit maps the current frontend behavior to required persistent backend architecture in Supabase PostgreSQL.

## Phase 1: Frontend Audit Table

| Frontend file | Component/page/function | What UI does | Data displayed | Data submitted | Current source | Required table(s) | Required RPC/function | Edge function | Cron job | Frontend API call | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `src/app/(public)/page.tsx` | Home page composition | Renders hero/listings/FAQ/rules/trust | Landing blocks and listing teaser | None directly | Mixed static + child components | `properties`, `units`, `property_faqs`, `property_rules`, `tenant_applications` | `search_house_listings` | None | None | Child components use `PropertyApi.getAll/getUnits` | Covered in `0004` |
| `src/components/Hero.tsx` | Hero search bar | Search by location/type/price sort | Input filters | URL query params | Client state | `properties`, `units` | `search_house_listings` | None | None | `supabase.rpc('search_house_listings', ...)` (recommended) | Covered in `0004` |
| `src/components/FeaturedListings.tsx` | Featured cards + application modal | Shows listing cards, apply form | House cards, badges | Tenant application fields | Dynamic with static fallback | `tenant_applications`, `properties`, `units`, `notifications` | `create_tenant_profile` (after approval), `log_audit_event` | `admin-invite-tenant` | application SLA reminder | `from('tenant_applications').insert(...)` | Partial existed; completed in `0004` |
| `src/app/listings/page.tsx` | Listings page | Filter/sort listing cards + PIN search | price, location, type, vacancy, count | invite PIN search | API + hardcoded filter options | `properties`, `units`, `house_map_locations` | `search_house_listings`, `can_access_house` | optional `process-pin-access` | expire old listings | `rpc('search_house_listings')` + PIN API | Covered in `0004` |
| `src/components/listings/FilterBar.tsx` | Filter UI | price/location/type/sort controls | Filter chips/ranges | filter state | client state only | no new table | no new rpc | none | none | used by listings | N/A |
| `src/components/listings/HouseCard.tsx` | Listing card | card rendering + CTA | image, location, rent, type | none | parent props | `house_photos`, `properties`, `units` | `search_house_listings` | none | none | select/rpc from listings page | Covered in `0004` |
| `src/app/listings/[id]/page.tsx` | Listing details | unit + property details, amenities, map, reviews | details, policies, map, comments | realtime map access event | API + large fallback mock + localStorage visitor id | `properties`, `units`, `house_map_locations`, `house_photos`, `house_amenities`, `tenant_comments`, `house_nearby_places` | `get_house_listing_details`, `can_access_unit` | `process-maintenance-escalation` (not this page), optional realtime map edge | none | `rpc('get_house_listing_details', { p_house_id })` | Covered in `0004` |
| `src/app/listings/[id]/reviews/page.tsx` | Reviews page | Sort/filter reviews list | rating/date/comment | none currently | hardcoded reviews | `tenant_comments` | none required (or helper view) | moderation edge optional | none | `from('tenant_comments').select(...)` | Covered in `0004` |
| `src/app/auth/login/page.tsx` | Login | Sign-in + role redirect | errors and hints | email/password | Supabase auth + profiles | `profiles`, `tenants` | `is_tenant`, `is_employee` | none | none | `auth.signInWithPassword` + `from('profiles')` | Existing + `0004` compatible |
| `src/app/auth/register/page.tsx` | Tenant registration | Sign-up tenant users | form state/error | email/password | Supabase auth | `profiles`, `tenants` | `create_tenant_profile` | `admin-invite-tenant` for staff-driven flow | none | `auth.signUp` + onboarding flow | Existing + `0004` enhancement |
| `src/app/tenant/onboarding/page.tsx` | Tenant onboarding wizard | Password/profile/agreement steps | onboarding status | password/profile/agreement acceptance | API contract exists, backend gap | `tenant_applications`, `tenant_contacts`, `tenant_terms_acceptance`, `profiles` | `update_tenant_profile`, `accept_house_terms` | none | onboarding stale reminder | `rpc(...)` recommended for atomic steps | Completed in `0004` |
| `src/app/tenant/dashboard/page.tsx` | Tenant dashboard | identity, map, actions, activity/rules | tenant identity/lease summary | quick actions nav only | partially mocked via `/auth/me` | `tenants`, `leases`, `tenant_unit_assignments`, `tenant_preferences`, `tenant_notifications`, `tenant_warnings` | `current_user_id`, `is_tenant`, `can_access_unit` | none | lease expiry reminder | joined selects + rpc helpers | Completed in `0004` |
| `src/components/tenant/TenantIdentityCard.tsx` | Tenant identity card | render tenant summary | plot/room/lease dates/pay status | none | parent props (mocked now) | `tenants`, `leases`, `tenant_unit_assignments` | none | none | none | select joined tenant profile | Uses new tables |
| `src/components/tenant/LiveMap.tsx` | Tenant live map | map with view limits and share action | map stats, view counters | local view increments | localStorage only | `house_map_locations`, `system_events`, optional `tenant_preferences` | none | `send-notification` for share | none | insert event on map access | Partially covered (`house_map_locations/system_events`) |
| `src/components/tenant/RecentActivity.tsx` | tenant activity feed | render activity cards | payments/maintenance/announcements | none | hardcoded array | `payments`, `maintenance_requests`, `announcements`, `notifications` | none | none | monthly rent reminders | combined selects | Existing + `0004` |
| `src/components/tenant/PlotRules.tsx` | rules accordion | show property rules | rules text | none | hardcoded array | `property_rules` | none | none | none | `from('property_rules').select(...)` | Covered in `0004` |
| `src/app/tenant/chat/page.tsx` | tenant direct chat | chat thread and send message | chat bubbles | message text | fully mock | `chat_threads`, `chat_participants`, `chat_messages` | none mandatory | optional moderation/send edge | message retention archival | `from('chat_messages').insert/select` | Mostly existing (from `0003`) |
| `src/app/caretaker/dashboard/page.tsx` | caretaker dashboard | KPIs, applications, issues, inventory | open issues/maintenance/vacancy | response actions via child components | mixed API + mock subcomponents | `issues`, `maintenance_requests`, `tenant_applications`, `units`, `tenant_warnings` | `assign_maintenance_request`, `update_maintenance_status`, `assign_tenant_to_unit` | `admin-create-employee` optional | overdue maintenance escalation | current domain APIs + new RPCs | Completed in `0004` |
| `src/components/caretaker/ApplicationManager.tsx` | app approvals | approve/reject tenant applications | applicant details/status | approve/reject + notes | API (real) | `tenant_applications`, `tenants`, `profiles`, `tenant_contacts` | `create_tenant_profile` on approval | `admin-invite-tenant` | follow-up reminders | update `tenant_applications` + RPC chain | Completed in `0004` |
| `src/components/caretaker/IssuesTable.tsx` | issues table | maintenance tickets table | issue details/status | resolve/forward intent | hardcoded array | `issues`, `maintenance_requests`, `maintenance_request_updates` | `update_maintenance_status` | none | unresolved issue reminders | `from('issues')` + `rpc('update_maintenance_status')` | Completed in `0004` |
| `src/app/caretaker/chat/group/page.tsx` | group chat | caretaker group chat | messages | new message | hardcoded | `chat_threads`, `chat_messages`, `chat_participants` | none | optional broadcast push edge | chat retention job | realtime select/insert | Existing + policy refinement pending |
| `src/app/caretaker/chat/group/info/page.tsx` | group info | members + contact popup | group metadata/members | none | hardcoded | `employees`, `employee_property_assignments`, `chat_participants` | none | none | none | joined query by group | `employees` added in `0004` |
| `src/app/admin/dashboard/page.tsx` | admin KPIs | global metrics + issue/staff counts | totals/occupancy/net profit | none | domain APIs | `properties`, `units`, `tenants`, `profiles`, `issues`, `financial_snapshots` | `generate_financial_snapshot` | none | monthly snapshots | mostly existing calls | Existing + `0004` |
| `src/app/admin/properties/page.tsx` | property registry form | create property + caretaker + map/policies | property list + PIN | full property setup form | API call | `properties`, `house_map_locations`, `property_terms`, `property_rules`, `employees`, `employee_property_assignments` | `create_house_listing`, `update_house_listing` | `admin-create-employee`, `upload-house-photo` | listing expiry | `from('properties').insert` + rpc preferred | Completed in `0004` |
| `src/app/admin/employees/page.tsx` | employee management | list users and add employee | email/role/active | email role temp password | API partially not implemented | `employees`, `profiles`, `employee_role_permissions` | `has_role`, `is_employee` | `admin-create-employee` | inactive account audit | edge + table calls | Completed in `0004` |
| `src/app/admin/broadcast/page.tsx` | announcements | create announcements + list recent | title/content/target role | announcement payload | API call | `announcements`, `announcement_reads`, `notifications` | `create_announcement`, `mark_announcement_read` | `send-announcement-message` | archive old notifications | `rpc('create_announcement')` + table read | Completed in `0004` |
| `src/app/admin/settings/page.tsx` | system settings | toggles for global options | toggle state | settings change | local state only | `app_settings` | none | none | none | `from('app_settings').upsert` | Added in `0004` |
| `src/app/admin/finance/page.tsx` | finance overview | snapshots list | month/year/income/expense/net | none | API | `financial_snapshots` | `generate_financial_snapshot` | none | monthly snapshot cron | existing calls | Existing |
| `src/app/accountant/dashboard/page.tsx` | accountant dashboard | KPI and finance widgets | income/expense/profit | none | API + static child data | `financial_snapshots`, `budgets`, `ledger_transactions`, `payments` | `generate_financial_snapshot` | none | monthly stats aggregation | existing domain calls | Existing + `0004` |
| `src/app/accountant/budgets/page.tsx` | budget create/list | create budget and render budgets | budget list | name/amount/period | API | `budgets`, `budget_allocations` | none | none | budget variance digest | existing calls | Existing |
| `src/app/accountant/ledger/page.tsx` | ledger page | transactions list | latest ledger tx | none | API | `ledger_transactions`, `ledger_entries` | none | none | monthly ledger close | existing calls | Existing |
| `src/app/accountant/reports/page.tsx` | reports page | generate current snapshot | snapshots | month/year generation | API | `financial_snapshots` | `generate_financial_snapshot` | none | monthly run | existing `rpc` call | Existing |
| `src/app/accountant/chat/page.tsx` | accountant chat placeholder | UI only currently | mock conversations | none | static | `chat_threads`, `chat_messages` | none | optional messaging edge | retention | table calls after implementation | Existing chat schema |
| `src/app/it-support/dashboard/page.tsx` | IT dashboard | health/logs/tickets panels | health/logs/issues | none | mocked health/logs + real issues | `system_events`, `audit_logs`, `issues` | `log_audit_event` | none | log archival | `from('system_events')` and audits | `system_events` added in `0004` |
| `src/lib/api/client.ts` | API dispatcher | maps pseudo REST endpoints to Supabase | varies | varies | mixed real + stubbed endpoints | all domain tables | all listed RPCs | edge where privileged | domain dependent | normalize to direct supabase calls | `0004` supports missing pieces |
| `src/lib/api/domains/tenant-profile.ts` | tenant me API | fetch current tenant profile | auth user/profile | none | TODO/mock comments | `tenants`, `tenant_contacts`, `tenant_unit_assignments` | `current_user_id`, `is_tenant` | none | none | replace with joined select/rpc | Supported in `0004` |
| `src/lib/api/domains/chat.ts` | chat API | thread/messages APIs | messages | send message | mostly placeholder | `chat_threads`, `chat_messages`, `chat_participants` | none | optional anti-spam edge | message cleanup | realtime selects/inserts | Existing schema |
| `src/components/FAQSection.tsx` | public FAQ section | show FAQ cards | FAQ text | none | static array | `property_faqs`/`faqs` | none | none | none | `from('property_faqs').select` | `property_faqs` added |
| `src/components/RulesSection.tsx` | public rules section | show rules | rules text | none | static array | `property_rules`/`rules` | none | none | none | `from('property_rules').select` | `property_rules` added |
| `src/components/AnnouncementBanner.tsx` | alert banner | temporary announcement | banner content | dismiss local | local state | `announcements`, `announcement_reads` | `mark_announcement_read` | none | old announcement archival | select announcements + rpc read marker | Completed in `0004` |
| `src/components/Navbar.tsx` | nav | role/public nav items | links | none | hardcoded links | no required table | no rpc | none | none | none | N/A |

## Mock/Hardcoded/Temporary Data Findings

- **Hardcoded arrays needing persistence:** listings, reviews, FAQs, rules, tenant recent activity, caretaker issues, group members/messages, accountant/IT widget demo data.
- **Local storage usage:** `arena_visitor_id`, `tenant_map_views`; should be mirrored to `system_events` if analytics/compliance matters.
- **Backend gaps noted in comments:** `/tenants/me`, onboarding step APIs, chat thread list, `/users POST`, `/properties/pin/*` access paths.

## Phase 2: Database Grouping

### 1) Tables
- **Identity and access:** `profiles`, `employees`, `employee_permissions`, `employee_role_permissions`, `employee_property_assignments`
- **Tenant domain:** `tenants`, `tenant_contacts`, `tenant_preferences`, `tenant_unit_assignments`, `leases`, `tenant_lease_documents`, `tenant_terms_acceptance`, `tenant_warnings`, `tenant_comments`, `tenant_applications`, `notifications`
- **Property/listing domain:** `properties`, `units`, `house_photos`, `house_amenities`, `house_nearby_places`, `house_map_locations`, `property_rules`, `property_terms`, `property_faqs`
- **Operations domain:** `issues`, `maintenance_requests`, `maintenance_request_updates`, `announcements`, `announcement_reads`
- **Finance domain:** `payments`, `ledger_transactions`, `ledger_entries`, `budgets`, `budget_allocations`, `financial_snapshots`
- **System domain:** `audit_logs`, `app_settings`, `files`, `system_events`

### 2) SQL functions/RPC
- Access: `current_user_id`, `has_role`, `is_admin`, `is_employee`, `is_tenant`, `can_manage_property`, `can_access_house`, `can_access_unit`
- Tenant lifecycle: `create_tenant_profile`, `update_tenant_profile`, `accept_house_terms`, `assign_tenant_to_unit`
- Maintenance: `create_maintenance_request`, `assign_maintenance_request`, `update_maintenance_status`
- Listings: `create_house_listing`, `update_house_listing`, `get_house_listing_details`, `search_house_listings`, `set_unit_vacancy_status`
- Communication/audit: `create_announcement`, `mark_announcement_read`, `create_tenant_warning`, `log_audit_event`

### 3) Edge Functions (server-only/privileged)
- `admin-create-employee`
- `admin-invite-tenant`
- `upload-house-photo`
- `send-announcement-message`
- `send-notification`
- `generate-lease-document`
- `process-maintenance-escalation`

### 4) Cron jobs
- expire old listings
- lease expiry reminders
- overdue maintenance escalation
- monthly financial snapshot generation (already exists)
- archive old notifications (recommended next migration/edge)

### 5) Frontend Supabase call approach
- Use direct `from(...).select/insert/update` for simple CRUD under RLS.
- Use `rpc(...)` for multi-table writes and permission-sensitive operations.
- Use Edge Function invoke for service-role/secrets/external side effects.

## Phase 8: Edge Function Specs

### `supabase/functions/admin-create-employee`
- Purpose: create auth user + profile + employee row + assignment atomically.
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`.
- Request body: `{ email, roleId, fullName, phoneNumber, propertyIds? }`
- Response: `{ employeeId, userId, tempPassword }`
- Permission: caller must be admin role.
- Frontend call: `supabase.functions.invoke('admin-create-employee', { body })`.

### `supabase/functions/admin-invite-tenant`
- Purpose: approve application, create tenant account, send credentials email.
- Secrets: service key + SMTP provider key.
- Request body: `{ applicationId, approve, notes? }`
- Response: `{ ok, tenantId?, userId? }`
- Permission: admin/caretaker on assigned property.

### `supabase/functions/upload-house-photo`
- Purpose: validate file metadata and insert `house_photos` row.
- Secrets: optional image service API key.
- Request body: `{ propertyId, unitId?, path, caption?, isCover? }`
- Response: `{ photoId, url }`
- Permission: admin/caretaker for property.

### `supabase/functions/send-announcement-message`
- Purpose: fan-out announcements to email/SMS/push.
- Secrets: mail/SMS providers.
- Request body: `{ announcementId }`
- Response: `{ recipientsCount, queued }`
- Permission: admin/caretaker.

### `supabase/functions/generate-lease-document`
- Purpose: create signed PDF and store in bucket; insert `tenant_lease_documents`.
- Secrets: PDF provider or template secrets.
- Request body: `{ leaseId }`
- Response: `{ fileId, fileUrl }`
- Permission: admin/accountant/caretaker.

### `supabase/functions/process-maintenance-escalation`
- Purpose: escalate stale maintenance to staff channels.
- Secrets: communication provider keys.
- Request body: optional manual run params.
- Response: `{ escalatedCount }`
- Permission: internal cron or admin.

## Phase 9: Cron Jobs + Verification

- `arena-expire-old-listings` (`0 3 * * *`)
  - SQL: updates `properties.listing_status` to `ARCHIVED`.
  - Verify: `select count(*) from properties where listing_status='ARCHIVED' and updated_at::date = current_date;`
- `arena-lease-expiry-reminders` (`30 8 * * *`)
  - SQL: inserts reminders into `notifications`.
  - Verify: `select count(*) from notifications where title='Lease expiry reminder' and created_at::date=current_date;`
- `arena-maintenance-escalation` (`0 * * * *`)
  - SQL: logs `system_events` for stale scheduled requests.
  - Verify: `select count(*) from system_events where event_type='MAINTENANCE_ESCALATION' and created_at > now()-interval '1 day';`
- Existing from previous migration: monthly snapshot job.

## Phase 10: Frontend API/Data Call Map (Recommended)

- Listings page: `supabase.rpc('search_house_listings', filters)`
- Listing details: `supabase.rpc('get_house_listing_details', { p_house_id: propertyId })`
- Tenant onboarding:
  - profile: `supabase.rpc('update_tenant_profile', payload)`
  - agreement: `supabase.rpc('accept_house_terms', payload)`
- Tenant maintenance submit: `supabase.rpc('create_maintenance_request', payload)`
- Caretaker assign/update maintenance:
  - `supabase.rpc('assign_maintenance_request', payload)`
  - `supabase.rpc('update_maintenance_status', payload)`
- Admin broadcast:
  - create: `supabase.rpc('create_announcement', payload)`
  - read marker: `supabase.rpc('mark_announcement_read', { p_announcement_id })`
- Admin property registry:
  - create property: `supabase.rpc('create_house_listing', payload)`
  - update: `supabase.rpc('update_house_listing', payload)`
- Employee admin:
  - `supabase.functions.invoke('admin-create-employee', { body })`
- Tenant application approval:
  - `supabase.functions.invoke('admin-invite-tenant', { body: { applicationId } })`

## Phase 11: Migration Files

Created:
- `supabase/migrations/0004_frontend_supabase_completion.sql`

This migration adds missing schema domains, RPCs, triggers, RLS policies, and cron scaffolding needed to move the frontend from mock/local state to persistent Supabase-backed data flows.
