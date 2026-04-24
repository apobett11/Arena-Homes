# Arena Homes - Conceptual Backend Data Model

## 1. Entity List (Grouped by Domain)

### A. Identity & Access Management
*   **User**: Core authentication entity. (UUID, Email, PasswordHash, Role, Status)
*   **Profile**: Human-readable identity. (FullName, Avatar, Phone, Preferences)
*   **Role**: System predefined roles. (Admin, IT, Accountant, Caretaker, Tenant, Public)
*   **EmployeeExtension**: Employment details. (JobTitle, Shift, PayrollID, Department) - *Linked to User*
*   **TenantExtension**: Housing-specific tenant data. (GuarantorDetails, EmergencyContact, OnboardingStatus) - *Linked to User*
*   **Permission**: Granular capabilities assigned to Roles.

### B. Property & Housing
*   **Plot**: Top-level compound/property. (Name, Location, FacilitiesJSON, OwnerID)
*   **House**: Structural container (e.g., "Block A"). (PlotID, Name, Description)
*   **UnitType**: Template for rooms. (Name, BasePrice, Category: Bedsitter/1BR)
*   **Room**: **The Rentable Unit**. (HouseID, RoomNumber, UnitTypeID, CurrentStatus)
*   **Amenity**: Specific features available in a Plot or Room.

### C. Leasing & Occupancy
*   **Lease**: Active legal contract. (TenantExtensionID, RoomID, DateRange, RentAmount, ContractPDF)
*   **LeaseHistory**: **Immutable** archive of past leases.
*   **RoomAllocation**: Current active assignment mapping Room to Tenant.
*   **UnitAvailabilitySnapshot**: Time-series record of vacancy rates per Plot/House.

### D. Financial Core (Strict Hierarchy)
*   **Payment**: Real-world transaction record. (TransactionRef, Amount, Method, PayerID, Status)
*   **LedgerEntry**: **Immutable** accounting source of truth. (PaymentID, Debit, Credit, Balance, Type)
*   **Income**: Categorized inflow derived from LedgerEntries. (Rent, Penalty, ServiceFee)
*   **Expense**: Categorized outflow derived from LedgerEntries. (Maintenance, Salary, Operations)
*   **Budget**: High-level grouping for financial planning.
*   **BudgetVersion**: **Immutable** snapshot of a budget for a specific period (Versioning).
*   **DiscrepancyFlag**: System-generated record of mismatch between Expected vs Actual finance.
*   **FinancialSnapshot**: Monthly system-generated summary (Balance Sheet logic).
*   **TaxDocument**: Generated immutable PDF record.
*   **Payslip**: Employee payment record (Immutable PDF reference).

### E. Operations & Communication
*   **MaintenanceRequest**: Issue needing resolution. (RoomID, ReporterID, Severity, Status)
*   **MaintenanceJob**: Assigned work for a request. (TechnicianID, ScheduledDate, Cost)
*   **ChatThread**: Container for messages (Group or Private).
*   **Message**: Content within a thread.
*   **Announcement**: Broadcasted info. (TargetAudience, Content, Expiry)
*   **Notification**: Targeted user alert.

### F. System & Audit (Governance)
*   **AuditLog**: **Immutable** record of WHO did WHAT, WHEN, and PREVIOUS STATE.
*   **SystemLog**: Technical diagnostics (Error, Warn, Info).
*   **BackupRecord**: Metadata of database dumps.
*   **Rule**: Operations/Conduct rules for Tenants/Employees.

---

## 2. Relationship Map

### Identity
*   `User` (1) ──── (1) `Profile`
*   `User` (1) ──── (0..1) `EmployeeExtension`
*   `User` (1) ──── (0..1) `TenantExtension`
*   `User` (1) ──── (1) `Role`

### Property
*   `Plot` (1) ──── (n) `House`
*   `Plot` (1) ──── (1) `EmployeeExtension` (Caretaker)
*   `House` (1) ──── (n) `Room`
*   `Room` (n) ──── (1) `UnitType`

### Leasing
*   `TenantExtension` (1) ──── (n) `Lease` (Historical)
*   `Lease` (1) ──── (1) `Room`
*   `Room` (1) ──── (0..1) `RoomAllocation` (Active Tenant)

