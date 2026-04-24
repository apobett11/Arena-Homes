import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { UnitRepository } from './repository';

const router = Router();

/**
 * @route GET /units
 */
router.get('/', async (req, res) => {
    try {
        const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
        const items = propertyId
            ? await UnitRepository.listByProperty(propertyId)
            : await UnitRepository.listAll();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /units/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const item = await UnitRepository.get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /units
 * @access Admin, Caretaker
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        const id = await UnitRepository.create(req.body, req.auditContext!);
        res.status(201).json({ id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PATCH /units/:id/status
 * @access Caretaker, Admin
 */
router.patch('/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        const { status, reason } = req.body;
        await UnitRepository.updateStatus(req.params.id, status, reason, req.auditContext!);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const unitRouter = router;
