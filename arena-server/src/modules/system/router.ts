import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/logs', authenticate, requireRole(['IT_SUPPORT', 'SUPER_ADMIN']), async (req, res) => {
    // Audit logs via AuditService or direct DB query
    // Stub
    res.json({ message: 'Logs endpoint' });
});

router.get('/diagnostics', authenticate, requireRole(['IT_SUPPORT', 'SUPER_ADMIN']), async (req, res) => {
    const dbTime = await db().execute(sql`SELECT NOW()`);
    res.json({
        status: 'HEALTHY',
        db: 'CONNECTED',
        time: dbTime.rows[0].now,
        uptime: process.uptime()
    });
});

export const systemRouter = router;
