# Arena Homes — Full Application Summary (Prose)

A narrative summary for AI understanding, with references to key files.

---

## What Arena Homes Is

Arena Homes is a student housing and property management platform for Egerton University and its surroundings: Njoro, Main Gate, Njokerio, Milimani, Blue Valley, and Town. Students browse properties, apply for rooms, sign leases, and pay rent. Caretakers manage plots and tenants. Accountants handle money and reports. IT Support monitors the system, and Super Admins control everything. The system also runs announcements, chat, maintenance requests, and financial snapshots. The main README at `README.md` and `arena-web/README.md` describe the platform and quick start; the database design is in `DATABASE_SCHEMA_SPEC.md`.

---

## Architecture and Structure

The project splits into two apps: **arena-web** (frontend) and **arena-server** (backend). The frontend uses Next.js 16 with the App Router, TypeScript, Tailwind CSS 4, Framer Motion, and GSAP. The backend uses Node.js, Express, TypeScript, and Drizzle ORM over PostgreSQL 14+. Authentication uses JWT in HTTP-only cookies plus refresh tokens. The frontend runs on port 3000 (or 3001 if 3000 is busy); the backend on port 4000. Route wiring is in `arena-server/src/app.ts`, which mounts all API routers under `/api`. Each domain (auth, properties, leases, payments, etc.) lives in its own module under `arena-server/src/modules/`. The frontend pages live under `arena-web/app/` using Next.js App Router.

---

## User Roles and Hierarchy

There are six roles: SUPER_ADMIN, TENANT, CARETAKER, ACCOUNTANT, IT_SUPPORT, and PUBLIC. The role enum and type definitions are in `arena-web/lib/rbac/types.ts`. SUPER_ADMIN is the top authority; it can access all dashboards. ADMIN is used interchangeably with SUPER_ADMIN in the API. ACCOUNTANT handles finance; IT_SUPPORT handles system ops; CARETAKER manages plots; TENANT is a resident; PUBLIC is unauthenticated. The full permission configuration for each role is in `arena-web/lib/rbac/config.ts`, which defines what each role can view, manage, update, create, and do, plus their restrictions.

---

## Super Admin

The Super Admin has full platform visibility and control. They can see all dashboards (tenant, caretaker, accountant, IT), analytics, user accounts, issues, and IT data. They manage employees (activate, suspend, summon), caretaker groups, business identity, rules, regulations, and FAQ. They create plots/apartments and discounts, process payroll, generate payslips, assign caretakers, resolve issues, and broadcast announcements. They cannot change IT internals or override IT security. This is all described in `arena-web/lib/rbac/config.ts` under the SUPER_ADMIN entry.

---

## Tenant

Tenants manage their own housing and payments. They see their profile, lease, payment history, house details, plot rules, FAQ, and rent balance. They can update username and profile picture, download the lease PDF, pay rent via M-Pesa, get reminders, report issues, and chat with caretaker or admin. They cannot change legal details, chat with other tenants, or rate a house before the lease ends; map usage is limited (5 personal, 15 total loads). Tenant-related routes are under `arena-web/app/tenant/`; tenant API logic is in `arena-server/src/modules/tenant/` and `arena-server/src/modules/lease/`.

---

## Caretaker

Caretakers (landlords) operate at the plot level. They see their assigned plots, room types, tenant directory, room allocations, tenant leases (read-only), and tenant payment history (last 4 months). They update their profile, plot facilities, and plot rules. They manage rooms (mark taken/vacant) and maintenance schedules. They can warn or evict tenants (eviction is admin-logged), receive and resolve or forward issues, get maintenance requests, post plot announcements, and export lease and payment PDFs. They cannot access global analytics, the ledger, employee management, or business identity. Caretaker pages are in `arena-web/app/caretaker/`; API logic in `arena-server/src/modules/tenant/`, `arena-server/src/modules/lease/`, `arena-server/src/modules/issue/`, and `arena-server/src/modules/maintenance/`.

---

## Accountant

Accountants handle finance and reporting. They see the accountant dashboard, ledger, payments, budgets, income vs expenses, cash flow, and caretaker financial records. They create budgets and allocations, flag discrepancies, generate monthly reports (around the 5th of each month), generate tax forms, download PDFs, and chat with admin and caretakers. They cannot edit tenant data, chat with tenants, change system settings, or process tenant payments. Accountant pages are in `arena-web/app/accountant/`; API in `arena-server/src/modules/ledger/`, `arena-server/src/modules/budget/`, `arena-server/src/modules/payment/`, and `arena-server/src/modules/reporting/`.

