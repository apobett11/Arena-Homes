import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { LeaseService } from './service';
import { LeaseRepository } from './repository';
import { db } from '../../infrastructure/orm/drizzle';
import { leases } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /leases
 * @access Admin, Accountant, Caretaker
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CARETAKER']), async (req, res) => {
    try {
        const list = await db().select().from(leases);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /leases
 * @desc Create draft lease (Caretaker)
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        // tenantId, unitId, startDate, endDate
        const id = await LeaseService.draftLease(req.body, req.auditContext!);
        res.status(201).json({ id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PATCH /leases/:id/activate
 * @desc Activate lease (e.g. after payment or signing)
 */
router.patch('/:id/activate', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        await LeaseService.activateLease(req.params.id, req.auditContext!);
        res.json({ message: 'Lease activated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PATCH /leases/:id/terminate
 */
router.patch('/:id/terminate', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        const { reason } = req.body;
        await LeaseService.terminateLease(req.params.id, reason || 'Manual termination', req.auditContext!);
        res.json({ message: 'Lease terminated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const leaseRouter = router;
