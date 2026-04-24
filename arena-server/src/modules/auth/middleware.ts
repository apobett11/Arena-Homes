import { Request, Response, NextFunction } from 'express';
import { TokenService } from './token.service';
import { db } from '../../infrastructure/orm/drizzle';
import { users } from '../users/schema';
import { eq } from 'drizzle-orm';
import { AuditContext } from '../audit/types';
import { debugLog } from '../../infrastructure/debug/log';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        userId?: string;
        email: string;
        roleId: string;
    };
    auditContext?: AuditContext;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // 1. Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Check Cookie if header not present
    if (!token && req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
            message: 'authenticate token source',
            data: {
                path: req.path,
                usedAuthHeader: Boolean(authHeader && authHeader.startsWith('Bearer ')),
                hasCookiesObject: Boolean(req.cookies),
                hasAccessTokenCookie: Boolean(req.cookies && req.cookies.access_token),
                tokenPresent: Boolean(token),
            },
            timestamp: Date.now(),
        }),
    }).catch(() => { });
    debugLog({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H3',
        location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
        message: 'authenticate token source',
        data: {
            path: req.path,
            usedAuthHeader: Boolean(authHeader && authHeader.startsWith('Bearer ')),
            hasCookiesObject: Boolean(req.cookies),
            hasAccessTokenCookie: Boolean(req.cookies && req.cookies.access_token),
            tokenPresent: Boolean(token),
        },
        timestamp: Date.now(),
    });
    // #endregion

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = TokenService.verifyToken(token) as any;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H3',
                location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
                message: 'authenticate decoded fields presence',
                data: {
                    hasUserId: Boolean(decoded?.userId),
                    hasRoleId: Boolean(decoded?.roleId),
                    hasEmail: Boolean(decoded?.email),
                },
                timestamp: Date.now(),
            }),
        }).catch(() => { });
        debugLog({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
            message: 'authenticate decoded fields presence',
            data: {
                hasUserId: Boolean(decoded?.userId),
                hasRoleId: Boolean(decoded?.roleId),
                hasEmail: Boolean(decoded?.email),
            },
            timestamp: Date.now(),
        });
        // #endregion
        req.user = {
            id: decoded.userId,
            userId: decoded.userId,
            email: decoded.email,
            roleId: decoded.roleId,
        };

        // Construct Audit Context
        req.auditContext = {
            actorId: decoded.userId,
            actorType: 'USER',
            action: `${req.method} ${req.path}`,
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.get('User-Agent'),
            correlationId: req.headers['x-correlation-id'] as string
        };

        next();
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H3',
                location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
                message: 'authenticate failed verifyToken',
                data: { name: (error as any)?.name, message: String((error as any)?.message || '') },
                timestamp: Date.now(),
            }),
        }).catch(() => { });
        debugLog({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'arena-server/src/modules/auth/middleware.ts:authenticate',
            message: 'authenticate failed verifyToken',
            data: { name: (error as any)?.name, message: String((error as any)?.message || '') },
            timestamp: Date.now(),
        });
        // #endregion
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user || !roles.includes(user.roleId)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
