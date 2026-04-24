# Conceptual API Endpoint Map - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Conceptual Integration Contract)  
**References:** `BACKEND_SERVICE_MAP.md`, `ACCESS_CONTROL_POLICY.md`, `AUTHENTICATION_POLICY.md`

---

## 🎯 GOAL
Define the high-level API contracts for the Arena Homes platform. This document serves as the interface agreement between Frontend and Backend, ensuring every request routes to the correct Service, enforces strict RBAC, and triggers necessary Audit/Notification flows.

---

## 1. 🔐 AUTHENTICATION & USER MANAGEMENT

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /auth/login` | `AuthService` | Public | **In:** Email, Password<br>**Out:** SessionToken (Full or Partial), RefreshToken | `AuthUser`, `Session`, `LoginAttempt` | **Log:** LoginAttempt (Success/Fail). **Lockout:** Check failed attempts. |
| `POST /auth/mfa/verify` | `AuthService` | Public (Partial Session) | **In:** TOTP Code, PartialToken<br>**Out:** Full SessionToken | `AuthUser` | **Constraint:** Only for roles with MFA enabled (Admin/Accountant). |
| `POST /auth/refresh` | `AuthService` | Public | **In:** RefreshToken<br>**Out:** New SessionToken, New RefreshToken | `Session`, `RefreshToken` | **Security:** Rotate token family. Revoke all if reuse detected. |
| `POST /auth/logout` | `AuthService` | Auth User | **In:** SessionToken<br>**Out:** Success | `Session` | **Action:** Invalidate Session and associated RefreshToken. |
| `POST /auth/password/reset-req` | `AuthService` | Public | **In:** Email<br>**Out:** Success (Generic) | `PasswordResetRequest` | **Note:** Silent failure if email not found (prevent enumeration). |
| `GET /users/me` | `AuthService` | Auth User | **In:** Token<br>**Out:** UserProfile, Roles, Permissions | `AuthUser` | **Cache:** Short-term caching allowed. |
| `PATCH /users/me/avatar` | `AuthService` | Auth User | **In:** ImageURL<br>**Out:** UpdatedProfile | `AuthUser` | **Audit:** ProfileUpdate. |

---

## 2. 🏠 PUBLIC LISTINGS & SEARCH

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /listings` | `PropertyService` | Public | **In:** Filters (Price, Location, Type, Vacancy)<br>**Out:** List<PropertySummary> | `Plot`, `Unit` | **Perf:** Read from Read-Replica or Cache. |
| `GET /listings/:id` | `PropertyService` | Public | **In:** ID<br>**Out:** PropertyDetail, UnitTypes, PublicAmenities | `Plot`, `Unit` | **Restriction:** Do NOT return private remarks or tenant info. |

---

## 3. 🧑‍🎓 TENANT OPERATIONS

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /tenants/lease/apply` | `LeaseService` | Tenant | **In:** UnitID, Docs(ID, UnivLetter)<br>**Out:** AppID | `Application`, `Unit` | **Locking:** Optimistic lock on Unit (Temp Reserved). |
| `GET /tenants/lease/current` | `LeaseService` | Tenant | **In:** Token<br>**Out:** LeaseObject, Balance, Status | `Lease`, `Ledger` | - |
| `PUT /tenants/lease/sign` | `LeaseService` | Tenant | **In:** DigitalSignatureHash<br>**Out:** SignedLeaseURL | `Lease`, `Document` | **Audit:** `LeaseSigned`. **Notify:** Caretaker/Admin. |
| `POST /tenants/payments` | `PaymentService` | Tenant | **In:** Amount, Phone/Method<br>**Out:** PaymentIntent (Instruction) | `PaymentIntent` | **Note:** Triggers STK Push or generates Paybill Instructions. |
| `GET /tenants/payments/history`| `LedgerService`| Tenant | **In:** DateRange<br>**Out:** List<PaymentReceipt> | `LedgerEntry` | **Restriction:** Own records only. |
| `POST /tenants/tickets` | `TicketService` | Tenant | **In:** Category, Desc, Photo<br>**Out:** TicketID | `SupportTicket` | **Notify:** Auto-route to assigned Caretaker. |
| `GET /tenants/tickets` | `TicketService` | Tenant | **In:** StatusFilter<br>**Out:** List<Ticket> | `SupportTicket` | - |

---

## 4. 🧑‍🔧 CARETAKER OPERATIONS

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /caretaker/dashboard` | `PropertyService` | Caretaker | **In:** -<br>**Out:** OccStats, OpenTickets, PendingTasks | `Unit`, `Ticket` | **Scope:** Assigned Plots ONLY. |
| `PATCH /caretaker/units/:id` | `PropertyService` | Caretaker | **In:** Status (VACANT/CLEANING)<br>**Out:** Success | `Unit` | **Audit:** `UnitStatusChange`. **Constraint:** Cannot change Rent/Structure. |
| `GET /caretaker/tenants` | `LeaseService` | Caretaker | **In:** PlotID<br>**Out:** List<TenantSummary> | `TenantProfile` | **Privacy:** Name/Phone/Unit only. No sensitive PII. |
| `PATCH /caretaker/tickets/:id`| `TicketService` | Caretaker | **In:** Status, ResolutionNote<br>**Out:** Success | `SupportTicket` | **Notify:** Tenant (Issue Resolved). |
| `POST /caretaker/notify/plot` | `NotifyService` | Caretaker | **In:** PlotID, Message<br>**Out:** CountSent | `Notification` | **Audit:** `BroadcastSent`. **Scope:** Tenants in assigned Plot only. |

