import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import fs from 'fs';
import { debugLog } from './infrastructure/debug/log';

import { authRouter } from './modules/auth/router';
import { usersRouter } from './modules/users/router';
import { propertyRouter } from './modules/property/router';
import { unitRouter } from './modules/unit/router';
import { tenantRouter } from './modules/tenant/router';
import { leaseRouter } from './modules/lease/router';
import { paymentRouter } from './modules/payment/router';
import { ledgerRouter } from './modules/ledger/router';
import { budgetRouter } from './modules/budget/router';
import { reportingRouter } from './modules/reporting/router';
import { issueRouter } from './modules/issue/router';
import { maintenanceRouter } from './modules/maintenance/router';
import { announcementRouter } from './modules/announcement/router';
import { notificationRouter } from './modules/notification/router';
import { faqRouter } from './modules/faq/router';
import { ruleRouter } from './modules/rules/router';
import { chatRouter } from './modules/chat/router';
import { systemRouter } from './modules/system/router';
import { applicationRouter } from './modules/application/router';

/**
 * Core Application Class
 * Responsible for wiring up the middleware and infrastructure.
 * DOES NOT handle business logic directly.
 */
export class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares(): void {
        this.app.use(helmet());
        // #region agent log
        this.app.use((req, _res, next) => {
            fetch('http://127.0.0.1:7242/ingest/ede327dc-e376-4cd6-8552-217e1e7024c5', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H5',
                    location: 'arena-server/src/app.ts:initializeMiddlewares',
                    message: 'backend request entry',
                    data: {
                        method: req.method,
                        path: req.path,
                        origin: req.headers.origin,
                        hasCookieHeader: Boolean(req.headers.cookie),
                    },
                    timestamp: Date.now(),
                }),
            }).catch(() => { });
            try {
                fs.appendFileSync('c:\\Users\\HP\\Desktop\\Arena\\.cursor\\debug.log', JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H5',
                    location: 'arena-server/src/app.ts:initializeMiddlewares',
                    message: 'backend request entry',
                    data: {
                        method: req.method,
                        path: req.path,
                        origin: req.headers.origin,
                        hasCookieHeader: Boolean(req.headers.cookie),
                    },
                    timestamp: Date.now(),
                }) + '\n');
            } catch {
                // ignore file logging errors
            }
            debugLog({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H5',
                location: 'arena-server/src/app.ts:initializeMiddlewares',
                message: 'backend request entry',
                data: {
                    method: req.method,
                    path: req.path,
                    origin: req.headers.origin,
                    hasCookieHeader: Boolean(req.headers.cookie),
                },
                timestamp: Date.now(),
            });
            next();
        });
        // #endregion
        this.app.use(cors({
            origin: 'http://localhost:3000',
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
        }));
        this.app.use(cookieParser());
        this.app.use(express.json());
    }

    private initializeRoutes(): void {
        const api = express.Router();
        api.use('/auth', authRouter);
        api.use('/users', usersRouter);
        api.use('/properties', propertyRouter);
        api.use('/units', unitRouter);
        api.use('/tenants', tenantRouter);
        api.use('/leases', leaseRouter);
        api.use('/payments', paymentRouter);
        api.use('/ledger', ledgerRouter);
        api.use('/budgets', budgetRouter);
        api.use('/reports', reportingRouter);
        api.use('/issues', issueRouter);
        api.use('/maintenance', maintenanceRouter);
        api.use('/announcements', announcementRouter);
        api.use('/notifications', notificationRouter);
        api.use('/faq', faqRouter);
        api.use('/rules', ruleRouter);
        api.use('/chat', chatRouter);
        api.use('/system', systemRouter);
        api.use('/applications', applicationRouter);

        this.app.use('/api', api);
    }

    public listen(port: number | string): void {
        this.app.listen(port, () => {
            console.log(`Arena Server listening on port ${port}`);
        });
    }
}
