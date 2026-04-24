'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthApi } from '@/lib/api/auth';
import { UserRole } from '@/lib/rbac/types';

const COOKIE_ACCESS_TOKEN = 'access_token';
const COOKIE_REFRESH_TOKEN = 'refresh_token';
const COOKIE_USER_ROLE = 'user_role';

function logDebug(payload: Record<string, any>) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => { });
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        fs.appendFileSync('c:\\Users\\HP\\Desktop\\Arena\\.cursor\\debug.log', JSON.stringify(payload) + '\n');
    } catch {
        // ignore file logging errors
    }
    // #endregion
}

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    try {
        logDebug({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H1',
            location: 'arena-web/app/auth/actions.ts:loginAction',
            message: 'loginAction start',
            data: {
                emailProvided: Boolean(email),
                passwordProvided: Boolean(password),
                emailLooksValid: typeof email === 'string' && email.includes('@'),
            },
            timestamp: Date.now(),
        });

        const response = await AuthApi.login(email, password);

        const cookieStore = await cookies();

        // Secure cookies
        cookieStore.set(COOKIE_ACCESS_TOKEN, response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 mins
        });

        cookieStore.set(COOKIE_REFRESH_TOKEN, response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // Role cookie (not httpOnly strictly needed if we want client to read it easily for UI, 
        // but cleaner to keep everything secure and use a server component or a client wrapper that reads it)
        // Middleware needs it.
        cookieStore.set(COOKIE_USER_ROLE, response.user.roleId, {
            httpOnly: false, // Allow client to read for UI hiding/showing
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        logDebug({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'arena-web/app/auth/actions.ts:loginAction',
            message: 'loginAction cookies set',
            data: {
                setAccessTokenCookie: true,
                setRefreshTokenCookie: true,
                setUserRoleCookie: true,
                roleId: response?.user?.roleId,
            },
            timestamp: Date.now(),
        });

        return { 
            success: true, 
            role: response.user.roleId,
            requiresOnboarding: response.requiresOnboarding,
            onboardingStatus: response.onboardingStatus,
        };

    } catch (error: any) {
        logDebug({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'arena-web/app/auth/actions.ts:loginAction',
            message: 'loginAction error',
            data: { name: error?.name, message: String(error?.message || '') },
            timestamp: Date.now(),
        });
        return { error: error.message };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_ACCESS_TOKEN);
    cookieStore.delete(COOKIE_REFRESH_TOKEN);
    cookieStore.delete(COOKIE_USER_ROLE);
    redirect('/auth/login');
}

export async function refreshAction() {
    // Logic to be called by middleware or client if 401
    // ...
}
