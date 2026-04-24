# Authentication & Session Layer Policy - Arena Homes

**Version:** 1.0.0  
**Status:** DRAFT (Conceptual Design)  
**Scope:** Identity, Session Management, Security & Audit
**Reference:** `ACCESS_CONTROL_POLICY.md`

---

## 🎯 GOAL
Establish a secure, audit-friendly authentication system that verifies identity (`Who are you?`) and enables authorization (`What can you do?`) based on the strict Role-Based Access Control (RBAC) defined in the Access Control Policy.

---

## 🧩 ENTITY DEFINITIONS

### 1. AuthUser
**Details:** The central identity record for any human or system actor.
*   **Properties:**
    *   `userId` (UUID, Primary Key)
    *   `username` (Unique, String)
    *   `email` (Unique, Verified)
    *   `hashedPassword` (Bcrypt/Argon2, Salted)
    *   `role` (Enum: Admin, Caretaker, Accountant, IT Support, Tenant, System)
    *   `mfaEnabled` (Boolean)
    *   `mfaSecret` (Encrypted, Nullable)
    *   `status` (Enum: ACTIVE, SUSPENDED, LOCKED, ARCHIVED)
    *   `lastLoginAt` (Timestamp)
    *   `failedLoginAttempts` (Integer, reset on success)
    *   `createdAt` (Timestamp)
    *   `updatedAt` (Timestamp)

### 2. Session
**Details:** Represents an active authenticated period. conceptualized as a JWT payload + Server-side validity check.
*   **Properties:**
    *   `sessionId` (UUID, JTI claim)
    *   `userId` (Reference to AuthUser)
    *   `role` (Frozen at creation)
    *   `ipAddress` (String)
    *   `deviceInfo` (User-Agent hash/string)
    *   `createdAt` (Timestamp)
    *   `expiresAt` (Timestamp - Short lived, e.g., 15-60 mins)
    *   `lastActivityAt` (Timestamp)
    *   `isValid` (Boolean - allows instant server-side revocation)

### 3. RefreshToken
**Details:** specific mechanism for extending sessions without re-entering credentials.
*   **Properties:**
    *   `tokenId` (UUID, High Entropy)
    *   `userId` (Reference to AuthUser)
    *   `parentSessionId` (Link to the session it generated)
    *   `hash` (Secure hash of the raw token given to client)
    *   `issuedAt` (Timestamp)
    *   `expiresAt` (Timestamp - Long lived, e.g., 7-30 days)
    *   `revoked` (Boolean)
    *   `replacedByTokenId` (UUID, for rotation tracking)

### 4. LoginAttempt
**Details:** Security log for all entry attempts.
*   **Properties:**
    *   `attemptId` (UUID)
    *   `userId` (Nullable - if user exists)
    *   `inputEmail` (String - for tracing brute force on non-existent users)
    *   `timestamp` (Timestamp)
    *   `success` (Boolean)
    *   `failureReason` (Enum: WRONG_PWD, LOCKED, MFA_FAIL, USER_NOT_FOUND)
    *   `ipAddress` (String)
    *   `deviceInfo` (String)
    *   `riskScore` (Float, optional for heuristic analysis)

### 5. PasswordResetRequest
**Details:** Secure flow for account recovery.
*   **Properties:**
    *   `requestId` (UUID)
    *   `userId` (Reference to AuthUser)
    *   `maskedContact` (Email/Phone used)
    *   `otpHash` (Hashed version of the code sent)
    *   `createdAt` (Timestamp)
    *   `expiresAt` (Timestamp - Short lived, e.g., 10-15 mins)
    *   `isUsed` (Boolean)
    *   `requestIp` (String)
    *   `completionIp` (String)

---

## 🔒 OWNERSHIP & MUTABILITY

