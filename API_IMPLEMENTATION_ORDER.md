# API Implementation Order & Write-Path Governance
**Version:** 1.0.0
**Status:** Approved for Implementation
**Target System:** Egerton University Student Housing Platform

---

## 🏗️ 1. API Implementation Order

The implementation is strictly phased. **Phase N must be fully tested and audited before moving to Phase N+1.** This prevents "feature creep" from introducing security holes in foundational layers.

### Phase 1: Identity & Security (The Fortress)
*Foundational. No data can be accessed without this.*
*   **Goal:** Secure the door before building the house.
*   **Endpoints:**
    *   `POST /auth/login`: Issue JWT + HttpOnly Session Cookie.
    *   `POST /auth/refresh`: Rotate Refresh Tokens.
    *   `POST /auth/logout`: Invalidate Session.
    *   `POST /auth/mfa/challenge` & `verify`: For Admins/Staff.
    *   `GET /auth/me`: Resolve current User permissions.
*   **Why First?** Every subsequent API depends on the `req.user` and `req.permissions` context established here.

### Phase 2: Core Read APIs (Public & Safe)
*Low risk. Exposing data that is already public.*
*   **Goal:** Enable the frontend to display the "Shop Window".
*   **Endpoints:**
    *   `GET /public/listings`: Filterable list of Vacant units.
    *   `GET /public/properties/:id`: Details, amenities, location.
    *   `GET /public/faqs`: Static help content.
    *   `GET /public/rules`: Community regulations.
*   **Why Second?** These are read-only and require zero complex write logic or locking. Safe to test scalability here.

### Phase 3: Financial Entry Points (High Risk)
*The flow of money. Critical isolation required.*
*   **Goal:** Capture revenue safely.
*   **Endpoints:**
    *   `POST /payments/initiate` (Tenant): Creates a `PaymentIntent`. Does NOT touch the Ledger.
    *   `POST /webhooks/gateways/:provider` (System): **The only way payment status changes.** Verifies signatures, updates `Payment`, and triggers the internal `LedgerService`.
*   **Why Third?** We need money flowing before we manage occupancy. This phase establishes the "Hard Shell" around the specific `Ledger` table—ensuring *only* the webhook handler can indirectly trigger a write.

### Phase 4: Leasing & Occupancy (Contractual)
*Binding users to units.*
*   **Goal:** Legal association and inventory management.
*   **Endpoints:**
    *   `POST /leases/apply`: Submit Tenant Docs.
    *   `POST /leases/:id/sign`: Digital Reference recording. Locks the Unit.
    *   `GET /leases/me`: Tenant view of their contract.
*   **Why Fourth?** Requires robust Auth (Phase 1) and often requires payments (Phase 3) for deposits.

### Phase 5: Operations & Support (Workflow)
*Day-to-day management.*
*   **Goal:** Maintenance and communication.
*   **Endpoints:**
    *   `POST /tickets`: Tenant reports issue.
    *   `POST /tickets/:id/comment`: Append-only chat.
    *   `PUT /tickets/:id/status`: Caretaker updates (assigned plots only).
*   **Why Fifth?** Depends on Leases (Phase 4) to know which Tenant belongs to which Unit/Plot.

### Phase 6: Administrative Oversight (Managerial)
*God-mode controls (restricted).*
*   **Goal:** Staff management and master data.
*   **Endpoints:**
    *   `POST /admin/users/invite`: Onboard staff.
    *   `PUT /admin/properties`: Edit physical assets.
    *   `POST /admin/announcements`: Broadcasts.
*   **Why Sixth?** Complex validation rules needed. We don't want Admins creating entities that break downstream logic until that logic is stable.

### Phase 7: Reporting & Analytics (Read-Only)
*Insight generation.*
*   **Goal:** Financial reconciliation and health checks.
*   **Endpoints:**
    *   `GET /reports/financial/monthly`: Aggregated from Snapshots.
    *   `GET /admin/audit-logs`: Security review.
*   **Why Last?** Needs data from all previous phases to be useful.

---

## 🔒 2. Write-Path Ownership Matrix

This matrix defines the **ONLY** authorized writers for critical entities. If a Service is not listed, it **CANNOT** write to that entity.

| Entity | Allowed Writer (Role/Service) | Write Type | Notes |
| :--- | :--- | :--- | :--- |
| **`LedgerEntry`** | **System Service ONLY** | `INSERT` | Triggered by Webhooks or Rent Cron. NEVER exposed to API. |
| **`FinancialSnapshot`** | **System Service ONLY** | `INSERT` | Triggered by Monthly Lock CronJob. |
| **`Payment`** | **Tenant** (Create), **System** (Update Status) | `INSERT`, `UPDATE` | Tenant creates intent. Webhook updates status. |
| **`Lease`** | **System** (Create), **Admin** (Approve) | `INSERT`, `UPDATE` | System generates from Application. Admin approves to `ACTIVE`. |
| **`LeaseHistory`** | **System Middleware** | `INSERT` | Auto-generated on any Lease amendment. |
| **`AuditLog`** | **System Middleware** | `INSERT` | Auto-injected on ANY mutable action. |
| **`Unit`** | **Admin**, **System** (Status) | `UPDATE` | System toggles `VACANT`/`OCCUPIED`. Admin edits hardware details. |
| **`SupportTicket`** | **Tenant**, **Caretaker** | `INSERT`, `UPDATE` | Tenant opens. Caretaker resolves. |
| **`TicketNote`** | **Tenant**, **Caretaker** | `INSERT` | Append-only conversation. |
| **`UserProfile`** | **User** (Self), **Admin** | `UPDATE` | User edits phone/email. Admin edits role/ban status. |

