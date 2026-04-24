import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { chatThreads, chatMessages, chatParticipants } from './schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

router.get('/threads', authenticate, async (req, res) => {
    // Join threads where user is participant
    // Simplified stub
    res.json([]);
});

router.post('/threads', authenticate, async (req, res) => {
    // Create thread logic
    res.status(201).json({ success: true });
});

router.get('/threads/:id/messages', authenticate, async (req, res) => {
    const list = await db().select().from(chatMessages).where(eq(chatMessages.threadId, req.params.id));
    res.json(list);
});

router.post('/threads/:id/messages', authenticate, async (req: AuthenticatedRequest, res) => {
    const { content } = req.body;
    await db().insert(chatMessages).values({
        threadId: req.params.id,
        senderId: req.user!.id,
        content: content
    });
    res.status(201).json({ success: true });
});

export const chatRouter = router;