---

## IT Support

IT Support focuses on system health. They see the IT dashboard, logs, diagnostics, integration status (M-Pesa, Maps), user activity, and suspicious logins. They monitor health, run scans, assign and resolve tickets, perform backup and restore, and monitor security alerts. They chat with admin only. They cannot see financial data, personal tenant details, or business rules, or gain admin privileges. IT Support pages are in `arena-web/app/it-support/`; API in `arena-server/src/modules/system/`.

---

## Public User

Public users are unauthenticated. They can browse listings, view house details, see public announcements, FAQ, and rules. They can search and filter, contact Arena Homes, and apply for a room. They cannot see tenant data or dashboards. Public routes include `/`, `/listings`, `/listings/[id]`, `/listings/[id]/reviews`; these are defined in `arena-web/app/(public)/page.tsx`, `arena-web/app/listings/`, and `arena-web/middleware.ts` (which treats these as public paths).

---

## Route Access and Middleware

Frontend route protection is in `arena-web/middleware.ts`. Public paths are `/_next`, `/static`, `/`, `/public`, `/auth`, and `/listings`. For other paths, the middleware checks the `access_token` and `user_role` cookies. If missing, the user is redirected to `/auth/login?from=<path>`. If present, `arena-web/lib/rbac/access.ts` is used via `canAccessRoute(role, path)`. SUPER_ADMIN can access all routes; others can only access their role’s routes (e.g., tenants `/tenant/*`, caretakers `/caretaker/*`). `getRedirectPath(role)` in the same file returns the dashboard path per role. Route permission logic lives in `arena-web/lib/rbac/access.ts`.

---

## Authentication Flow

Login starts on `arena-web/app/auth/login/page.tsx`, which calls `arena-web/app/auth/actions.ts` `loginAction`. That uses `arena-web/lib/api/auth` to send email and password to `POST /api/auth/login` (handled by `arena-server/src/modules/auth/router.ts`). The backend validates credentials and returns access and refresh tokens plus user info (including `roleId`). The action sets `access_token`, `refresh_token`, and `user_role` cookies (see `arena-web/app/auth/actions.ts`). The login page then uses `getRedirectPath(role)` and redirects to the correct dashboard. Logout is via `logoutAction` in the same file, which clears the cookies and redirects to `/auth/login`.

---

## API Endpoints and Role Checks

All API routes are mounted in `arena-server/src/app.ts` under `/api`. Auth routes (`/api/auth`) are in `arena-server/src/modules/auth/router.ts`. Protected routes use `authenticate` and `requireRole` (from `arena-server/src/modules/auth/middleware.ts`). For example: properties POST and PATCH require SUPER_ADMIN or ADMIN; leases GET requires SUPER_ADMIN, ADMIN, ACCOUNTANT, or CARETAKER; payments POST requires any authenticated user; payments PATCH confirm requires SUPER_ADMIN, ADMIN, or ACCOUNTANT; ledger and budgets require SUPER_ADMIN, ADMIN, or ACCOUNTANT; issues GET and PATCH require SUPER_ADMIN, ADMIN, or CARETAKER; system logs and diagnostics require IT_SUPPORT or SUPER_ADMIN. Public endpoints (no auth) include GET properties, GET units/:id, GET announcements, GET faq, GET rules, and GET system/health. Each module’s router in `arena-server/src/modules/*/router.ts` shows the exact role requirements.

---

## Lease Lifecycle

Leases are created by Admin or Caretaker via `POST /api/leases` (see `arena-server/src/modules/lease/router.ts` and `arena-server/src/modules/lease/service.ts`). A lease starts as DRAFT. Activation is via `PATCH /api/leases/:id/activate`. Once ACTIVE, tenants can see it and pay rent. Tenant payments go through `POST /api/payments`; confirmation by Accountant or Admin via `PATCH /api/payments/:id/confirm` creates ledger entries. Termination is via `PATCH /api/leases/:id/terminate`. Lease schema and logic are in `arena-server/src/modules/lease/`. The database schema for leases, lease_history, and room_allocations is described in `DATABASE_SCHEMA_SPEC.md` under the Leasing section.

---

## Payment and Ledger Flow

