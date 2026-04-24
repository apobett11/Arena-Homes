import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { announcements } from './schema';
import { withTransaction } from '../../infrastructure/orm/transaction'; // Added missing import
import { AuditService } from '../audit/service'; // Added missing import

const router = Router();

router.get('/', async (req, res) => {
    // Public or Authenticated? Usually public for tenants
    const list = await db().select().from(announcements);
    res.json(list);
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        const { title, content, targetRole } = req.body;
        await withTransaction(async (tx) => {
            await tx.insert(announcements).values({
                title, content, targetRole, authorId: req.user!.id
            });
            await AuditService.log(req.auditContext!, 'ANNOUNCEMENT', 'NEW', { title }, tx);
        });
        res.status(201).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const announcementRouter = router;