### Financial (The "Waterfall")
*   `TenantExtension` (1) ──── (n) `Payment`
*   `Payment` (1) ──── (1..n) `LedgerEntry` (Split into Rent/Deposit/Fee)
*   `LedgerEntry` (1) ──── (0..1) `Income` (derived)
*   `LedgerEntry` (1) ──── (0..1) `Expense` (derived)
*   `LedgerEntry` (n) ──── (1) `FinancialSnapshot` (Aggregated)
*   `Budget` (1) ──── (n) `BudgetVersion`

### Audit & Ops
*   `User` (1) ──── (n) `AuditLog`
*   `User` (1) ──── (n) `SupportTicket`
*   `Room` (1) ──── (n) `MaintenanceRequest`

---

## 3. Immutability Table

| Entity | Classification | Reason |
| :--- | :--- | :--- |
| **LedgerEntry** | 🔒 **Immutable** | Accounting integrity. Transactions cannot be rewritten, only corrected via counter-entry. |
| **LeaseHistory** | 🔒 **Immutable** | Legal record preservation. Proof of contract cannot change after expiry. |
| **Payslip** | 🔒 **Immutable** | Financial compliance. Once issued to an employee, values are final. |
| **AuditLog** | 🔒 **Immutable** | Security. Prevents cover-ups of malicious actions. |
| **BudgetVersion** | 🔒 **Immutable** | Planning integrity. Historical budgets must remain as they were approved. |
| **FinancialSnapshot**| 🔒 **Immutable** | Historical reporting. Monthly closes cannot change retrospectively. |
| **TaxDocument** | 🔒 **Immutable** | Regulatory compliance. Submitted forms must technically match stored files. |
| **Message** | ✏️ **Soft Delete** | User privacy, but retained in DB for safety/audit if needed (admin view). |
| **Property/Room** | ✏️ **Mutable** | Physical realities change (renovations, status updates). **Audited.** |
| **Profile** | ✏️ **Mutable** | Users update personal info. **Audited.** |
| **Payment** | 🔒 **Immutable** | Represents a bank/external signal. The signal itself doesn't change, only its status (Pending->Success). |

---

## 4. Ownership & Access Rules

### Data Ownership
*   **System**: Owns `LedgerEntry`, `FinancialSnapshot`, `AuditLog`, `SystemLog`, `BackupRecord`. No human "owns" these; they are byproducts of the engine.
*   **Admin**: Owns `Plot`, `House`, `EmployeeExtension` records.
*   **Tenant**: Owns their `Profile` (PII), `Measurement` (Map usage), `Ticket` (Issues).
*   **Caretaker**: "Manages" `Room` status and `MaintenanceRequest` but does not "Own" the property data.

### Write Permissions
*   **Ledger**: Only `System` writes here (triggered by Payment or verified Accountant action). **Accountant** cannot directly `INSERT`.
*   **Budget**: **Accountant** creates new `BudgetVersion`. **Super Admin** approves.
*   **Lease**: **System** generates on workflow completion (Admin approval).
*   **DiscrepancyFlag**: **System** creates. **Accountant** annotates. **Admin** resolves (marks closed).

### Read Constraints
*   **Tenant**: Sees ONLY their own `Lease`, `Payment`, `Payslip` (if employed?), `Room`.
*   **Caretaker**: Sees `Tenant` names/contacts ONLY for their designated `Plot`. No access to global financial totals.
*   **IT Support**: Sees `SystemLog`, `AuditLog`, `User.Status`. BLIND to `LedgerEntry` amounts and `Profile` PII (unless necessary for debugging, but masked preferrably).
*   **Accountant**: Full view of `Financial` domain. Read-only on `Tenant` personal chats.

---

## 5. Key Design Decisions & Warnings

*   **Logic Separation**: The `Room` is the **only** rent-generating entity. Even if a tenant rents a "House", the system treats it as a `UnitType` of "Whole House" assigned to a `Room` entity ID. This standardizes occupancy calc.
*   **Double-Entry Pattern**: Every `Payment` triggers a `LedgerEntry` (Credit Cash / Debit AR). This is critical for the "Accountant" dashboard's Balance Sheet feature.
*   **Versioned Budgets**: We do not update a budget row `amount = 500`. We insert a new `BudgetVersion` linked to the parent `Budget` ID. Reports query `WHERE active = true` or by date.
*   **Snapshot Strategy**: We do not calculate "Monthly Income" on the fly for reports 2 years ago. We query the `FinancialSnapshot` table. This is much faster and audit-safe.
*   **Orphan Prevention**: A `User` deletion is a "Soft Delete" (Status = ARCHIVED). Real deletion is forbidden to preserve `AuditLog` integrity.