| Entity | Created By | Read Access | Modifiable By | Never Modifiable By |
| :--- | :--- | :--- | :--- | :--- |
| **AuthUser** | System (on Registration/Invite) | Admin, IT Support (PII masked), Owner | Admin (Status/Role), Owner (Profile), System | Caretaker, Tenant (Others' data) |
| **Session** | System (Login Service) | System, IT Support (Metadata only) | System (Revoke/Refresh) | User (Cannot manually extend), Accountant |
| **RefreshToken**| System (Login Service) | System (Hashed checks only) | System (Revoke/Rotate) | User, Admin (Cannot read raw token) |
| **LoginAttempt**| System (Security Middleware)| IT Support, Admin | **NONE (Immutable)** | **EVERYONE** |
| **ResetReq** | System (Recovery Service) | System | System (Mark used) | User, Admin |

---

## 🔗 RELATIONSHIPS

*   **AuthUser** 1:N **Session** (One user can have multiple active devices).
*   **AuthUser** 1:N **RefreshToken** (Each session typically has one chain of refresh tokens).
*   **Session** 1:1 **RefreshToken** (Active pairing).
*   **AuthUser** 1:N **LoginAttempt** (History of access).
*   **AuthUser** 1:1 **RoleProfile** (Links to `AdminProfile`, `TenantProfile`, etc. - *implied from ext systems*).

---

## 🛡️ SESSION & RBAC ENFORCEMENT RULES

### 1. Session Lifecycle
1.  **Creation:** Only upon successful Password (+ MFA if required) validation.
2.  **Payload:** The Session Object (JWT) **MUST** contain:
    *   `sub` (userId)
    *   `role` (The strict role string from Access Control)
    *   `scope` (Optional: granular permissions if roles fragment)
    *   `iat` (Issued At)
    *   `exp` (Expiry)
3.  **Rotation:**
    *   Access Token expires short (e.g., 15 min).
    *   Refresh Token exchanged for new Access Token + New Refresh Token (Rotation Family).
    *   **Reuse Detection:** If an old Refresh Token is used, **IMMEDIATELY REVOKE ALL** tokens for that user (assumed theft).

### 2. RBAC Enforcement (Per Request)
*   **Middleware Logic:**
    *   Read `Authorization` header.
    *   Verify Signature & Expiry.
    *   Check `Session.isValid` in Cache/DB (prevents access by banned users with valid JWTs).
    *   Extract `role` claim.
    *   **Compare `role` vs `ACCESS_CONTROL_POLICY.md` allowed roles for the endpoint.**
    *   If Role mismatches -> `403 Forbidden`.
    *   If Scope/Owner mismatches -> `403 Forbidden`.

### 3. MFA Enforcement
*   **Mandatory Roles:** `Admin`, `Accountant`, `IT Support`.
*   **Optional Roles:** `Tenant`, `Caretaker` (User opt-in).
*   **Flow:**
    1.  Credentials Validated -> Intermediate Session (Partial Auth).
    2.  MFA Challenge Issued.
    3.  MFA Validated -> Full Session Issued.

---

## 🚨 AUDIT & SECURITY FLOWs

### 1. Login Audit
*   **Success:** Log `LoginAttempt` (Success=True). Update `AuthUser.lastLoginAt`.
*   **Failure:** Log `LoginAttempt` (Success=False, Reason). Increment `AuthUser.failedLoginAttempts`.
*   **Lockout Policy:**
    *   If `failedLoginAttempts` > 5 within 15 minutes:
    *   Set `AuthUser.status` = `LOCKED`.
    *   Log `SecurityAlert` (Level: High, Type: BruteForce).
    *   Unlock requires Admin intervention or specific time-delay (e.g., 30 mins).

### 2. Session Hijack Prevention
*   **Device Fingerprinting:** Store `User-Agent` hash and `IP` subnet on Session.
*   **Check:** If a request comes with a valid Session ID but significantly different IP/Device:
    *   **Action:** Invalidate Session.
    *   Force Re-login.
    *   Notify User ("New login detected").

### 3. Account Recovery
*   **No Silent Failures:** If verifying a non-existent email, return a generic "If account exists, email sent" message (Prevent User Enumeration).
*   **Token Security:** Reset tokens must be single-use and short-lived.
*   **Password Change:** Upon password change, **REVOKE ALL** existing sessions and refresh tokens.

---

## ⚠️ WARNINGS & DESIGN NOTES

1.  **No "Remember Me" for High Priv:** Admin/Accountant sessions should have shorter absolute timeouts (e.g., 12 hours max) regardless of activity.
2.  **API Keys vs Sessions:** This policy applies to *human* interaction. `System` role actors should use Mutually Authenticated TLS (mTLS) or signed API Keys, not user sessions.
3.  **Critical Action Re-Auth:** For highly sensitive actions (e.g., "Delete Plot", "Transfer Budget"), the backend should require a fresh password entry or MFA check ("SUDO mode"), even if the session is valid.
4.  **Logging PII:** Ensure `LoginAttempts` do NOT log the password entered by the user, only the username/email attempted.

---
**End of Policy**
