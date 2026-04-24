# Automation & Scheduled Processes Blueprint - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Conceptual Automation Map)  
**References:** `BACKEND_SERVICE_MAP.md`, `API_ENDPOINT_MAP.md`

---

## 🎯 GOAL
Define the heartbeat of the Arena Homes platform. This document specifies the automated, background, and scheduled jobs that ensure financial consistency, data safety, and operational efficiency without human intervention.

---

## 1. 💵 FINANCIAL & ACCOUNTING AUTOMATION

### 🗓️ Job: Monthly Rent Assessment (Rent Demand)
*   **Service:** `LeaseService` -> `LedgerService`
*   **Trigger:** Cron, **1st of Month** (00:01 AM EAT)
*   **Action:**
    1.  Query all `ACTIVE` Leases.
    2.  Calculate Amount Due (Rent + Service Charges).
    3.  Create **Immutable** `LedgerEntry` (Type: `RENT_DUE`, Debit) for each tenant.
    4.  Generate `Invoice` record.
*   **Entities:** `Lease`, `LedgerEntry`, `Invoice`
*   **Audit:** `BatchJob.RentAssessment` (Count of invoices generated).
*   **Notifications:** Tenant (SMS/Email: "Rent for [Month] is due.").
*   **Safety:** **Idempotency Key** based on `(LeaseID + Month + Year)` to prevent double billing if job retries.
*   **Owner:** System.

### 🗓️ Job: Financial Month Closing (Snapshot)
*   **Service:** `AccountingService`
*   **Trigger:** Cron, **Last Day of Month** (23:59 PM EAT)
*   **Action:**
    1.  Sum all Credits/Debits per Plot/Global.
    2.  Generate `FinancialSnapshot` JSON/PDF (Income, Expense, Net).
    3.  Check against `Budget` limits.
    4.  Log any un-reconciled Discrepancies.
*   **Entities:** `LedgerEntry`, `FinancialSnapshot`, `Budget`
*   **Audit:** `Snapshot.Created` (Hash of the snapshot file).
*   **Notifications:** Accountant, Admin (Link to Monthly Report).
*   **Safety:** Snapshots are **Write-Once**. If separate late transactions occur, they apply to the *next* month or require a specific "Backdated" flag handled by a Correction Entry.

### ⏱️ Job: Payment Reconciliation Bot
*   **Service:** `PaymentService`
*   **Trigger:** Cron, **Every 1 Hour**
*   **Action:**
    1.  Find `PaymentIntents` in `PENDING` state created > 30 mins ago.
    2.  Query Gateway API (M-Pesa/Bank) for status.
    3.  If `COMPLETED`: Trigger Success Flow (Ledger Write).
    4.  If `FAILED`: Mark as Failed.
*   **Entities:** `Payment`, `LedgerEntry`
*   **Audit:** `Reconciliation.AutoFix`.
*   **Notifications:** Tenant (Only if status flips to Success).

---

## 2. 🏠 LEASE & TENANT AUTOMATION

### 🗓️ Job: Lease Expiry Monitor
*   **Service:** `LeaseService`
*   **Trigger:** Cron, **Daily** (09:00 AM)
*   **Action:**
    1.  Find Leases expiring in **30 Days**, **7 Days**, and **1 Day**.
    2.  **30 Days:** Send "Renewal Proposal" to Tenant.
    3.  **7 Days:** Notify Caretaker to schedule Move-Out Inspection if not renewing.
    4.  **0 Days:** Mark status `EXPIRED` (if logic allows auto-expire).
*   **Entities:** `Lease`, `Notification`
*   **Audit:** `Lease.ExpiryWarning`.
*   **Notifications:** Tenant (Email/SMS), Caretaker (Dashboard Alert).

### 🗓️ Job: Rent Reminder Broadcast
*   **Service:** `NotificationService`
*   **Trigger:** Cron, **25th (Courtesy)** & **5th (Late Warning)**
*   **Action:**
    1.  Query Leases with `Balance > 0`.
    2.  Send custom message based on date.
*   **Entities:** `Lease`, `Ledger`, `Notification`
*   **Audit:** `Broadcast.RentReminder`.
*   **Safety:** check `Balance` immediately before sending, not from stale cache.

