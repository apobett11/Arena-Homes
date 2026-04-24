# Database Schema Specification v1.1.0 (Detailed)
**Status:** Approved for Implementation
**Target System:** Egerton University Student Housing Platform

---

## 🟢 1. Identity & Access Management (IAM)
*Centralized user management and RBAC.*

### `users`
*The core identity entity.*
- **Mutability:** ✏️ Mutable (Sensitive fields audit-logged)
- **Columns:**
  - `id` (PK, UUID).
  - `email` (String, Unique).
  - `password_hash` (String, Excluded from JSON).
  - `role_id` (FK -> `roles.id`).
  - `is_active` (Boolean): False = Soft Ban.
  - `mfa_enabled` (Boolean).
  - `created_at` (Timestamp).
  - `last_login_at` (Timestamp).

### `roles`
*System archetypes (e.g., SUPER_ADMIN, CARETAKER).*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, String).
  - `name` (String).
  - `description` (Text).

### `permissions`
*Atomic capabilities.*
- **Mutability:** 🔒 Immutable (System defaults)
- **Columns:**
  - `id` (PK, String): e.g., 'finance.approve'.
  - `description` (Text).

### `role_permissions`
- **Columns:** `role_id`, `permission_id`.

### `employee_profiles`
*Staff details.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `user_id` (PK, FK -> `users.id`).
  - `full_name` (String).
  - `national_id` (String, Encrypted).
  - `phone_number` (String).
  - `assigned_property_id` (FK -> `properties.id`, Nullable).
  - `job_title` (String).

### `tenant_profiles`
*Resident details.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `user_id` (PK, FK -> `users.id`).
  - `full_name` (String).
  - `phone_number` (String).
  - `id_number` (String, Encrypted).
  - `emergency_contact_json` (JSON).
  - `university_reg_no` (String, Optional).

---

## 🏠 2. Property & Housing
*Physical asset hierarchy.*

### `locations` (Regions)
*Geographic grouping.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `name` (String): e.g., "Njoro Campus Area".
  - `parent_location_id` (FK -> `locations.id`, Nullable).

### `properties` (Plots)
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `location_id` (FK -> `locations.id`).
  - `name` (String).
  - `code` (String, Unique).
  - `caretaker_id` (FK -> `users.id`).

### `unit_types`
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `name` (String): "Single Room", "Bedsitter".
  - `base_price` (Decimal).

### `units`
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `property_id` (FK).
  - `unit_type_id` (FK).
  - `status` (Enum): VACANT, OCCUPIED, MAINTENANCE.

### `unit_availability_snapshots`
*Daily/Hourly logs of vacancy.*
- **Mutability:** 🔒 Immutable (Append-Only)
- **Columns:**
  - `id` (PK, BigInt).
  - `property_id` (FK).
  - `timestamp` (Timestamp).
  - `vacant_count` (Integer).
  - `occupied_count` (Integer).

---

## 📝 3. Leasing & Occupancy

### `leases`
*Legal Contracts.*
- **Mutability:** 🔒 Immutable (Once ACTIVE).
- **Columns:**
  - `id` (PK, UUID).
  - `tenant_id` (FK).
  - `unit_id` (FK).
  - `start_date` (Date).
  - `end_date` (Date).
  - `rent_amount` (Decimal).
  - `contract_file_url` (String, PDF).
  - `status` (Enum).

### `lease_history`
*Amendment interactions.*
- **Mutability:** 🔒 Append-Only
- **Columns:**
  - `id` (PK, UUID).
  - `lease_id` (FK).
  - `change_type` (String).
  - `details_json` (JSON).
  - `created_at` (Timestamp).

### `room_allocations`
*Who is in which room specifically.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `lease_id` (FK).
  - `tenant_id` (FK).
  - `unit_id` (FK).
  - `current_status` (Enum): CHECKED_IN, CHECKED_OUT.

---

## 💰 4. Financial Core (AUDIT SAFE)

### `payments`
*Incoming/Outgoing funds.*
- **Mutability:** ✏️ Status Mutable Only
- **Columns:**
  - `id` (PK, UUID).
  - `amount` (Decimal).
  - `direction` (Enum): IN, OUT.
  - `method` (Enum): MPESA, BANK.
  - `reference_code` (String, Unique).
  - `status` (Enum).

### `ledger_entries`
*Double-entry Bookkeeping.*
- **Mutability:** 🔒 **STRICTLY IMMUTABLE**
- **Columns:**
  - `id` (PK, UUID).
  - `transaction_type` (Enum): DEBIT, CREDIT.
  - `amount` (Decimal).
  - `account_code` (String).
  - `correlation_id` (UUID): Links related Dr/Cr entries.
  - `reference_entity` (String): 'Payment', 'Expense'.
  - `reference_id` (UUID).
  - `created_at` (Timestamp).

