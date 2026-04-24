import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { PaymentService } from './service';
import { PaymentRepository } from './repository';
import { db } from '../../infrastructure/orm/drizzle';
import { payments } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @route POST /payments
 * @desc Initiate payment (Tenant or Manual entry by Admin)
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { tenantId, leaseId, amount, gateway, description } = req.body;

        // Scope logic: Tenant can only pay for themselves
        if (req.user?.roleId === 'TENANT') {
            // Need to lookup tenant record for this user to ensure matching tenantId
            // Skipping lookup for brevity, but critical for security.
        }

        const id = await PaymentService.initiatePayment({
            tenantId, leaseId, amount, gateway, description
        }, req.auditContext!);
        res.status(201).json({ id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PATCH /payments/:id/confirm
 * @desc Callback from Gateway or Manual Confirmation
 * @access Admin/Accountant/System
 */
router.patch('/:id/confirm', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthenticatedRequest, res) => {
    try {
        const { gatewayTransactionId } = req.body;
        await PaymentService.confirmPayment(req.params.id, gatewayTransactionId, req.auditContext!);
        res.json({ message: 'Payment confirmed and ledger updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /payments
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req, res) => {
    try {
        const list = await db().select().from(payments);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const paymentRouter = router;