---

## 3. 🛠️ OPERATIONS & MAINTENANCE

### ⏱️ Job: Stale Ticket Escalation
*   **Service:** `TicketService`
*   **Trigger:** Cron, **Every 4 Hours**
*   **Action:**
    1.  Find Tickets with status `OPEN` created > **48 Hours** ago.
    2.  Flag as `ESCALATED`.
    3.  Prioritize in Caretaker Dashboard.
*   **Entities:** `SupportTicket`
*   **Audit:** `Ticket.Escalated`.
*   **Notifications:** Admin (Summary of escalations), Caretaker ("Ticket #123 is overdue").

### 🗓️ Job: Caretaker Weekly Digest
*   **Service:** `PropertyService`
*   **Trigger:** Cron, **Mondays** (08:00 AM)
*   **Action:**
    1.  Compile stats: Open Tickets, Vacant Units, Arrears Total for their plots.
    2.  Send Email Summary.
*   **Entities:** `Unit`, `Ticket`, `Ledger`
*   **Notifications:** Caretaker.

---

## 4. 🛡️ SYSTEM & SECURITY

### 🗓️ Job: Daily Data Shield (Backup)
*   **Service:** `SystemService`
*   **Trigger:** Cron, **Daily** (03:00 AM - Low Traffic)
*   **Action:**
    1.  **Dump:** All SQL Tables -> Encrypted File.
    2.  **Storage:** Upload to Cloud Bucket (Immutable Object Lock enabled).
    3.  **Clean:** Prune local temp files.
    4.  **Prune Remote:** Remove backups > 90 days (Retention Policy).
*   **Entities:** Database, ObjectStorage
*   **Audit:** `Backup.Completion` (Size, Checksum).
*   **Notifications:** IT Support (On **FAILURE ONLY**).
*   **Safety:** **Database Lock** (or Snapshot isolation) during dump to ensure consistency.

### 🗓️ Job: Security Log Rotation & Anomaly Scan
*   **Service:** `AuthService` / `SystemService`
*   **Trigger:** Cron, **Daily**
*   **Action:**
    1.  Archive `LoginAttempts` > 6 months to Cold Storage.
    2.  **Scan:** Check for IP Addresses with > 50 failures unique Accounts (Credential Stuffing Attack).
    3.  **Block:** Auto-add IPs to Blocklist if threshold met.
*   **Entities:** `LoginAttempt`, `Blacklist`
*   **Audit:** `Security.IPBlocked`.
*   **Notifications:** IT Support (Critical Alert).

### ⏱️ Job: Token Cleanup
*   **Service:** `AuthService`
*   **Trigger:** Cron, **Daily**
*   **Action:**
    1.  Delete `Session` and `RefreshToken` records where `expiresAt < NOW - 7 Days`.
*   **Entities:** `Session`, `RefreshToken`
*   **Purpose:** Keep DB size manageable.

---

## ⚠️ FAILURE HANDLING & RESILIENCY

### 1. 🔄 Retry Logic (Job Consumers)
*   **Applies to:** Email sending, SMS, PDF Generation.
*   **Strategy:** Exponential Backoff.
    *   Attempt 1: Immediate.
    *   Attempt 2: +1 min.
    *   Attempt 3: +5 mins.
    *   Fail: Move to **Dead Letter Queue (DLQ)**.
*   **Alert:** If DLQ size > 10, Alert IT Support.

### 2. 🧩 Data Consistency Checks
*   **Scheduled:** Weekly.
*   **Action:** "Ledger Walk"
    *   Sum(All `LedgerEntry` Credits - Debits) vs `Lease.Balance` field.
    *   If Mismatch: Log `CriticalDataCorrupt` event. Note: `Lease.Balance` is usually a cached value, Ledger is truth.

### 3. 🛑 Stop-The-World (Circuit Breakers)
*   If `PaymentService` detects > 5% failure rate on Webhooks within 1 hour:
    *   **Action:** Pause Process.
    *   **Notify:** IT Support + Admin immediately.

---
**End of Automation Blueprint**
