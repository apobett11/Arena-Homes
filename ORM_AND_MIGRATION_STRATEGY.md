# ORM & Migration Strategy
**Version:** 1.0.0
**Status:** Approved for Implementation
**Target System:** Egerton University Student Housing Platform

---

## 🎯 1. ORM Philosophy & Guarantees

This strategy defines how the Object-Relational Mapping (ORM) layer actively enforces the business rules, security policies, and financial integrity constraints defined in the system architecture.

**Core Guarantees:**
1.  **Immutability by Default:** The ORM prevents destructive actions on critical data types at the middleware level, acting as a second line of defense behind the database permissions.
2.  **Audit-First Writes:** No mutable operation occurs without a corresponding `AuditLog` entry, injected automatically by the ORM.
3.  **Financial Integrity:** All financial data is append-only. "Correction" is the only valid form of modification.
4.  **Type Safety:** The ORM enforces strict typing on all entities, including JSON updates and Enum state transitions.

---

## 🏗️ 2. Entity Behavior Matrix

Every entity in the system is classified into one of three strict behavior categories. The ORM must apply specific interceptors and guards based on this classification.

### A. 🔒 STRICTLY IMMUTABLE (Append-Only)
*Guards: Block `update()`, Block `delete()`, Allow `create()`, Allow `read()`.*

| Entity | Purpose | Enforcement Rule |
| :--- | :--- | :--- |
| **`LedgerEntry`** | Financial Source of Truth | **HARD BLOCK:** No updates/deletes under any context. |
| **`FinancialSnapshot`** | Monthly Lock | **HARD BLOCK:** Sealed after creation. |
| **`Payslip`** | Staff Payment Record | **HARD BLOCK:** Legal document, never changes. |
| **`LeaseHistory`** | Contract Audit Trail | **HARD BLOCK:** Pure log of past states. |
| **`AuditLog`** | Security Trace | **HARD BLOCK:** Tamper-proof logging. |
| **`TaxDocument`** | Regulatory Filings | **HARD BLOCK:** Legal record. |
| **`UnitAvailabilitySnapshot`** | Vacancy Stats | **HARD BLOCK:** Time-series data. |

### B. ✏️ MUTABLE WITH AUDIT TRAIL
*Guards: Allow `update()` only with `AuditLog` injection. Allow `softDelete()` only.*

| Entity | Mutable Fields | Audit Requirement |
| :--- | :--- | :--- |
| **`UserProfile`** | Phone, Email, Preferences | **MANDATORY:** Log strict "Before/After" diff. |
| **`Property`** | Name, Config | **MANDATORY:** Log actor and changes. |
| **`Unit`** | Status, Features | **MANDATORY:** Log status changes (Vacancy tracking). |
| **`Budget`** | Limits, Categories | **VERSIONED:** Updates create a new version number. |
| **`FAQ` / `Rules`** | Content | **MANDATORY:** Content updates logged. |
| **`Role`** | Permissions | **CRITICAL:** High-severity audit log. |

### C. 🧩 MIXED (STATE + HISTORY)
*Guards: Field-level validation + State Machine enforcement.*

| Entity | Mutable Scope | Guard Logic |
| :--- | :--- | :--- |
| **`Lease`** | `Status`, `EndDate` | **TRANSITION:** Status only moves forward (Draft -> Active -> Terminated). Contract terms are immutable once Active. |
| **`Payment`** | `Status` (Pending->Paid) | **RESTRICTED:** Amount/Payer immutable. Only Status updates allowed from specific System Services. |
| **`RoomAllocation`** | `Status`, `CheckOutDate` | **LOGIC:** Cannot change start date after check-in. |
| **`SupportTicket`** | `Status`, `Priority` | **FLOW:** Resolution requires content in `TicketNote`. |

---

## 🛡️ 3. Immutability Enforcement Strategy

The ORM enforces these rules via **Middleware Interceptors** (Hooks) that run *before* the query hits the database.

### 3.1. The "Immutable Shield" Hook
**Target:** Group A (Strictly Immutable)
**Logic:**
```typescript
onBeforeRequest(op, entity) {
  if (IMMUTABLE_ENTITIES.includes(entity)) {
    if (op === 'UPDATE' || op === 'DELETE' || op === 'UPSERT') {
      throw new FinancialIntegrityError(`Mutation attempt on immutable entity: ${entity}`);
    }
  }
}
```

