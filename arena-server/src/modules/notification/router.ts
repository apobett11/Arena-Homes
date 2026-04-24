import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { notifications } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const list = await db().select().from(notifications).where(eq(notifications.userId, req.user!.id));
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        await db().update(notifications).set({ isRead: true }).where(eq(notifications.id, req.params.id));
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const notificationRouter = router;
