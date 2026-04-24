# Arena Homes Seeding System

Production-grade, idempotent seeding system for Arena Homes backend.

## Overview

This seeding system provides two modes:
- **Minimal**: Fast smoke test dataset for development
- **Demo**: Larger dataset for charts, dashboards, and demonstrations

## Features

✅ **Idempotent** - Safe to run multiple times without duplicating data  
✅ **Domain-Driven** - Uses domain services (LeaseService, PaymentService) instead of raw DB inserts  
✅ **Audit-Safe** - All writes produce AuditLog entries with proper AuditContext  
✅ **Invariant-Preserving** - Respects ledger append-only, lease state transitions, payment confirmations  
✅ **Deterministic** - Repeatable results using seeded random generation  
✅ **TypeScript Strict** - Full type safety and compile-time checks  

## Usage

### Prerequisites

1. Ensure database is running and accessible
2. Set `DATABASE_URL` in `.env` file
3. Run migrations: `npm run migrate` (if applicable)

### Running Seeds

```bash
# Minimal seed (fast, for development)
npm run seed:minimal

# Demo seed (larger dataset, for dashboards)
npm run seed:demo
```

## Minimal Seed Dataset

Creates a complete but minimal working environment:

### Users (6)
- `admin@arenahomes.test` → `Admin#1234` (ADMIN)
- `caretaker1@arenahomes.test` → `Care#1234` (CARETAKER)
- `accountant@arenahomes.test` → `Acc#1234` (ACCOUNTANT)
- `it@arenahomes.test` → `IT#1234` (IT_SUPPORT)
- `tenant1@arenahomes.test` → `Ten#1234` (TENANT)
- `tenant2@arenahomes.test` → `Ten#1234` (TENANT)

### Properties (1)
- **Arena Njokerio A**
  - Location: Njokerio
  - Caretaker: caretaker1
  - Facilities: Constant water, parking, wifi, 24/7 security

### Units (8)
- 3 × SINGLE (KSh 3,500 - 4,000)
- 2 × BEDSITTER (KSh 5,500 - 6,000)
- 2 × ONE_BEDROOM (KSh 9,000 - 9,500)
- 1 × TWO_BEDROOM (KSh 12,000)

Unit codes: `NJK-A-S1`, `NJK-A-S2`, `NJK-A-S3`, `NJK-A-BS1`, `NJK-A-BS2`, `NJK-A-1B1`, `NJK-A-1B2`, `NJK-A-2B1`

### Leases (3)
- **ACTIVE**: tenant1 → NJK-A-S1
- **ACTIVE**: tenant2 → NJK-A-BS1
- **PENDING**: tenant1 → NJK-A-S2

### Payments (3)
- **SUCCESS**: tenant1 rent payment (KSh 3,500) - `SEED-MPESA-0001`
- **SUCCESS**: tenant2 rent payment (KSh 5,500) - `SEED-MPESA-0002`
- **FAILED**: tenant1 failed attempt - `SEED-MPESA-FAIL-0001`

### Issues (2)
- tenant1: "Water tap leaking" (OPEN, PLUMBING)
- tenant2: "Bulb replacement" (OPEN, ELECTRICAL)

### Maintenance (1)
- Monthly property inspection (SCHEDULED, 7 days from now)

### Announcements (3)
- PUBLIC: "New Rooms Available"
- TENANT: "Rent Reminder"
- EMPLOYEE: "Staff Meeting"

### Notifications (5)
- Payment receipts, issue confirmations, maintenance assignments

### Financial Snapshots (1)
- Current month snapshot with income/expenses/net profit

## Demo Seed Dataset

Extends minimal seed with:

### Properties (3 total)
- Arena Njokerio A (from minimal)
- Arena Main Gate B (Main Gate location)
- Arena Town C (Njoro Town location)

### Units (60 total)
- Mixed types: SINGLE, BEDSITTER, ONE_BEDROOM, TWO_BEDROOM, APARTMENT
- Distributed across all properties
- Deterministic pricing with variations

### Tenants (20 total)
- Mix of ACTIVE and PROSPECT statuses
- Realistic profiles with university registration numbers

### Leases (15 active)
- Distributed across properties
- ~60-70% occupancy rate

### Payments (Historical - Last 4 Months)
- 10+ SUCCESS payments per month
- 2+ FAILED payments
- Mocked MPESA confirmations via PaymentService.confirmPayment
- References: `SEED-MPESA-2025-MM-XXXX`

