# Backend Service Layer Map - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Conceptual Blueprint)  
**References:** `ACCESS_CONTROL_POLICY.md`, `BACKEND_EVENT_FLOWS.md`

---

## 🎯 GOAL
Define the conceptual Service Architecture that bridges the Data Model and Event Flows. This map acts as the strict specification for API development, ensuring that every logical operation enforces the defined RBAC, Audit, and Integrity rules.

---

## 🏗️ SERVICE DEFINITIONS

### 1. 🔐 AuthService
**Responsibility:** Identity verification, Session management, Security enforcement.
*   **Entities:** `AuthUser`, `Session`, `RefreshToken`, `LoginAttempt`.
*   **Owner:** System / Admin.
*   **Key Logic:**
    *   Validates Credentials -> Issues JWT + Refresh Token.
    *   Tracks Failed Attempts -> Locks Account.
    *   Enforces MFA for High-Privilege Roles.

### 2. 💳 PaymentService
**Responsibility:** Handling of incoming money, Gateway integrations, and Payment State machine.
*   **Entities:** `Payment`, `PaymentIntent`, `Wallet`.
*   **Owner:** System (Automated).
*   **Key Logic:**
    *   Generates Signatures for Payment Gateway.
    *   **CRITICAL:** Handles Webhooks securely (Idempotency check).
    *   Triggers `LedgerService` on specific status changes (`COMPLETED`).

### 3. 📒 LedgerService
**Responsibility:** The **Immutable** Source of Truth for all financial movements.
*   **Entities:** `LedgerEntry`, `FinancialSnapshot`.
*   **Owner:** System (Strict Control).
*   **Key Logic:**
    *   **Append-Only:** No update/delete methods exist. Only `createEntry` and `createReversal`.
    *   Calculates Balances dynamically or via cached Snapshots.
    *   Enforces Budget limits (prevents overdrafts if configured).

### 4. 📜 LeaseService
**Responsibility:** Contract lifecycle, Tenant onboarding, and Occupancy logic.
*   **Entities:** `Lease`, `TenantProfile`, `Document`.
*   **Owner:** Admin.
*   **Key Logic:**
    *   Converts `Application` -> `Draft Lease` -> `Active Lease`.
    *   Triggers `Unit` status updates (`VACANT` <-> `TAKEN`).
    *   Generates PDF Contracts via Template Engine.

### 5. 🛠️ TicketService (Maintenance)
**Responsibility:** Issue tracking, routing, and resolution workflows.
*   **Entities:** `SupportTicket`, `ChatLog`.
*   **Owner:** Caretaker.
*   **Key Logic:**
    *   Auto-routes tickets to the `Caretaker` assigned to the `Unit`'s Plot.
    *   Tracks status transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`).
    *   Escalates stuck tickets to Admin after 48h.

### 6. 🏘️ PropertyService
**Responsibility:** Management of physical assets (Plots, Units).
*   **Entities:** `Plot`, `Unit`, `Inventory`.
*   **Owner:** Admin / Caretaker (Limited).
*   **Key Logic:**
    *   Maintains Unit Availability index.
    *   Links `Caretakers` to `Plots` (Assignment Logic).

### 7. 🔔 NotificationService
**Responsibility:** Centralized dispatch of communications.
*   **Entities:** `Notification(Log)`, `SMSGateway`, `EmailProvider`.
*   **Owner:** System.
*   **Key Logic:**
    *   Abstracts providers (e.g., switch SMS vendors easily).
    *   Respects User Preferences (DND, Channel selection).

---

## 🔌 API CONTRACTS (CONCEPTUAL)

| Service | Endpoint / Action | Trigger Role | Input | Output | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST /login` | Any | Email, Password | Session, RefreshToken | Log `LoginAttempt` (Success/Fail). |
| **Auth** | `POST /refresh` | Any | RefreshToken | New Session | Rotate RefreshToken. Check Reuse. |
| **Payment**| `POST /pay/initiate`| Tenant | Amount, Reason, LeaseID | PaymentIntent (Hash) | - |
| **Payment**| `POST /webhook` | **Gateway IP Only** | Generic Payload | 200 OK | **CRITICAL:** Verify Signature. Update Payment State. |
| **Ledger** | `GET /ledger/summary`| Admin/Accountant| DateRange, PlotID | JSON Summary | Read-Only. Aggregated Data. |
| **Lease** | `POST /lease/apply` | Tenant | UnitID, UserDocs | ApplicationID | - |
| **Lease** | `PUT /lease/:id/sign`| Tenant | DigitalSignature | Lease Object | Log `LeaseSigned`. Update Unit Status. |
| **Ticket** | `POST /tickets` | Tenant | Desc, Category, Photo | TicketID | Notify Assigned Caretaker. |
| **Ticket** | `PUT /tickets/:id/resolve`| Caretaker | ResolutionNotes | Ticket Object | Notify Tenant. |
| **Admin** | `POST /users/invite`| Admin | Email, Role, PlotID | UserObject | Log `StaffInvited`. Send Email. |

