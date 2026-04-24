import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { BudgetRepository } from './repository';
import { db } from '../../infrastructure/orm/drizzle';
import { budgets } from './schema';

const router = Router();

/**
 * @route POST /budgets
 * @access Accountant, Admin
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthenticatedRequest, res) => {
    try {
        const id = await BudgetRepository.create(req.body, req.auditContext!);
        res.status(201).json({ id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /budgets
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req, res) => {
    try {
        const list = await db().select().from(budgets);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const budgetRouter = router;