Tenants initiate payments (M-Pesa or Bank) with `POST /api/payments` (see `arena-server/src/modules/payment/router.ts` and `arena-server/src/modules/payment/service.ts`). The payment is PENDING until an Accountant or Admin confirms it via `PATCH /api/payments/:id/confirm`. On confirmation, double-entry ledger entries (DEBIT and CREDIT) are created in `arena-server/src/modules/ledger/`. Ledger entries and financial snapshots are immutable (append-only); this is enforced in the schema and noted in `DATABASE_SCHEMA_SPEC.md`. Income records are updated when payments are confirmed. The ledger and payment modules are in `arena-server/src/modules/ledger/` and `arena-server/src/modules/payment/`.

---

## Issues and Maintenance

Tenants submit issues via `POST /api/issues` (any authenticated user). Caretakers and Admins list them with `GET /api/issues` and resolve with `PATCH /api/issues/:id/resolve` (see `arena-server/src/modules/issue/router.ts`). Maintenance requests are created and listed via `arena-server/src/modules/maintenance/router.ts`; only SUPER_ADMIN, ADMIN, or CARETAKER can create maintenance records. Issues can be forwarded to Admin when needed.

---

## Financial Reporting

Accountants and Admins create monthly financial snapshots via `POST /api/reports/snapshot` (see `arena-server/src/modules/reporting/router.ts`). Snapshots are stored in `financial_snapshots` and are read-only after creation. Reports include balance sheet, tax prep, and expense vs income. The reporting service is in `arena-server/src/modules/reporting/service.ts`. Budget creation and listing are in `arena-server/src/modules/budget/`.

---

## Database Structure

The database design is in `DATABASE_SCHEMA_SPEC.md`. IAM uses users, roles, permissions, role_permissions, employee_profiles, and tenant_profiles. Property uses locations, properties, unit_types, units, and unit_availability_snapshots. Leasing uses leases, lease_history, and room_allocations. Finance uses payments, ledger_entries, budgets, budget_allocations, expenses, income_records, financial_snapshots, and payslips. Communication uses chat_threads, messages, announcements, and notifications. Support uses support_tickets, ticket_notes, faqs, and rules. Audit uses audit_logs (immutable), system_logs, and error_logs. The spec states that ledger_entries, audit_logs, and financial_snapshots must not be updated or deleted by the application; they are append-only.

---

## Frontend Pages

Pages live under `arena-web/app/`. The homepage is `arena-web/app/(public)/page.tsx`, with Hero, FeaturedListings, HowItWorks, Testimonials, StaticMap, TrustSection, FAQSection, and RulesSection. Listings are in `arena-web/app/listings/page.tsx` and `arena-web/app/listings/[id]/page.tsx`. Auth is in `arena-web/app/auth/login/page.tsx` and `arena-web/app/auth/register/page.tsx`. Admin pages are under `arena-web/app/admin/` (dashboard, properties, employees, finance, broadcast, settings). Tenant pages are under `arena-web/app/tenant/` (dashboard, chat). Caretaker pages are under `arena-web/app/caretaker/` (dashboard, chat/group, chat/group/info). Accountant pages are under `arena-web/app/accountant/` (dashboard, ledger, budgets, reports, chat). IT Support pages are under `arena-web/app/it-support/` (dashboard, chat). Layouts are in each section’s `layout.tsx` (e.g., `arena-web/app/admin/layout.tsx`). The root layout is `arena-web/app/layout.tsx`, which validates `NEXT_PUBLIC_API_URL` and wraps the app in ThemeProvider.

---

## Test Credentials

After seeding with `arena-server`’s seed scripts (see `arena-server/README.md` and `SEEDING_QUICK_START.md` if present), these accounts are available: admin@arenahomes.test / Admin#1234 (SUPER_ADMIN), caretaker1@arenahomes.test / Care#1234 (CARETAKER), accountant@arenahomes.test / Acc#1234 (ACCOUNTANT), it@arenahomes.test / IT#1234 (IT_SUPPORT), tenant1@arenahomes.test and tenant2@arenahomes.test / Ten#1234 (TENANT).

---

## Environment and Security

Backend env is in `arena-server/.env`: DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET, PORT. Frontend env is in `arena-web/.env.local`: NEXT_PUBLIC_API_URL (e.g., http://localhost:4000/api). Auth uses JWT in HTTP-only cookies; the frontend auth API client is in `arena-web/lib/api/`. CORS in `arena-server/src/app.ts` allows credentials from http://localhost:3000. RBAC is enforced both in the frontend middleware (`arena-web/middleware.ts` and `arena-web/lib/rbac/access.ts`) and in the backend via `requireRole` in `arena-server/src/modules/auth/middleware.ts`.

---

*Document version: 1.1 — Arena Homes Platform Summary (Prose with File References)*