### Budgets (2)
1. **Maintenance Budget 2025** (KSh 500,000)
   - Water: KSh 150,000
   - Electricity: KSh 200,000
   - Repairs: KSh 150,000

2. **Operations Budget 2025** (KSh 300,000)
   - Security: KSh 120,000
   - Cleaning: KSh 100,000
   - Internet: KSh 80,000

### Financial Snapshots (Last 4 Months)
- Monthly snapshots per property
- Income/expenses/net profit calculations
- PDF URL placeholders

## Architecture

### SYSTEM Actor

All seed operations use a dedicated SYSTEM actor:
- Email: `system@arenahomes.test`
- ID: `00000000-0000-0000-0000-000000000001`
- Role: ADMIN
- AuditContext: `actorType: 'SYSTEM'`, `ipAddress: '127.0.0.1'`, `userAgent: 'seed-runner'`

### Idempotency Strategy

1. **Users**: Check by email before creating
2. **Properties**: Check by name before creating
3. **Units**: Check by description (unit code) before creating
4. **Payments**: Check by gatewayTransactionId before creating
5. **Leases**: Check by unitId before creating

### Domain Service Usage

**Critical flows use domain services (NOT direct DB inserts):**

- ✅ **Leases**: `LeaseService.draftLease()` → `LeaseService.activateLease()`
  - Ensures unit status transitions (VACANT → TAKEN)
  - Creates immutable lease_history entries
  - Produces audit logs

- ✅ **Payments**: `PaymentService.initiatePayment()` → `PaymentService.confirmPayment()`
  - Simulates webhook callback
  - Creates balanced ledger entries (double-entry)
  - Updates payment status atomically
  - Produces audit logs

- ✅ **Tenants**: `TenantRepository.create()` → `TenantRepository.updateStatus()`
  - Links to user profiles
  - Tracks status changes
  - Produces audit logs

### Invariants Preserved

1. **Ledger Append-Only**: Never directly inserts into `ledger_entries`
2. **Audit Logs**: All state changes produce audit entries
3. **Unit Status**: Controlled by LeaseService state transitions
4. **Payment Confirmation**: Uses PaymentService.confirmPayment (webhook simulation)
5. **Lease History**: Immutable, append-only via LeaseService

## File Structure

```
src/scripts/seed/
├── index.ts      # Main seed runner CLI
├── minimal.ts    # Minimal seed dataset
├── demo.ts       # Demo seed dataset
└── utils.ts      # Shared utilities
```

## Utilities

### `createSeedAuditContext(action: string)`
Creates consistent AuditContext for all seed operations.

### `hashPassword(password: string)`
Bcrypt password hashing with consistent rounds.

### `SeededRandom`
Deterministic random number generator for repeatable results.

### `generateUnitCode(prefix, type, index)`
Generates stable unit codes (e.g., `NJK-A-S1`).

### `generateMpesaReference(index, status)`
Generates MPESA payment references (e.g., `SEED-MPESA-0001`).

### `seedLog`
Formatted console logging for seed operations.

## Safety & Best Practices

### ✅ DO
- Run seeds in development/staging environments
- Verify DATABASE_URL before running
- Use domain services for critical flows
- Check idempotency before creating records
- Attach AuditContext to all writes

### ❌ DON'T
- Run seeds in production without explicit approval
- Directly insert into immutable tables (ledger_entries, audit_logs)
- Bypass domain services for leases/payments
- Delete immutable tables during reseed
- Modify payment status without PaymentService

## Troubleshooting

### "Database not initialized"
Ensure DATABASE_URL is set in `.env` and database is running.

### "User already exists"
This is expected behavior (idempotency). The seed will skip existing records.

### "Unit is not available for lease"
Unit might already be TAKEN. Check existing leases or run a fresh seed.

### TypeScript compilation errors
Run `npm run build` to check for type errors before seeding.

## Success Criteria

✅ `npm run build` passes (TypeScript strict)  
✅ `npm run seed:minimal` creates working test environment  
✅ `npm run seed:demo` creates dashboard-ready data  
✅ Ledger remains append-only with balanced entries  
✅ Audit logs exist for all state changes  
✅ No forbidden direct writes in seed code  

## Future Enhancements

- [ ] RESET mode to truncate safe mutable tables
- [ ] Seed data export/import
- [ ] Custom seed profiles (e.g., "high-occupancy", "low-occupancy")
- [ ] Seed data validation reports
- [ ] Performance metrics and benchmarking

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-24  
**Maintainer**: Arena Homes Backend Team
