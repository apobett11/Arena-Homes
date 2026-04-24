# Access Control & Capability Layer - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Authoritative Backend Contract)  
**Scope:** Policy, Authority, & Enforcement Rules

---

## 🚫 HARD RULES (NON-NEGOTIABLE)

1.  **NO DB/API/UI Code:** This document is purely for policy and authority definitions.
2.  **Default Deny:** Any capability not explicitly allowed is **DENIED**.
3.  **Role Fixity:** Only the following roles exist: `Admin`, `Caretaker`, `Accountant`, `IT Support`, `Tenant`, `System`.
4.  **Immutability:** Financial ledgers and audit logs are **APPEND-ONLY**.
5.  **Audit:** Every sensitive action triggers an `AuditLog` entry.

---

## 👥 SYSTEM ROLES & CAPABILITIES

### 👑 ADMIN
**Nature:** System Authority & Oversight.  
**Rule:** Maximum Visibility, Minimal Mutation (of critical records).

**✅ CAN:**
*   **Read Access:** Full view of all system data (Users, Properties, Finances, Logs, Content).
*   **Employee Management:** View status, process payroll, invite/suspend staff accounts.
*   **Property Management:** Create/Edit Plots, assign Caretakers to Plots.
*   **Content:** Post global Announcements, update Rules & FAQs.
*   **Moderation:** Mute/Restrict users, delete violating public messages/listings.
*   **System Configuration:** Edit global settings (e.g., payment gateways, default rules).

**❌ CANNOT:**
*   **Financial Integrity:** Edit `LedgerEntry`, `Payment` records, or historical financial snapshots.
*   **IT Internals:** Access raw server shells or database connections directly via dashboard.
*   **Audit Tampering:** Delete or modify `AuditLog` entries.

---

### 🧑‍🔧 CARETAKER
**Nature:** Operational Manager (Restricted to Assigned Plots).  
**Rule:** Local Authority, No Global Reach.

**✅ CAN:**
*   **Plot Management:** Update Unit status (`VACANT` / `TAKEN`) for *assigned* plots only.
*   **Tenant Ops:** Warn/Evict tenants (requires structured reason), Resolve/Forward tenant issues.
*   **Communication:** Update specific Plot Rules, Chat with Tenants in assigned plots.
*   **View-Only:** View payment summaries for their plots (Status: Paid/Pending/Overdue).

**❌ CANNOT:**
*   **Financials:** Edit `Payment` amounts, Access full `Ledger`, View financial reports.
*   **Escalation:** View data for plots NOT assigned to them.
*   **System:** View System Logs, Delete global announcements.

---

### 💰 ACCOUNTANT / BOOKKEEPER
**Nature:** Financial Integrity & Reporting.  
**Rule:** Observe & Report, Never Rewrite History.

**✅ CAN:**
*   **Financial View:** View ALL financial data (Ledgers, Payments, Invoices, Wallets).
*   **Budgeting:** Create & Version `Budget` plans, Allocate budget to categories.
*   **Reporting:** Generate Balance Sheets, Tax Docs, P&L Reports.
*   **Oversight:** Flag transactions as "Discrepancy" (notifies Admin).
*   **Comm:** Send broadcasts to Caretakers (e.g., "Submit discrepancies").

**❌ CANNOT:**
*   **Ledger Mutation:** Edit/Delete `LedgerEntry` or `Payment` records (VIOLATES AUDITABILITY).
*   **User Admin:** Remove users, Ban tenants.
*   **Tenant Direct:** Direct messaging with Tenants (must go through Caretaker/Admin).

---

### 🖥️ IT SUPPORT
**Nature:** System Health & Reliability.  
**Rule:** Infrastructure focus, Blind to Business Data.

**✅ CAN:**
*   **Diagnostics:** View System Logs (`ErrorLog`, `AccessLog`), Run defined diagnostic scripts.
*   **Integrations:** Monitor API status (M-Pesa, SMS Gateway, Email Service).
*   **Security:** Manage Backups (Trigger/Restore), Monitor Login Attempts/IP blocks.

**❌ CANNOT:**
*   **Privacy:** View Financial Data (`Ledger`, `Payment`), access Tenant Chats/DMs.
*   **Business Ops:** Modify User Roles, Edit Property details, Send Announcements.

---

### 🧑‍🎓 TENANT
**Nature:** Consumer / Renter.  
**Rule:** Self-Service Only.

**✅ CAN:**
*   **Profile:** View own Profile, Update Avatar/Username (Strictly limited).
*   **Lease:** View Lease terms, Download Lease PDF.
*   **Finance:** Make Payments, View own Payment History.
*   **Ops:** Report Issues (Ticket), Chat with Caretaker/Admin (for Support).
*   **Social:** Rate Property (Enabled ONLY after lease end/termination).

**❌ CANNOT:**
*   **Contracts:** Edit Lease terms, Rent amount, or dates.
*   **Mutation:** Edit Payment records.
*   **Privacy:** View other Tenants' data or profiles.
*   **Knowledge Base:** Edit Rules or FAQs.

---

### 🤖 SYSTEM (AUTOMATED)
**Nature:** Trusted Non-Human Actor.  
**Rule:** Deterministic Execution.