### 3.2. Role-Aware Write Guards
**Target:** All Entities
**Logic:**
1.  **Tenant Role:**
    *   CANNOT write to `LedgerEntry`, `Property`, `Unit`, `Role`.
    *   CAN ONLY update `UserProfile` (Own) or create `SupportTicket`.
2.  **Admin Role:**
    *   CAN update `Property`, `Unit`, `User`.
    *   **CANNOT** update `LedgerEntry` or `AuditLog` (Even Super Admin cannot mutation history).
3.  **System Service (Bot):**
    *   EXCLUSIVE rights to write `LedgerEntry`, `FinancialSnapshot`, `Payslip`.

### 3.3. Automatic Audit Injection
**Target:** Group B (Mutable)
**Logic:**
*   **Before Update:** Fetch current state (`prevState`).
*   **After Update:** Calculate `diff` = `newState` - `prevState`.
*   **Atomic Write:** In the SAME transaction as the update, insert into `AuditLog`:
    *   `Action`: "UPDATE"
    *   `Entity`: EntityName
    *   `ID`: EntityID
    *   `Diff`: JSON Diff
    *   `Actor`: CurrentUserID

---

## 🚦 4. Migration Rules & Guardrails

The database schema will evolve. These rules prevent data loss or corruption during evolution.

### ✅ Allowed Changes (Safe)
1.  **Additive:** Adding new tables.
2.  **Nullable Columns:** Adding new columns that are Nullable or have Default values.
3.  **Indexes:** Adding performance indexes (non-unique) at any time.
4.  **Enum Expansion:** Adding new values to the END of an Enum list (e.g., new TicketStatus).

### ❌ Forbidden Changes (Unsafe)
1.  **Dropping Financial Tables:** `LedgerEntry`, `Payment`, `Lease` can NEVER be dropped.
2.  **Altering Immutable Types:** Changing `amount` or `currency` columns in `LedgerEntry`.
3.  **History Deletion:** `DELETE FROM` migrations are banned.
4.  **Sequence Resets:** Resetting ID sequences on financial tables.

### 🛡️ Migration Safety Protocol
1.  **Reversibility:** Every `up` migration must have a strictly tested `down` script.
2.  **Backup Trigger:** CI/CD pipeline must trigger a DB snapshot *before* applying migrations.
3.  **Finance Approval:** Migrations touching `Group A` tables require a specific "Financial Safety" approval flag in the deployment pipeline.

---

## ⚡ 5. Transaction & Consistency Rules

Partially completed actions are the enemy of data integrity.

### 5.1. Critical Boundaries
*   **Payment Processing:**
    *   `Payment.update(PAID)` + `LedgerEntry.create(INCOME)` MUST happen in **one atomic transaction**.
    *   If Ledger write fails -> Rollback Payment status to PENDING/FAILED.
*   **Lease Signing:**
    *   `Lease.update(ACTIVE)` + `Unit.update(OCCUPIED)` + `LedgerEntry.create(DEPOSIT)` MUST be atomic.
*   **Monthly Snapshot:**
    *   Reading aggregates + Writing `FinancialSnapshot` MUST optionally lock the Ledger or be idempotent.

### 5.2. Correction Policy
**Rule:** We strictly follow "Accounting Corrections".
*   **Scenario:** Admin entered wrong rent amount ($500 instead of $50).
*   **Wrong Way:** `UPDATE ledger SET amount = 50`. (BLOCKED)
*   **Right Way (ORM Helper):**
    1.  `Transaction.start()`
    2.  `LedgerEntry.create({ type: 'REVERSAL', amount: -500, ref: original_id })`
    3.  `LedgerEntry.create({ type: 'CORRECTION', amount: 50, ref: original_id })`
    4.  `Transaction.commit()`

---

## 🚀 6. Indexing & Performance Plan

