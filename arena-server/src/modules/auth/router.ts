import { Router } from 'express';
import fs from 'fs';
import { AuthService } from './service';
import { authenticate, AuthenticatedRequest } from './middleware';
import { debugLog } from '../../infrastructure/debug/log';
import { UserRepository } from '../users/repository';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user (Tenant or Employee)
 * @access Public (for Tenant) / Admin (for Employee - enforced in service logic or separate route?)
 * For simplicity, we'll allow public registration for Tenants, but restricted for Employees.
 */
router.post('/register', async (req, res) => {
    try {
        // Validation should be here (Zod)
        const { email, password, roleId, profile } = req.body;
        // Basic guard: Only ADMIN can register non-Tenants? 
        // Or we have a separate backend-only route for creating employees.
        // Assuming public registration is mainly for Tenants.

        if (roleId !== 'TENANT') {
            // For Phase 4, let's assume strict RBAC. 
            // If creating admin/employee, must be done via /users endpoint by Admin.
            // But if this is the only register endpoint, we need a check.
            // We'll treat this as "Self Registration" -> ALWAYS 'TENANT'.
            if (roleId && roleId !== 'TENANT') return res.status(403).json({ error: 'Cannot self-register as employee' });
        }

        const userId = await AuthService.register({
            email,
            password,
            roleId: 'TENANT', // Force Tenant
            profile
        }, {
            actorId: 'SYSTEM',
            actorType: 'SYSTEM',
            action: 'REGISTER_SELF',
            ipAddress: req.ip || '',
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({ userId, message: 'Registration successful' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route POST /auth/login
 * @desc Login and get tokens (Tenant only - must have approved application)
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // First check if user exists and get their role
        const user = await UserRepository.findByEmail(email);
        
        // If no user found, check if they have a pending/rejected application
        if (!user) {
            const { ApplicationService } = await import('../application/service');
            const application = await ApplicationService.getApplicationByEmail(email);
            
            if (!application) {
                return res.status(401).json({
                    error: 'NOT_A_TENANT',
                    message: 'You need to be a tenant to login.',
                    instructions: [
                        '1. Find a property you like on our listings page',
                        '2. Click "Apply" or "Show Interest" on the property card',
                        '3. Fill in your details and submit the application',
                        '4. Wait for the caretaker to approve your application',
                        '5. Once approved, you will receive login credentials via email',
                        '6. Complete your profile, change your password, and accept the user agreement'
                    ]
                });
            }
        }
        
        // #region agent log
        const payloadStart = {
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'arena-server/src/modules/auth/router.ts:POST /login',
            message: 'auth login called',
            data: {
                emailProvided: Boolean(email),
                passwordProvided: Boolean(password),
                ip: req.ip,
                hasCookieHeader: Boolean(req.headers.cookie),
            },
            timestamp: Date.now(),
        };
        fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadStart),
        }).catch(() => { });
        debugLog(payloadStart);
        try {
            fs.appendFileSync('c:\\Users\\HP\\Desktop\\Arena\\.cursor\\debug.log', JSON.stringify(payloadStart) + '\n');
        } catch {
            // ignore file logging errors
        }
        // #endregion
        
        const result = await AuthService.login(email, password, {
            actorId: 'ANONYMOUS',
            actorType: 'USER',
            action: 'LOGIN',
            ipAddress: req.ip || '',
            userAgent: req.get('User-Agent')
        });
        
        // Check if user is a tenant and has completed onboarding
        if (result.user.roleId === 'TENANT') {
            const { ApplicationService } = await import('../application/service');
            const dashboardAccess = await ApplicationService.canAccessDashboard(result.user.id);
            
            if (!dashboardAccess.canAccess) {
                // Return special flag for incomplete onboarding
                (result as any).requiresOnboarding = true;
                (result as any).onboardingStatus = dashboardAccess.onboardingStatus;
            }
        }
        
        // #region agent log
        const payloadSuccess = {
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'arena-server/src/modules/auth/router.ts:POST /login',
            message: 'auth login success',
            data: { hasAccessToken: Boolean(result?.accessToken), hasRefreshToken: Boolean(result?.refreshToken), roleId: result?.user?.roleId },
            timestamp: Date.now(),
        };
        fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadSuccess),
        }).catch(() => { });
        debugLog(payloadSuccess);
        try {
            fs.appendFileSync('c:\\Users\\HP\\Desktop\\Arena\\.cursor\\debug.log', JSON.stringify(payloadSuccess) + '\n');
        } catch {
            // ignore file logging errors
        }
        // #endregion
        res.json(result);
    } catch (err: any) {
        // #region agent log
        const payloadFail = {
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'arena-server/src/modules/auth/router.ts:POST /login',
            message: 'auth login failed',
            data: { name: err?.name, message: String(err?.message || '') },
            timestamp: Date.now(),
        };
        fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFail),
        }).catch(() => { });
        debugLog(payloadFail);
        try {
            fs.appendFileSync('c:\\Users\\HP\\Desktop\\Arena\\.cursor\\debug.log', JSON.stringify(payloadFail) + '\n');
        } catch {
            // ignore file logging errors
        }
        // #endregion
        
        if (err.message === 'Invalid credentials') {
            return res.status(401).json({
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid credentials. If you are not yet a tenant, you need to apply for a property first.',
                instructions: [
                    '1. Find a property you like on our listings page',
                    '2. Click "Apply" on the property card',
                    '3. Submit your application and wait for approval',
                    '4. Once approved, login with your credentials'
                ]
            });
        }
        
        res.status(401).json({ error: err.message });
    }
});

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshSession(refreshToken, {
            actorId: 'UNKNOWN',
            actorType: 'USER',
            action: 'REFRESH_TOKEN',
            ipAddress: req.ip || '',
        });
        res.json(result);
    } catch (err: any) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

/**
 * @route POST /auth/logout
 * @desc Invalidate session
 */
router.post('/logout', authenticate, async (req, res) => {
    // In stateless JWT, logout is client-side unless we blacklist.
    // However, if we track sessions in DB (Phase 1), we should invalidate there.
    // For now, simple response.
    res.json({ message: 'Logged out' });
});

/**
 * @route GET /auth/me
 * @desc Get current user profile
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
    // We would fetch profile here.
    // For now return payload.
    res.json({ user: req.user });
});

export const authRouter = router;
