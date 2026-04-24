# Arena Homes — Backend Repo-Wide Audit (Auth + Infrastructure)

**Scope**: `arena-server` backend correctness (focus on login/auth), plus critical frontend ↔ backend contract mismatches in `arena-web`.  
**Constraints honored**: No rewrite, no security weakening, no touching immutable finance rules (ledger/audit/snapshots remain append-only).

---

## Findings (with evidence)

### 1) Backend port default is wrong (breaks expected http://localhost:4000/api)

- **Evidence**: backend env validation defaults `PORT` to **3000**:

```9:17:arena-server/src/infrastructure/config/env.ts
const envSchema = z.object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // Database
    DATABASE_URL: z.string().url(),
```

- **Evidence**: backend server log/docs expect **4000**:

```9:16:arena-server/src/server.ts
dotenv.config();

const port = env.PORT || 4000;
```

```36:41:arena-server/README.md
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arena_db
JWT_SECRET=your_generated_jwt_secret_here
REFRESH_TOKEN_SECRET=your_generated_refresh_token_secret_here
```

- **Impact**: If `.env` omits `PORT`, backend binds **3000**, conflicting with frontend dev server and breaking the documented base URL `http://localhost:4000/api`.

---

### 2) Frontend API client does not send cookies (breaks cookie-based auth)

- **Evidence**: frontend stores tokens in httpOnly cookies (server action):

```20:40:arena-web/app/auth/actions.ts
cookieStore.set(COOKIE_ACCESS_TOKEN, response.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 mins
});
```

- **Evidence**: frontend fetch client omits `credentials: 'include'`:

```12:22:arena-web/lib/api/client.ts
const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
});
```

- **Impact**: Browser `fetch()` will **not** include cookies on cross-origin requests (here: `localhost:3000` → `localhost:4000`) unless `credentials: 'include'` is set. Result: backend `authenticate` never sees `req.cookies.access_token` and protected endpoints fail.

---

### 3) Access token does not include `email`, but backend auth middleware expects it

- **Evidence**: access token is generated without `email`:

```82:87:arena-server/src/modules/auth/service.ts
const accessToken = TokenService.generateAccessToken({
    userId: user.id,
    roleId: user.roleId,
});
```

- **Evidence**: middleware reads `decoded.email` into `req.user.email`:

```35:41:arena-server/src/modules/auth/middleware.ts
const decoded = TokenService.verifyToken(token) as any;
req.user = {
    id: decoded.userId,
    email: decoded.email,
    roleId: decoded.roleId,
};
```

- **Impact**: `/api/auth/me` returns `email: undefined`:

```102:106:arena-server/src/modules/auth/router.ts
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
});
```

This can break UI assumptions and is also a correctness issue in audit context construction (email is part of many identity payloads).

---

### 4) Frontend `/system` client is stubbed and does not match backend `/api/system/health`

- **Evidence**: backend health exists and returns `{status:"ok"}`:

```8:10:arena-server/src/modules/system/router.ts
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

- **Evidence**: frontend `SystemApi.getHealth` is mocked and never calls backend:

```19:31:arena-web/lib/api/domains/system.ts
getHealth: async (): Promise<SystemHealth> => {
    // Backend doesn't have explicit /system/health endpoint in core spec
    // ...
    return new Promise(resolve => setTimeout(() => resolve({
        uptime: 124500,
        cpuUsage: 45,
        memoryUsage: 60,
        activeConnections: 124,
        status: 'HEALTHY'
    }), 500));
},
```

- **Impact**: monitoring/diagnostic UI can appear “healthy” while backend is down, hiding real failures.

---

## Root causes (prioritized)

1. **Cookie auth not wired end-to-end in the browser** due to missing `credentials: 'include'` in frontend fetch client.
2. **Backend defaults to wrong port** (3000), causing inconsistent dev environment and confusing failures.
3. **JWT payload mismatch** (`email` missing) causing `req.user` correctness issues and inconsistent identity response.
4. **Health UI uses mock data** rather than real backend health endpoint.

---

## Fix plan (minimal edits)

### P0 — Must fix for auth to work

- **Frontend**: Add `credentials: 'include'` by default in `arena-web/lib/api/client.ts`.
- **Backend**: Fix env default: `PORT` should default to **4000** in `arena-server/src/infrastructure/config/env.ts`.
- **Backend**: Include `email` in access token payload and decode it consistently:
  - Update `arena-server/src/modules/auth/token.service.ts` payload type and signing
  - Update `arena-server/src/modules/auth/service.ts` login + refresh issuance

### P1 — Improve correctness/visibility

- **Frontend**: Update `arena-web/lib/api/domains/system.ts` to call `/system/health` and map to UI’s `SystemHealth` type (keep backwards compatibility).

---

## Verification plan (expected results)

### Backend health

```bash
curl http://localhost:4000/api/system/health
```

- **Expect**: HTTP 200 with JSON containing `"status":"ok"`.

### Login (token response)

```bash
curl -s -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@arenahomes.test\",\"password\":\"Admin#1234\"}"
```

- **Expect**: HTTP 200 JSON with `accessToken`, `refreshToken`, `user.roleId`.

### Auth header-based access

1) Capture token:

```bash
for /f "tokens=*" %i in ('curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@arenahomes.test\",\"password\":\"Admin#1234\"}"') do @echo %i
```

2) Call `/api/auth/me`:

```bash
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- **Expect**: HTTP 200 with `user.id`, `user.email`, `user.roleId`.

### Cookie-based access (browser)

- Login via frontend UI; then open a protected page.
- **Expect**: middleware sees `access_token` + `user_role` cookies and allows correct role dashboard.
- **Expect**: frontend API calls succeed because cookies now flow to backend (credentials include).

### RBAC sanity (tenant cannot access admin)

- Login as tenant and attempt an admin-only endpoint (example: `/api/system/logs` which requires `IT_SUPPORT`/`SUPER_ADMIN`).
- **Expect**: HTTP 403.

---

## Remaining risks / follow-ups

- **Refresh flow is body-based** (`POST /api/auth/refresh` reads `refreshToken` from JSON). Consider later moving refresh token into httpOnly cookie to reduce token exfiltration risk, but that’s a larger change and not required for immediate correctness.
- **CORS origin is hardcoded** to `http://localhost:3000` in `arena-server/src/app.ts`. Consider env-driven allowed origins for staging/prod (keep strict allowlist).