### `budgets` & `budget_allocations`
*Spending limits.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `year` (Integer).
  - `property_id` (FK).
  - `limit_amount` (Decimal).

### `expenses`
*Expenditure requests.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `amount` (Decimal).
  - `category` (String).
  - `status` (Enum).
  - `receipt_url` (String).

### `income_records`
*Invoices/Expected Income (before payment).*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `lease_id` (FK).
  - `amount` (Decimal).
  - `due_date` (Date).
  - `is_paid` (Boolean).

### `financial_snapshots`
*Monthly Lock.*
- **Mutability:** 🔒 Immutable
- **Columns:**
  - `id` (PK, UUID).
  - `month` (Integer).
  - `year` (Integer).
  - `data_json` (JSON).
  - `locked_at` (Timestamp).

### `payslips`
*Staff Payment Records.*
- **Mutability:** 🔒 Immutable
- **Columns:**
  - `id` (PK, UUID).
  - `employee_id` (FK -> `users.id`).
  - `period_month` (Integer).
  - `period_year` (Integer).
  - `net_pay` (Decimal).
  - `pdf_url` (String).
  - `generated_at` (Timestamp).

---

## 📄 5. Reports & Documents

### `generated_reports`
- **Columns:** `id`, `type`, `url`, `created_at`.

### `tax_documents`
- **Columns:** `id`, `year`, `type` (KRA_RETURN), `url`.

### `backup_records`
- **Columns:** `id`, `filename`, `size_bytes`, `checksum`, `created_at`.

---

## 💬 6. Communication

### `chat_threads`
*Conversations.*
- **Mutability:** ✏️ Mutable
- **Columns:**
  - `id` (PK, UUID).
  - `type` (Enum): DIRECT, GROUP, TICKET.
  - `subject` (String, Nullable).
  - `created_at` (Timestamp).

### `messages`
*Individual text exchanges.*
- **Mutability:** 🔒 Immutable (Soft Delete only)
- **Columns:**
  - `id` (PK, BigInt).
  - `thread_id` (FK).
  - `sender_id` (FK).
  - `content` (Text).
  - `read_by_json` (JSON).
  - `sent_at` (Timestamp).

### `announcements`
- **Columns:** `id`, `target_audience`, `content`, `expires_at`.

### `notifications`
- **Columns:** `id`, `user_id`, `type`, `payload_json`, `read_at`.

---

## 🛠️ 7. Operations & Monitoring

### `system_logs`
*Debug level logs.*
- **Columns:** `id`, `level`, `component`, `message`, `timestamp`.

### `error_logs`
*Exceptions.*
- **Columns:** `id`, `stack_trace`, `user_id`, `timestamp`.

### `audit_logs`
*Security & Compliance (Who did what).*
- **Mutability:** 🔒 **STRICTLY IMMUTABLE**
- **Columns:**
  - `id` (PK, BigInt).
  - `actor_id` (FK).
  - `action` (String).
  - `target_entity` (String).
  - `target_id` (UUID).
  - `diff_json` (JSON).
  - `ip` (Inet).

### `diagnostic_runs`
*Health checks results.*
- **Columns:** `id`, `status` (PASS/FAIL), `report_json`, `run_at`.

---

## 🧩 8. Support & Governance

### `support_tickets`
- **Columns:** `id`, `subject`, `status`, `assigned_to` (FK).

### `ticket_notes`
- **Columns:** `id`, `ticket_id`, `content`, `is_internal`.

### `faqs`
- **Columns:** `id`, `question`, `answer`, `category`.

### `rules` (Regulations)
*Community guidelines.*
- **Columns:** `id`, `title`, `description`, `is_active`.

---

## ⚠️ Critical Implementation Notes

1.  **Immutability Enforcement:**
    -   `ledger_entries`, `audit_logs`, and `financial_snapshots` MUST be implemented with database-level permissions that `REVOKE UPDATE, DELETE` for the application user.
    -   Use `triggers` to prevent modification if possible.

2.  **Financial Safety:**
    -   Sums of `ledger_entries` must always balance to 0 (Double Entry).
    -   `financial_snapshots` are the 'save points'. Do not recalculate history dynamically for old months; use the snapshot.

3.  **Auditing:**
    -   Any `UPDATE` on `leases` or `payments` must trigger an `audit_logs` insertion via code or trigger.
