import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { TenantRepository } from './repository';
import { db } from '../../infrastructure/orm/drizzle';
import { tenants } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /tenants
 * @access Admin, Caretaker
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req, res) => {
    try {
        const list = await db().select().from(tenants);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /tenants/:id
 */
router.get('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req, res) => {
    try {
        const item = await TenantRepository.get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /tenants/:id/evict
 * @desc Evict tenant
 */
router.post('/:id/evict', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'CARETAKER']), async (req: AuthenticatedRequest, res) => {
    try {
        await TenantRepository.updateStatus(req.params.id, 'EVICTED', req.auditContext!);
        // Logic to terminate active leases should also be triggered here or in Service
        res.json({ message: 'Tenant evicted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const tenantRouter = router;
