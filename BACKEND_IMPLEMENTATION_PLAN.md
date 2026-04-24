# BACKEND IMPLEMENTATION PLAN

**STATUS: APPROVED**
**TARGET: ALL BACKEND DEVELOPERS & AI AGENTS**
**ENFORCEMENT: STRICT**

This document serves as the **Operational Constitution** for the backend implementation of the Arena Homes platform. It converts the agreed-upon architecture into a linear, non-negotiable execution plan. Compliance with this document is mandatory for all code merged into the `main` branch.

---

## 1. Repository & Folder Structure

The backend will reside in a dedicated root directory (e.g., `arena-server` or `backend`). The internal structure MUST adhere to the following layout to enforce modularity and dependency rules.

### **Directory Layout**

```text
src/
├── modules/                # DISTINCT DOAMINS (Feature Vertical)
│   ├── auth/               # Identity, Sessions, JWTs
│   ├── users/              # User Profiles, Roles, Hierarchy
│   ├── units/              # Physical Properties, Rooms, Assets
│   ├── leases/             # Lease Agreements (State Machine)
│   ├── billing/            # Invoices, Payments, Tax
│   ├── ledger/             # IMMUTABLE Financial Records (Double Entry)
│   └── audit/              # Global Audit Logging
├── infrastructure/         # TECHNICAL FOUNDATIONS (Horizontal)
│   ├── database/           # Connection Logic
│   ├── orm/                # Base Entities, Repositories
│   ├── migrations/         # Schema Version Control
│   └── locking/            # Redis/DB Pessimistic Locks
├── shared/                 # UTILITIES & CONTRACTS
│   ├── errors/             # Standardized AppErrors
│   ├── guards/             # RBAC & Auth Guards
│   ├── validators/         # Zod Schemas / Input Validation
│   └── transactions/       # Transaction Managers (UnitOfWork)
├── api/                    # ENTRY POINTS
│   ├── routes/             # Express/Fastify Routes
│   ├── controllers/        # Request Handlers (Thin Layer)
│   └── middlewares/        # Global Interceptors
└── config/                 # Environment Variables & constants
```

### **Dependency Rules (Strict)**
1.  **Modules cannot import other Modules directly.** Communication must occur via public Interfaces/Services exported from the module's root `index.ts`.
2.  **Infrastructure cannot import Modules.** Infrastructure is content-agnostic.
3.  **Shared cannot import Modules or Infrastructure.** It must remain utilizing pure functions and standard libraries.
4.  **API imports Modules.** The API layer orchestrates modules but contains no business logic.

---

## 2. Implementation Phases (MANDATORY ORDER)

Development must proceed in strict linear phases. **No skipping ahead.** Barriers must be cleared before moving to the next phase.

### **PHASE 1: Identity & Security Foundation**
*Objective: Secure the perimeter and establish identity.*
*   **Authentication**: Login, Register, Password Reset, MFA stub.
*   **Authorization**: RBAC Middleware loaded from `ACCESS_CONTROL_POLICY`.
*   **Session Handling**: Secure HTTP-only cookies, Refresh Token rotation.
*   **Audit Middleware**: Global interceptor that records *who* did *what*.
*   **Gate Condition**: No API endpoint works without a valid session (except public login/register).

### **PHASE 2: Core Domain (Non-Financial)**
*Objective: Model the physical reality and relationships.*
*   **Units**: Create, Update, Listing management.
*   **Tenants / Users**: Profile management, relationship to Units.
*   **Leases**: Lease generation, digital signing flow, State Machine (Draft -> Active -> Terminated).
*   **Locking**: Implement pessimistic locking for checkouts/reservations to prevent double-booking.
*   **Constraint**: NO money handling, NO invoices, NO ledger entries in this phase.

### **PHASE 3: Billing & Ledger (High Risk)**
*Objective: The immutable financial core.*
*   **Ledger**: Create the `LedgerEntry` table (Append-Only).
*   **Invoices**: Generation based on Lease terms.
*   **Payments**: Payment Intents (Stripe/Paystack integration points), Webhook handlers.
*   **Corrections**: Refund and Reversal workflows (Strictly additive corrections, never database deletes).
*   **Constraint**: The Ledger has **NO CRUD API**. It is written to only by internal services via transactions.

### **PHASE 4: Read Models & Reporting**
*Objective: Turn raw data into insights.*
*   **Dashboards**: Aggregated queries for Tenant, Owner, Admin.
*   **Financial Summaries**: Profit/Loss, Arrears reports derived from Ledger.
*   **Admin Reports**: System health, occupancy rates.
*   **Projections**: Cash flow forecasting.
*   **Constraint**: All data here is Read-Only.