**✅ CAN:**
*   **Ledger:** Create `LedgerEntry` (e.g., Rent Due, Payment Received).
*   **Snapshots:** Generate immutable Financial Snapshots.
*   **Docs:** Generate Lease PDFs, Reports, Tax Documents.
*   **Maintenance:** Run Reconciliations, Backups, and Cleanups.
*   **Notification:** Send automated SMS/Email/Push notifications.
*   **Audit:** Write strictly to `AuditLog`.

**❌ CANNOT:**
*   **Impersonation:** Act as a human user.
*   **Manual Override:** Accept manual edits from API endpoints without proper auth.

---

## 🧾 ENTITY-LEVEL PERMISSION MATRIX

| Entity | Action | Allowed Roles | Restrictions / Notes |
| :--- | :--- | :--- | :--- |
| **LedgerEntry** | `READ` | Admin, Accountant, System | Caretakers see summaries only. |
| **LedgerEntry** | `CREATE` | System | **Strictly Automated**. Humans cannot create directly. |
| **LedgerEntry** | `UPDATE` | **NONE** | **IMMUTABLE**. Use Reversal Entries to correct errors. |
| **LedgerEntry** | `DELETE` | **NONE** | **HARD DELETE FORBIDDEN**. |
| **Payment** | `READ` | Admin, Accountant, Caretaker (Assigned), Tenant (Own), System | Caretakers see status only, not full metadata. |
| **Payment** | `CREATE` | Tenant, System (Gateway Webhook) | |
| **Payment** | `UPDATE` | System (Status Update) | Admin/Accountant can only flag, NEVER edit amount. |
| **Lease** | `READ` | Admin, Caretaker (Assigned), Tenant (Own) | |
| **Lease** | `CREATE` | System (Auto), Admin | Generated based on Template. |
| **Lease** | `UPDATE` | Admin | Only before signing. After signing, requires Amendment. |
| **Budget** | `READ` | Admin, Accountant | |
| **Budget** | `CREATE` | Accountant | |
| **Budget** | `UPDATE` | Accountant | Versioned updates only. |
| **AuditLog** | `READ` | Admin, IT Support, System | |
| **AuditLog** | `CREATE` | **ALL** (Implicit) | Application logic must log critical actions. |
| **AuditLog** | `UPDATE` | **NONE** | **TAMPER-PROOF**. |
| **AuditLog** | `DELETE` | **NONE** | **FOREVER RETENTION**. |
| **Property** | `READ` | **ALL** (Public fields), Admin (Full) | |
| **Property** | `CREATE` | Admin | |
| **Property** | `UPDATE` | Admin, Caretaker (Limited to Status) | Caretaker can update availabilities, not structural data. |
| **Unit** | `READ` | **ALL** | |
| **Unit** | `UPDATE` | Admin, Caretaker (Status: Vacant/Taken) | |
| **SupportTicket**| `READ` | Admin, Caretaker (Assigned), Tenant (Own) | |
| **SupportTicket**| `CREATE` | Tenant, Caretaker | |
| **SupportTicket**| `UPDATE` | Admin, Caretaker, Tenant (Close own) | Caretaker can Resolve. |

---

## 🔒 ENFORCEMENT RULES (MANDATORY)

1.  **Authorization Middleware:**
    *   Every API endpoint affecting these entities MUST validate: `(User.Role ∈ AllowedRoles)` AND `(Resource.Owner == User OR User.Scope == Global)`.
    *   Example: A Caretaker requesting `GET /api/plots/:id/units` must check is `Caretaker.assignedPlotIds.includes(id)`.

2.  **Silent Update Prevention:**
    *   `updatedAt` timestamps MUST be handled by the Database/System, never the Client.
    *   For `Ledger` and `AuditLog`, `UPDATE` permissions are strictly revoked at the database user level if possible.

3.  **Financial Integrity:**
    *   Ledgers are Append-Only. To "fix" a transaction, a new entry (Credit/Debit) must be created referencing the original.
    *   **NO** over-writing of amounts.

4.  **Audit Trail:**
    *   **REQUIRED:** `ActorID`, `Action`, `TargetEntity`, `TargetID`, `Timestamp`, `IPAddress`, `UserAgent`.
    *   Fail-safe: If AuditLog write fails, the entire transaction MUST roll back.

5.  **Soft Deletes:**
    *   `Users`, `Properties`, `Leases` are never `DELETE`d. Use `deletedAt` timestamp or `status = ARCHIVED`.

---

## ⚠️ SECURITY WARNINGS

*   **Conflict Resolution:** If a "Convenient Feature" conflicts with these rules (e.g., "Let Caretaker edit rent price for quick fix"), the feature is **REJECTED**. Security > Convenience.
*   **System Role:** The `System` role instructions must be kept in secure, server-side environment variables/logic only. It represents the "Superuser" of the backend code.
*   **IT Support Limitation:** IT Support has `READ` on logs but `NO ACCESS` to PII (Personally Identifiable Information) inside the DB columns (e.g., Salaries, Lease details) unless masked.

---
**End of Contract**
