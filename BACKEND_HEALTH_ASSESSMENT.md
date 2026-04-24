# BACKEND HEALTH ASSESSMENT - Arena Homes

## Findings & Evidence

### 1. Auth Flow Failure (Root Cause: Property Mismatch)
**Evidence**: 
- `arena-server/src/modules/auth/service.ts`: Returns `user: { id: user.id, role: user.roleId, ... }`.
- `arena-web/app/auth/actions.ts`: Expects `response.user.roleId`.
- **Impact**: The frontend is unable to correctly set the `user_role` cookie or identify the user's role after login, leading to failed redirects or UI state issues.

### 2. CORS Misconfiguration
**Evidence**:
- `arena-server/src/app.ts`: Uses `this.app.use(cors())` which defaults to `credentials: false` and allows all origins.
- **Impact**: Client-side `fetch` calls from `localhost:3000` to `localhost:4001` will fail if credentials (cookies/auth headers) are required and the browser enforces CORS.

### 3. Missing Cookie Handling
**Evidence**:
- `arena-server/package.json`: `cookie-parser` is not listed as a dependency.
- `arena-server/src/modules/auth/middleware.ts`: Only extracts token from `Authorization` header.
- **Impact**: Backend cannot read HttpOnly cookies even if the frontend sends them.

### 4. Password Hashing Consistency
**Evidence**:
- Verified `arena-server/src/modules/auth/password.service.ts` and `arena-server/src/scripts/seed/utils.ts` both use `bcrypt` with 12 salt rounds. 
- **Status**: **HEALTHY**.

### 5. Environment & Connectivity
**Evidence**:
- Server starts on port `4001`.
- Database connection verified via `src/server.ts` bootstrap.
- `/api/system/health` returns `200 OK`.
- **Status**: **HEALTHY**.

## Prioritized Root Causes

1. **[CRITICAL] Property Mismatch**: `role` vs `roleId` in login response. Prevents frontend from handling the session.
2. **[HIGH] CORS & Credentials**: Missing `credentials: true` and origin restriction in CORS config.
3. **[MEDIUM] Middleware Flexibility**: Middleware unable to read tokens from cookies.

## Proposed Fixes

| File | Change | Reason |
| --- | --- | --- |
| `src/modules/auth/service.ts` | Change `role` to `roleId` in login response. | Match frontend expectation. |
| `src/app.ts` | Configure `cors` with `origin: 'http://localhost:3000'` and `credentials: true`. | Allow frontend to call backend with cookies/headers. |
| `src/app.ts` | Add `cookie-parser` middleware. | Support reading cookies. |
| `src/modules/auth/middleware.ts` | Update `authenticate` to check `req.cookies`. | Support cookie-based auth. |
| `package.json` | Add `cookie-parser` and `@types/cookie-parser`. | Dependency management. |

## Test Plan

### 1. Health & Build
- `npm run build` in `arena-server`.
- `curl http://localhost:4001/api/system/health`.

### 2. Login Verification
- Use `curl` to POST to `/api/auth/login` and verify response schema contains `roleId`.
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arenahomes.test","password":"Admin#1234"}'
```

### 3. Middleware Verification
- Test `/api/auth/me` with both `Authorization` header and `access_token` cookie.
