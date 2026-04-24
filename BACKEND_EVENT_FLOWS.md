# Backend Event Flows & Logic Blueprint - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Conceptual Logic)  
**References:** `ACCESS_CONTROL_POLICY.md`, `AUTHENTICATION_POLICY.md`

---

## 🎯 GOAL
Define the authoritative backend logic for critical operations, ensuring data integrity, strict RBAC enforcement, and complete auditability key for the Arena Homes platform.

---

## 1. 💵 FINANCIAL FLOWS

### Event: Tenant Rent Payment (Gateway/Mobile Money)
*   **Trigger:** System (via Payment Gateway Webhook) triggered by Tenant action.
*   **Entities:** `Payment`, `LedgerEntry`, `Lease`, `TenantProfile`, `Notification`, `AuditLog`.
*   **Flow Steps:**
    1.  **Initiation:** Tenant requests payment via UI -> System generates `PaymentIntent` (Status: `PENDING`).
    2.  **Processing:** Gateway processes transaction.
    3.  **Confirmation (Webhook):** Gateway hits callback URL with success/failure.
    4.  **Reconciliation:**
        *   System updates `Payment` record status to `COMPLETED`.
        *   **CRITICAL:** System creates immutable `LedgerEntry` (Type: `RENT_INCOME`, Credit).
        *   System updates `Lease` balance.
    5.  **Receipt:** PDF Receipt generated and emailed.
*   **RBAC Enforcement:**
    *   Tenant can only initiate for *their* active lease.
    *   Payment Record updates restricted to `System` (Webhook) or `Admin` (Manual override with flag).
*   **Audit Points:** `Payment.created`, `Payment.status_change`, `LedgerEntry.created`.
*   **Notifications:** Tenant (Receipt), Caretaker (Summary Update), Accountant (if > threshold).
*   **Mutability:** `LedgerEntry` is **IMMUTABLE**. `Payment` metadata is editable by Admin *only* before success.

### Event: Monthly Rent Demand Generation (Automated)
*   **Trigger:** System (Scheduled Job - 1st of Month).
*   **Entities:** `Lease`, `LedgerEntry`, `Invoice`, `Notification`.
*   **Flow Steps:**
    1.  **Query:** Find all `ACTIVE` leases.
    2.  **Loop:** For each lease:
        *   Calculate rent due (Base + Services).
        *   Create `LedgerEntry` (Type: `RENT_DUE`, Debit).
        *   Create `Invoice` record.
        *   Send Email/SMS "Rent is Due".
*   **RBAC Enforcement:** System Internal Process. No human trigger allowed.
*   **Audit Points:** `BatchJob.RentDemand` (Summary of records created).
*   **Mutability:** `LedgerEntry` is **IMMUTABLE**.

### Event: Expense Recording & Budget Allocation
*   **Trigger:** Accountant.
*   **Entities:** `Budget`, `Expense`, `LedgerEntry`, `Plot`.
*   **Flow Steps:**
    1.  **Request:** Accountant submits Expense Claim (e.g., "Plumbing Repair Plot A").
    2.  **Validation:** System checks `Budget` availability for category.
    3.  **Approval:** (Optional) If > Limit, requires Admin Approval.
    4.  **Commit:**
        *   Create `Expense` record in DB.
        *   Create `LedgerEntry` (Type: `EXPENSE`, Debit) linked to `Plot` wallet.
        *   Deduct from `Budget` allocation.
*   **RBAC Enforcement:** Accountant (Create), Admin (Approve if high value). Caretakers CANNOT see backend budget logic.
*   **Audit Points:** `Expense.created`, `Budget.updated`.
*   **Notifications:** Admin (New Expense Alert).

---

## 2. 🏠 PROPERTY & LEASING FLOWS

### Event: New Tenant Application & Lease Generation
*   **Trigger:** Tenant (Application) -> Admin (Approval).
*   **Entities:** `Unit`, `TenantProfile`, `Lease`, `Document (PDF)`.
*   **Flow Steps:**
    1.  **Application:** Tenant applies for Unit. `Unit` status marked `RESERVED` (Temporary hold).
    2.  **Approval:** Admin reviews & approves.
    3.  **Draft:** System generates Lease PDF from Template.
    4.  **Signing:** Tenant digitally signs -> Admin digitally signs.
    5.  **Activation:**
        *   `Lease` status -> `ACTIVE`.
        *   `Unit` status -> `TAKEN`.
        *   `TenantProfile` assigned to `Unit`.
*   **RBAC Enforcement:**
    *   Tenant: Can only apply.
    *   Admin: Final approval authority.
    *   System: Generates contract.
*   **Audit Points:** `Lease.generated`, `Lease.signed`, `Unit.status_change`.
*   **Notifications:** Tenant (Welcome Packet), Caretaker (New Resident Alert).

