import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { maintenanceRequests } from './schema';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { AuditService } from '../audit/service';

const router = Router();

router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req, res) => {
    try {
        const list = await db().select().from(maintenanceRequests);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        const { title, description, scheduledDate, assignedToId } = req.body;
        await withTransaction(async (tx) => {
            await tx.insert(maintenanceRequests).values({
                title, description, scheduledDate: new Date(scheduledDate), assignedToId
            });
            await AuditService.log(req.auditContext!, 'MAINTENANCE', 'NEW', { title }, tx);
        });
        res.status(201).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const maintenanceRouter = router;
