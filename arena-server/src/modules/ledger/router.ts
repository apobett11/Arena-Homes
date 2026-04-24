import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware';
import { db } from '../../infrastructure/orm/drizzle';
import { ledgerEntries, ledgerTransactions } from './schema';

const router = Router();

/**
 * @route GET /ledger
 * @desc View Ledger History (ReadOnly)
 * @access Admin, Accountant
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req, res) => {
    try {
        // Should support robust filtering (date range, account type)
        // Returning Limit 100 for safety
        const list = await db().select().from(ledgerTransactions).limit(100);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /ledger/entries
 * @desc Detailed entries
 */
router.get('/entries', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req, res) => {
    try {
        const list = await db().select().from(ledgerEntries).limit(200);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const ledgerRouter = router;