---

## 🛡️ 3. Guarded Endpoint Classes

### A. Public Read (Tier 4 - Lowest Risk)
*   **Access:** Anonymous.
*   **Restrictions:** Rate-limited (e.g., 60 req/min). No writes.
*   **Examples:**
    *   `GET /public/listings`
    *   `GET /public/health` (System status)

### B. Authenticated Read (Tier 3)
*   **Access:** `Valid Session` + `RBAC Check`.
*   **Restrictions:** Reads scoped to User's data (Tenant sees *their* lease, not others).
*   **Examples:**
    *   `GET /leases/me`
    *   `GET /tickets/my-history`

### C. Guarded Write (Tier 2 - High Risk)
*   **Access:** `Valid Session` + `RBAC` + `Ownership/Assignment Check`.
*   **Restrictions:**
    *   Transactional (All or nothing).
    *   **MUST** produce an `AuditLog`.
    *   Input strictly validated (Zod/Joi).
*   **Examples:**
    *   `POST /tickets` (Tenant must have active lease).
    *   `PUT /properties/:id` (Admin must have privileges).

### D. System-Only (Tier 1 - Critical)
*   **Access:** `Internal VPC` or `Signed Webhook` ONLY.
*   **Restrictions:** NEVER accessible from public internet / frontend. Protected by IP Isolation or HMAC signatures.
*   **Examples:**
    *   `POST /webhooks/mpesa`
    *   `POST /cron/monthly-rent`

---

## 🚫 4. Forbidden API Patterns

If you implement these, you violate the security model.

### ❌ 1. The "God" Update Endpoint
*   **Forbidden:** `PUT /api/ledger/:id` or `POST /api/financial-edits`
*   **Why:** Financial history is immutable. Use "Clarification/Reversal" entries via specific System flows instead.

### ❌ 2. The "Trusting" Client Endpoint
*   **Forbidden:** `POST /api/finalize-rent { amount: 5000 }`
*   **Why:** Never trust the client to tell you how much to charge. The Backend calculates the amount based on the Lease ID.

### ❌ 3. The "Soft" Delete on Hard Data
*   **Forbidden:** `DELETE /api/payments/:id`
*   **Why:** Payments are never deleted. Even failed ones remain as records.

### ❌ 4. Admin "Backdoor" for Tenants
*   **Forbidden:** Allows Admin to `POST /api/tickets` *on behalf of* a Tenant without explicit "On-Behalf-Of" flagging in the Audit Log.
*   **Why:** Breaks chain of custody. If an Admin acts for a user, the Audit Log MUST say `Actor: Admin, Target: Tenant`.

---

## 🤝 5. Frontend Integration Contract

Frontend developers must adhere to these rules:

1.  **Assume Nothing is Instant:**
    *   Writes (especially Payments/Leases) are **Eventual**.
    *   *Frontend:* Show "Processing..." -> Poll for status or wait for Webhook/Socket push.
    *   *Backend:* Returns `202 Accepted` for async tasks.
2.  **No Financial Math:**
    *   Frontend displays strings received from Backend: `"KES 5,000.00"`.
    *   Frontend *never* calculates `Rent + Penalty`. It asks `GET /invoices/preview`.
3.  **Handle 403 vs 404:**
    *   Secure endpoints return `404 Not Found` instead of `403 Forbidden` if the user *shouldn't even know the resource exists* (e.g., accessing another Tenant's lease).
4.  **Idempotency Keys:**
    *   Vital forms (Payment, Lease Sign) MUST send a UUID `Idempotency-Key` header to prevent double-billing on network retry.

---

## ⚡ 6. Transaction & Failure Safety

### 🔄 Idempotency
*   **Rule:** All Tier 2 & Tier 1 (Write) endpoints must support Idempotency.
*   **Mechanism:** Cache the `Idempotency-Key` + `Response` for 24h. If a request is retried, return the cached response without re-executing logic.

### 🛑 Atomic Transactions (All-or-Nothing)
*   **Scenarios requiring Atomicity:**
    1.  **Lease Sign:** `Lease(ACTIVE)` + `Unit(OCCUPIED)` + `Ledger(DEPOSIT)`.
    2.  **Ticket Resolve:** `Ticket(RESOLVED)` + `Notification(SENT)`.
*   **Failure Mode:** If *any* step fails, the Database Transaction `ROLLBACK` is triggered. No "Zombie" data (e.g., Unit marked occupied but no active lease).

### 📡 Network Partitions
*   **Scenario:** Webhook received, DB write succeeds, but external SMS notification fails.
*   **Strategy:** "Forward Recovery". The transaction commits (Money is safe). The Notification is pushed to a **Dead Letter Queue (DLQ)** for retry. We prioritized Data Integrity over Notification Delivery.