---

## 3. Service-by-Service Build Order

For each module, the following contract applies:

### **A. Shared Kernel (Pre-Requisite)**
*   **Responsibilities**: Error handling classes, Zod validation pipes, Transaction Manager wrapper.
*   **Forbidden**: Business logic.

### **B. Audit Module**
*   **Preconditions**: Database setup.
*   **Responsibilities**: Async writing of `AuditLog` entries.
*   **Forbidden**: Blocking the main thread (must be fire-and-forget or queued).

### **C. Auth Module**
*   **Preconditions**: Audit Module, User Schema.
*   **Responsibilities**: Minting tokens, Validating credentials.
*   **Audit**: Must log every regular and failed login attempt.

### **D. Units & Leases Module**
*   **Preconditions**: Auth Module.
*   **Responsibilities**: Inventory management, Lease lifecycle.
*   **Transaction**: Lease creation MUST be atomic with Unit reservation.
*   **Forbidden**: changing a Lease state without a corresponding audit log.

### **E. Ledger Module**
*   **Preconditions**: Leases Module, Billing Module.
*   **Responsibilities**: Recording financial truth.
*   **Forbidden**: `UPDATE` or `DELETE` SQL statements on `ledger_entries` table.
*   **Transaction**: Every write must be part of a parent business transaction (e.g., "Pay Invoice").

---

## 4. Guardrails & CI Enforcement

The following rules must be enforced programmatically in the CI/CD pipeline or via Database Triggers:

1.  **Immutable Ledger**: Use Database Permissions or Triggers to `REVOKE UPDATE, DELETE` on the `ledger` table for the application user.
2.  **No Naked SQL**: All raw SQL queries must be reviewed. Prefer ORM/Query Builder for safety.
3.  **Migration Safety**: CI fails if a migration alters a column in a way that locks a table for > 1 second (use `pg-online-schema-change` logic if needed).
4.  **Linting**: Circular dependencies between modules trigger build failure (`madge` or similar tool).
5.  **Testing**:
    *   **Unit Tests**: Required for all business logic in `modules/`.
    *   **Integration Tests**: Required for every API Endpoint.
    *   **Financial Tests**: Fuzz testing required for Ledger balancing logic.

---

## 5. What NOT To Build (Explicitly)

These features are **Dangerous** or **Premature**. Do not implement them.

*   ❌ **Direct "Make Payment" API**: Never allow the frontend to say "I paid $50". The frontend must request an *Intent*, and the backend confirms payment via Webhook/Provider S2S.
*   ❌ **Raw Monetary Inputs**: Never accept `amount: number` from the client for critical flows. Calculate amounts backend-side based on the ID of the service/product.
*   ❌ **Admin "Edit Transaction"**: Financial records are never edited. They are corrected by a new, opposing entry.
*   ❌ **Soft Delete on Audit/Ledger**: `deleted_at` columns should not exist on these tables. They are permanent.

---

## 6. Frontend Integration Contract

The Backend dictates the flow. The Frontend is a view layer.

*   **Allowed Requests**:
    *   "Get me my current invoice."
    *   "I want to pay Invoice #123 (Generate Intent)."
    *   "Cancel my application (if allowed state)."
*   **Forbidden Controls**:
    *   "Set my balance to $0."
    *   "Update the price of unit X" (unless Admin with specific scope).
    *   "Create a lease" (without validation passes).
*   **Interaction Example**:
    *   *Incorrect*: Frontend sends `POST /lease { status: 'ACTIVE' }`.
    *   *Correct*: Frontend sends `POST /lease/{id}/sign`. Backend validates, then transitions state to `ACTIVE`.

---

## 7. Failure & Rollback Doctrine

Consistency > Availability for Financial Operations.

1.  **Atomic Transactions**: All multi-step write operations (e.g., "Assign Unit + Create Lease + Draft Invoice") must run within a single Database Transaction.
2.  **Rollback**: If any step fails (e.g., Invoice generation fails), the Unit reservation is rolled back instantly.
3.  **Idempotency**: All critical commands (Payment, Lease Signing) must accept an `idempotency-key` header to prevent double-execution on network retries.
4.  **No Orphaned State**: Checkers must run periodically (cron) to release reserved units that have expired without a completed lease.

---

**Signed,**
**Principal Backend Architect**