---

## 5. 💰 ACCOUNTING & FINANCE

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /finance/ledger` | `LedgerService` | Accountant | **In:** Filters, PlotID<br>**Out:** List<LedgerEntry> | `LedgerEntry` | **Immutable:** Read-Only view. |
| `POST /finance/budgets` | `AccountingService`| Accountant | **In:** PlotID, Category, Amount<br>**Out:** BudgetID | `Budget` | **Audit:** `BudgetAllocated`. |
| `POST /finance/discrepancy` | `AccountingService`| Accountant | **In:** TransactionID, Note<br>**Out:** FlagID | `DiscrepancyLog`| **Notify:** Admin. **Action:** Does NOT alter ledger, just flags it. |
| `POST /finance/reports/generate`| `AccountingService`| Accountant | **In:** Type (BS/PL), Month<br>**Out:** PDFDownloadURL | `FinancialReport`| **Background Job:** Large reports gen async. |

---

## 6. 👑 ADMIN OPERATIONS

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /admin/users/staff` | `AdminService` | Admin | **In:** Email, Role, AccessScope<br>**Out:** StaffUser | `AuthUser` | **Audit:** `StaffCreated`. **Notify:** Invite Email. |
| `PATCH /admin/users/:id/lock` | `AdminService` | Admin | **In:** Reason<br>**Out:** Success | `AuthUser` | **Audit:** `UserLocked`. |
| `POST /admin/plots` | `PropertyService` | Admin | **In:** Name, Location, Meta<br>**Out:** PlotID | `Plot` | - |
| `PUT /admin/plots/:id/caretaker`| `PropertyService`| Admin | **In:** CaretakerID<br>**Out:** Success | `Plot` | **Action:** Reassigns responsibility. |
| `POST /admin/announcements` | `NotifyService` | Admin | **In:** Audience (All/Group), Msg<br>**Out:** Success | `Announcement` | **Audit:** `GlobalBroadcast`. |

---

## 7. 🖥️ IT SUPPORT & SYSTEM

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /system/logs/audit` | `SystemService` | IT Support | **In:** Filters (User, Action, Time)<br>**Out:** List<AuditLog> | `AuditLog` | **Privacy:** PII masked in viewing. |
| `POST /system/backup/trigger` | `SystemService` | IT Support | **In:** -<br>**Out:** JobID | `BackupJob` | **Audit:** `ManualBackup`. **Async Job**. |
| `GET /system/health` | `SystemService` | IT/System | **In:** -<br>**Out:** Status (DB, Cache, Integrations)| - | **Use:** Monitoring dashboards. |

---

## 8. 🤖 SYSTEM & AUTOMATION (WEBHOOKS/CRON)

| Endpoint | Service | Trigger | Input / Output | Entities | Audit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /webhooks/payments` | `PaymentService` | Gateway | **In:** SignedPayload<br>**Out:** 200 OK | `Payment`, `Ledger` | **Security:** Verify Signature. **Idempotency:** Required. |
| `CRON: GenerateRent` | `LeaseService` | Scheduler | **In:** Date<br>**Out:** CountGenerated | `LedgerEntry` | **Action:** Auto-debit Rent accounts on 1st of month. |
| `CRON: FinancialSnapshot`| `LedgerService` | Scheduler | **In:** Date<br>**Out:** SnapshotID | `FinancialSnapshot`| **Immutability:** Locks month's data state. |

---

## ⚠️ ERROR HANDLING & EDGE CASES

1.  **Concurrency:**
    *   **Room Booking:** If two tenants call `POST /lease/apply` for the last Unit, the database must use `ROW LOCKING` or `Optimistic Concurrency Control` (check `version` field). First wins, second receives `409 Conflict`.
2.  **Payment Failures (Async):**
    *   If `PaymentIntent` succeeds but Webhook is delayed, User status remains `PENDING`.
    *   Frontend should poll `GET /tenants/payments/:id` or wait for WebSocket push.
3.  **Lease Expiry:**
    *   Tenant calls to `POST /tickets` or `POST /payments` for an *Expired* lease should be rejected or flagged as "Arrears Payment" depending on business logic. 
    *   Service must check `Lease.status == ACTIVE`.

---
**End of API Contract**
