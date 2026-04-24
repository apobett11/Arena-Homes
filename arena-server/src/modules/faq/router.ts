import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { faqs } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
    const list = await db().select().from(faqs);
    res.json(list);
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        await db().insert(faqs).values(req.body);
        res.status(201).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    await db().delete(faqs).where(eq(faqs.id, req.params.id));
    res.json({ success: true });
});

export const faqRouter = router;
