import { sql } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { ledgerEntries, ledgerTransactions } from '../ledger/schema';
import { financialSnapshots } from '../financial_snapshot/schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class ReportingService {
    public static async generateMonthlySnapshot(
        month: number,
        year: number,
        propertyId: string | null = null, // Optional filtering
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            // 1. Calculate Aggregates from Ledger
            // Logic: 
            // Income = Sum of DEBITS to PLATFORM accounts (Cash In) - simplistic cash basis
            // Expenses = Sum of CREDITS to PLATFORM accounts (Cash Out)

            // Date Range
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            // Fetch aggregates
            // This query is illustrative. Complex accounting needs a proper Chart of Accounts.
            // Using 'PLATFORM' account type as the company's books.

            const result = await tx.execute(sql`
                SELECT 
                    SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) as total_debit, -- Cash In (Income)
                    SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END) as total_credit -- Cash Out (Expense)
                FROM ${ledgerEntries} le
                JOIN ${ledgerTransactions} lt ON le.transaction_id = lt.id
                WHERE le.account_type = 'PLATFORM'
                AND lt.posted_at >= ${startDate}
                AND lt.posted_at <= ${endDate}
                -- Filter by property if needed (would require tagging capability on transactions)
            `);

            const row = result.rows[0] as { total_debit: string; total_credit: string } | undefined;
            const income = parseFloat(row?.total_debit || '0');
            const expenses = parseFloat(row?.total_credit || '0');
            const netProfit = income - expenses;

            // 2. Create Snapshot
            const [snapshot] = await tx.insert(financialSnapshots).values({
                month,
                year,
                propertyId,
                totalIncome: income.toString(),
                totalExpenses: expenses.toString(),
                netProfit: netProfit.toString(),
                status: 'DRAFT',
            }).returning({ id: financialSnapshots.id });

            // 3. Audit
            await AuditService.log(
                context,
                'SYSTEM',
                snapshot.id,
                { action: 'GENERATE_FINANCIAL_SNAPSHOT', month, year, income, expenses },
                tx
            );

            return snapshot.id;
        });
    }
}
