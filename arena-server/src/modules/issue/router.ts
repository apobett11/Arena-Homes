import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { IssueRepository } from './repository';
import { db } from '../../infrastructure/orm/drizzle';
import { issues } from './schema';

const router = Router();

router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req, res) => {
    try {
        const list = await db().select().from(issues);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { unitId, type, title, description, priority } = req.body;
        const id = await IssueRepository.create({
            reporterId: req.user!.id,
            unitId, type, title, description, priority
        }, req.auditContext!);
        res.status(201).json({ id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/resolve', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        await IssueRepository.updateStatus(req.params.id, 'RESOLVED', req.auditContext!);
        res.json({ message: 'Resolved' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const issueRouter = router;