### Event: Tenant Move-Out / Lease Termination
*   **Trigger:** Tenant (Notice) OR Admin (Eviction).
*   **Entities:** `Lease`, `Unit`, `Refund`, `InspectionReport`.
*   **Flow Steps:**
    1.  **Notice:** Request submitted. `Lease` marked `TERMINATING`.
    2.  **Inspection:** Caretaker inspects unit, submits `InspectionReport` (Damages/Ok).
    3.  **Final Calc:** System calculates generic damages vs deposit.
    4.  **Closure:**
        *   If Refund due: Accountant processes payout.
        *   `Lease` status -> `TERMINATED`.
        *   `Unit` status -> `VACANT` (Available for listing).
*   **RBAC Enforcement:** Caretaker (Inspection), Accountant (Money), Admin (Oversight).
*   **Audit Points:** `Lease.terminated`, `Deposit.refunded`.

---

## 3. 🛠️ OPERATIONAL & SUPPORT FLOWS

### Event: Issue Reporting (Maintenance Ticket)
*   **Trigger:** Tenant.
*   **Entities:** `SupportTicket`, `Unit`, `ChatLog`.
*   **Flow Steps:**
    1.  **Report:** Tenant fills form (Type, Desc, Photo).
    2.  **Routing:** System auto-assigns to the `Caretaker` linked to that Plot.
    3.  **Triage:** Caretaker accepts ticket, sets status `IN_PROGRESS`.
    4.  **Resolution:** Caretaker logs fix, marks `RESOLVED`.
    5.  **Confirmation:** Tenant confirms -> `CLOSED`. (Or Auto-close after 48h).
*   **RBAC Enforcement:**
    *   Tenant: Read/Write own tickets only.
    *   Caretaker: Read/Write tickets for *assigned* plots only.
    *   IT Support: Read tickets (for system bug analysis), cannot modify content.
*   **Audit Points:** `Ticket.created`, `Ticket.status_change`.

### Event: Caretaker Plot Inspection
*   **Trigger:** Caretaker.
*   **Entities:** `InspectionReport`, `Plot`, `Unit`.
*   **Flow Steps:**
    1.  **Check-in:** Warning sent to tenants (if entering units).
    2.  **Log:** Caretaker submits report (Cleanliness, Damages, Safety).
    3.  **Action:** If issues found -> Auto-create Maintenance Tickets.
*   **RBAC Enforcement:** Caretaker limited to assigned Plots.
*   **Notifications:** Admin (Weekly Summary).

---

## 4. 👥 USER & ADMIN FLOWS

### Event: Staff Onboarding (Create Role)
*   **Trigger:** Admin.
*   **Entities:** `AuthUser`, `StaffProfile`.
*   **Flow Steps:**
    1.  **Invite:** Admin enters email + Role (e.g., Caretaker).
    2.  **Profile:** System creates `AuthUser` (Status: `PENDING_SETUP`).
    3.  **Setup:** Email sent with magic link.
    4.  **Activation:** User sets Password + MFA. Status -> `ACTIVE`.
*   **RBAC Enforcement:** Admin ONLY.
*   **Audit Points:** `User.invited`, `Role.assigned`.

### Event: Suspicious Activity Lockout
*   **Trigger:** System (Security Guard).
*   **Entities:** `AuthUser`, `LoginAttempt`, `SecurityAlert`.
*   **Flow Steps:**
    1.  **Detection:** 5 Failed logins OR IP Logic mismatch.
    2.  **Lock:** User Status -> `LOCKED`.
    3.  **Alert:** Email to User, Alert to IT Support Dashboard.
    4.  **Unlock:** Requires Admin override or Password Reset Flow.
*   **RBAC Enforcement:** System Override.
*   **Audit Points:** `User.locked`, `SecurityAlert.created`.

---

## 5. 🤖 CRITICAL SYSTEM AUTOMATION

### Event: Daily Database Backup
*   **Trigger:** System (Cron: 02:00 AM).
*   **Entities:** All Database Tables, encrypted Storage Bucket.
*   **Flow Steps:**
    1.  **Dump:** Stream data to encrypted SQL dump.
    2.  **Upload:** Push to Secure Storage (Off-site).
    3.  **Verification:** Checksum verification.
    4.  **Retention:** Prune backups older than 30 days.
*   **Notifications:** IT Support (On Failure ONLY).

### Event: Monthly Financial Snapshot (Reconciliation)
*   **Trigger:** System (Cron: Last Day of Month).
*   **Entities:** `LedgerEntry`, `FinancialReport`, `Budget`.
*   **Flow Steps:**
    1.  **Freeze:** (Logical) Calculate totals for Month.
    2.  **Generate:** Create `FinancialReport` (Income vs Expenses, Net Profit).
    3.  **Store:** Save JSON/PDF snapshot.
    4.  **Analyze:** Compare actuals vs `Budget` allocations. Flag variances.
*   **Audit Points:** `Report.generated`.
*   **Mutability:** Snapshots are read-only artifacts.

---

## ⚠️ WARNINGS & EDGE CASES

*   **Concurrency:** Payment processing must handle double-webhook firing (Idempotency Key required on Payment Records).
*   **Orphaned Data:** If a Tenant is deleted (Soft Delete), their Ledger & Lease history MUST remain intact for Audit.
*   **Timezones:** Use UTC for all backend Logic/Timestamps. Convert to Kenya Time (EAT) only for UI/Notifications.

---
**End of Backend Flows**
