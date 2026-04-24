
import { fetch } from 'undici'; // Node 18+ has fetch, but for types we might rely on global or install @types/node. Assuming global fetch is available in modern node/tsx environment.

const CONFIG = {
    PORT: 4002, // Adjust if your server runs on a different port
    BASE_URL: 'http://localhost:4002/api',
    ADMIN_CREDS: {
        email: 'admin@arenahomes.test',
        password: 'Admin#1234'
    },
    TENANT_CREDS: {
        email: 'tenant1@arenahomes.test',
        password: 'Ten#1234'
    }
};

const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m'
};

function log(msg: string, color: string = COLORS.RESET) {
    console.log(`${color}${msg}${COLORS.RESET}`);
}

function fail(msg: string) {
    console.error(`${COLORS.RED}❌ FAIL: ${msg}${COLORS.RESET}`);
    process.exit(1);
}

function pass(msg: string) {
    console.log(`${COLORS.GREEN}✅ PASS: ${msg}${COLORS.RESET}`);
}

async function run() {
    log('🔐 Starting Arena Homes Auth Verification Pack...\n', COLORS.BLUE);

    // 1. Health Check
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/system/health`);
        if (res.status === 200) {
            pass('System Health Check (200 OK)');
        } else {
            fail(`System Health Check returned ${res.status}`);
        }
    } catch (e: any) {
        fail(`Could not connect to server at ${CONFIG.BASE_URL}. Is it running? Error: ${e.message}`);
    }

    // 2. Login (Admin)
    let adminToken = '';
    let adminRoleId = '';
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CONFIG.ADMIN_CREDS)
        });

        if (res.status === 200) {
            const data: any = await res.json();
            if (data.user && data.user.roleId) {
                pass(`Admin Login Success (Role: ${data.user.roleId})`);
                adminRoleId = data.user.roleId;
                adminToken = data.accessToken;
            } else {
                fail('Admin Login response missing user.roleId');
            }
        } else {
            fail(`Admin Login failed with status ${res.status}`);
        }
    } catch (e: any) {
        fail(`Admin Login request failed: ${e.message}`);
    }

    if (!adminToken) fail('No access token received for Admin');

    // 3. Verify /auth/me with Authorization Header
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.status === 200) {
            pass('Auth Me verification (Header: Authorization)');
        } else {
            fail(`Auth Me (Header) failed with status ${res.status}`);
        }
    } catch (e: any) {
        fail(`Auth Me (Header) request failed: ${e.message}`);
    }

    // 4. Verify /auth/me with Cookie
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/auth/me`, {
            headers: { 'Cookie': `access_token=${adminToken}` }
        });

        if (res.status === 200) {
            pass('Auth Me verification (Header: Cookie)');
        } else {
            fail(`Auth Me (Cookie) failed with status ${res.status}`);
        }
    } catch (e: any) {
        fail(`Auth Me (Cookie) request failed: ${e.message}`);
    }

    // 5. RBAC Test (Tenant trying to access Admin route)
    // First, login as tenant
    let tenantToken = '';
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CONFIG.TENANT_CREDS)
        });

        if (res.status === 200) {
            const data: any = await res.json();
            tenantToken = data.accessToken;
            pass(`Tenant Login Success (Role: ${data.user.roleId})`);
        } else {
            fail(`Tenant Login failed with status ${res.status}`);
        }
    } catch (e: any) {
        fail(`Tenant Login request failed: ${e.message}`);
    }

    // Now try to access a protected System route (which requires IT_SUPPORT or SUPER_ADMIN usually, or we use a known admin route)
    // The health check is public. Let's use /api/system/logs if it exists or verify via `requireRole` check manually if needed.
    // Based on router read previously: router.get('/logs', authenticate, requireRole(['IT_SUPPORT', 'SUPER_ADMIN'])...

    try {
        const res = await fetch(`${CONFIG.BASE_URL}/system/logs`, {
            headers: { 'Authorization': `Bearer ${tenantToken}` }
        });

        if (res.status === 403) {
            pass('RBAC Verification (Tenant -> Admin Route = 403 Forbidden)');
        } else {
            fail(`RBAC Verification failed. Expected 403, got ${res.status}`);
        }
    } catch (e: any) {
        // If 403 throws, good (some clients throw). If fetch doesn't throw on 403, check status.
        // pass('RBAC Verification (Tenant -> Admin Route = 403 Forbidden)');
        fail(`RBAC Verification request failed: ${e.message}`);
    }

    log('\n✨ All Auth Checks Passed!', COLORS.GREEN);
}

run();