### 6.1. High-Velocity Indexes
| Table | Index Columns | Reason |
| :--- | :--- | :--- |
| `ledger_entries` | `(property_id, recorded_at)` | Fast generation of Property financial reports. |
| `ledger_entries` | `(reference_id)` | Instant lookup of "Where did this payment go?". |
| `payments` | `(provider_ref_code)` | **UNIQUE**. Prevents double-spending/duplicate webhooks. |
| `audit_logs` | `(entity_id, entity_model)` | Rapidly showing history for a specific Lease/Unit. |
| `units` | `(property_id, status)` | Fast filtering of "Vacant units in Arena One". |

### 6.2. Partitioning Strategy (Future Scale)
*   **Table:** `audit_logs` & `ledger_entries`
*   **Strategy:** Partition by **Year**.
*   **Benefit:** Keeps indices small and allows archiving old years to cold storage (Read-Only) without affecting current year performance.

---

## 📖 7. Read/Write Separation & Access

### 7.1. Role-Based Access Patterns
*   **Tenants (1000+ users):**
    *   Mostly READ.
    *   Read from: Cache / Replica (Eventual Consistency ok for Property Listings).
    *   Write to: `SupportTickets` (Direct Primary).
*   **Accountants:**
    *   READ-HEAVY (Complex Aggregates).
    *   **Prohibition:** No direct WRITE access to `LedgerEntry`. They trigger "Actions" (e.g., "Approve Invoice") which causes the *System* to write the Ledger.
*   **System (Cron/Webhooks):**
    *   WRITE-HEAVY.
    *   Always targets Primary DB.

### 7.2. Reporting vs. Transactional
*   **OLTP (Transactional):** `LeaseService`, `PaymentService`. Uses Primary DB. Optimized for row-level locks and speed.
*   **OLAP (Reporting):** `FinancialSnapshot`. Should be pre-calculated. Do not run "Sum entirely of Ledger" on the fly for the dashboard. Use the `FinancialSnapshot` table + current month's delta.

---

## 🧹 8. Data Retention & Soft Deletes

### 8.1. Soft Delete Policy
**Mechanism:** `deleted_at` timestamp column.
**Strictly Enforced On:** `Users`, `Properties`, `Units`, `Leases` (Drafts only).
**Logic:**
*   User "deletes" a tenant -> ORM sets `deleted_at = NOW()`.
*   Data remains for relationships (old payments link to "Deleted User").
*   Queries automatically filter `where deleted_at IS NULL` unless explicitly overridden (`includeDeleted: true`).

### 8.2. Permanent Retention (Infinite)
These tables allow **NO DELETION** (Soft or Hard):
1.  `LedgerEntry`
2.  `FinancialSnapshot`
3.  `AuditLog`
4.  `Lease` (Active/Terminated/Expired)
5.  `OfficialDocuments` (Tax, Payslips)

### 8.3. Garbage Collection
*   **Ephemeral Data:** `SystemLog` (Debug logs), `Notification` (Read).
*   **Policy:** Delete after 90 Days via Cron Job (Use `DELETE FROM ...` in batches).

---

## 💥 9. Failure Scenarios & Protections

### 9.1. Webhook Idempotency
*   **Risk:** Payment Gateway sends "Success" webhook twice.
*   **Protection:** ORM enforcing Unique Constraint on `payments.provider_ref_code`.
*   **Handling:**
    *   First Request: Success (200 OK).
    *   Second Request: DB Throws `UniqueViolation`. Application catches -> Logs "Duplicate Webhook" -> Returns 200 OK (to satisfy Gateway) -> Does NOTHING.

### 9.2. Concurrent Booking (Race Condition)
*   **Risk:** Two tenants book Unit A-101 at the same millisecond.
*   **Protection:** `SELECT ... FOR UPDATE` (Pessimistic Locking) in the ORM transaction.
*   **Flow:**
    1.  Txn A locks Unit A-101.
    2.  Txn B attempts lock -> WAITS.
    3.  Txn A sets status `OCCUPIED` -> Commits.
    4.  Txn B acquires lock -> Reads status `OCCUPIED` -> Aborts with "Unit Taken" error.

### 9.3. Partial Outage (Ledger Drift)
*   **Risk:** Payment saved, but Ledger Event failed.
*   **Protection:** **Atomic Transaction**. If Ledger write fails, the Payment `INSERT` rolls back. The system is consistent (No payment, No money). User sees "Error, try again". Better to fail safely than record money that doesn't exist in the ledger.