---

## 🤖 AUTOMATED JOBS & SYSTEM PROCESSES

### 1. 🗓️ Monthly Rent Demand (Cron)
*   **Trigger:** 1st of Month, 00:00.
*   **Service:** `LeaseService` -> `LedgerService` -> `NotificationService`.
*   **Logic:**
    1.  Select all `ACTIVE` Leases.
    2.  For each, Calculate Rent.
    3.  `LedgerService.createEntry(DEBIT, LeaseAccount, RentAmount)`.
    4.  `NotificationService.send(Tenant, "Rent Due")`.
*   **Audit:** Batch Job Log.

### 2. 📊 Financial Reconciliation (Event/Cron)
*   **Trigger:** End of Month OR Post-Payment Event.
*   **Service:** `LedgerService` -> `AccountingService`.
*   **Logic:**
    1.  Sum all Credits/Debits per Plot.
    2.  Compare with Gateway Expected Settlements.
    3.  Generate `FinancialSnapshot` (Status: `LOCKED`).
*   **Audit:** `SnapshotGenerated`.

### 3. 💾 Data Backup (Cron)
*   **Trigger:** Daily, 03:00 AM.
*   **Service:** `SystemService`.
*   **Logic:**
    1.  Dump DB to Encrypted File.
    2.  Upload to S3/Cloud Storage.
    3.  Verify Checksum.

---

## 🔄 SERVICE INTERACTIONS (FLOW MAPPING)

### Scenario: Successful Rent Payment
1.  **Gateway** calls `PaymentService.webhook(payload)`.
2.  **PaymentService** verifies signature -> Updates `Payment.status = PAID`.
3.  **PaymentService** calls `LedgerService.recordIncome(PaymentID)`.
    *   *Constraint:* `LedgerService` checks if already recorded (Idempotency).
    *   *Action:* Creates `LedgerEntry` (Credit).
4.  **PaymentService** calls `NotificationService.sendReceipt(Tenant)`.
5.  **PaymentService** calls `NotificationService.notifyCaretaker(PlotID)`.
6.  **AuditLogger** records `Payment.success`.

### Scenario: Maintenance Ticket Creation
1.  **Tenant** calls `TicketService.create(ticketData)`.
2.  **TicketService** queries `PropertyService` -> Get `CaretakerID` for `Unit.Plot`.
3.  **TicketService** saves Ticket -> Assigns to `CaretakerID`.
4.  **TicketService** calls `NotificationService.alert(CaretakerID, "New Ticket")`.

---

## ⚠️ ERROR HANDLING & EDGE CASES

### 1. 💸 Rolling Back Transactions
*   **Concept:** Since `Ledger` is Immutable, we cannot "Delete" an entry on error.
*   **Solution:** If a sub-step fails (e.g., Notification fails after Ledger write), the transaction is considered "Complete with Warning".
*   If the Financial entry itself was wrong, `LedgerService` must issue a **Correction Entry** (Inverse value) automatically.

### 2. 📡 External Service Failure (Gateway/SMS)
*   **Retry Logic:** Use a Message Queue (e.g., Redis/RabbitMQ) for Notifications and Webhooks.
*   **Policy:** Retry with exponential backoff (1m, 5m, 15m) up to 3 times. Then Dead Letter Queue (Alert Admin).

### 3. 🔒 Race Conditions
*   **Issue:** Two tenants booking the same Unit via API simultaneously.
*   **Solution:** `PropertyService` must use **Database Row Locking** (Atomic Transaction) when checking `Unit.status == VACANT`.
    *   Request A locks row. Request B waits. Request A updates to `TAKEN`. Request B sees `TAKEN` and fails.

---
**End of Service Map**
