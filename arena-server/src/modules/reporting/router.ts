import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { ReportingService } from './service';
import { db } from '../../infrastructure/orm/drizzle';
import { financialSnapshots } from '../financial_snapshot/schema';

const router = Router();

/**
 * @route POST /reports/snapshot
 * @desc Manually trigger monthly snapshot generation
 * @access Accountant/Admin
 */
router.post('/snapshot', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthenticatedRequest, res) => {
    try {
        const { month, year, propertyId } = req.body;
        const id = await ReportingService.generateMonthlySnapshot(month, year, propertyId, req.auditContext!);
        res.status(201).json({ id, message: 'Snapshot generated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /reports/snapshots
 */
router.get('/snapshots', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req, res) => {
    try {
        const list = await db().select().from(financialSnapshots);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const reportingRouter = router;
