import { eq, sql } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { ledgerTransactions, ledgerEntries } from './schema';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';

export interface LedgerEntryInput {
    accountId: string;
    accountType: 'TENANT' | 'PROPERTY' | 'PLATFORM' | 'EXTERNAL';
    amount: string; // Decimal as string to avoid float precision issues
    direction: 'DEBIT' | 'CREDIT';
}

export class LedgerRepository {
    public static async createTransaction(
        data: {
            description: string;
            referenceId?: string;
            referenceType?: string;
            metadata?: string;
            entries: LedgerEntryInput[];
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            // 1. Create Header
            const [newTx] = await tx.insert(ledgerTransactions).values({
                description: data.description,
                referenceId: data.referenceId,
                referenceType: data.referenceType,
                metadata: data.metadata,
                postedAt: new Date(),
            }).returning({ id: ledgerTransactions.id });

            // 2. Create Entries
            await tx.insert(ledgerEntries).values(
                data.entries.map(entry => ({
                    transactionId: newTx.id,
                    accountId: entry.accountId,
                    accountType: entry.accountType,
                    amount: entry.amount,
                    direction: entry.direction,
                }))
            );

            // 3. Audit only the header creation, details are in the ledger itself (which is an audit trail)
            await AuditService.log(
                context,
                'FINANCIAL',
                newTx.id,
                { action: 'CREATE_LEDGER_TRANSACTION', totalEntries: data.entries.length },
                tx
            );

            return newTx.id;
        });
    }

    public static async getAccountBalance(accountId: string): Promise<string> {
        // Simple aggregation: Credits - Debits (Depending on account type normally, but let's assume Liability/Equity logic or Asset logic)
        // For Tenants (Asset from perspective of Company? No, Tenant Account usually represents their debt to us or their Wallet)
        // Let's standardise: 
        // If Tenant Account (Receivable): DEBIT increases balance (they owe more), CREDIT decreases (they paid).
        // Return Net Debit Balance.
        const result = await db().execute(sql`
            SELECT 
                SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END) as balance 
            FROM ${ledgerEntries} 
            WHERE account_id = ${accountId}
        `);
        return result.rows[0]?.balance as string || '0.00';
    }

    public static async getPropertyFinancials(propertyId: string, startDate: Date, endDate: Date) {
        // Get all income/expense entries for a property within date range
        // Property account usually: CREDIT = Income, DEBIT = Expense (if tracking P&L directly on property account) or transfer to checking.
        // This is a simplified view. 
        return await db().select().from(ledgerEntries)
            .leftJoin(ledgerTransactions, eq(ledgerEntries.transactionId, ledgerTransactions.id))
            .where(sql`${ledgerEntries.accountId} = ${propertyId} 
                    AND ${ledgerTransactions.postedAt} >= ${startDate} 
                    AND ${ledgerTransactions.postedAt} <= ${endDate}`);
    }
}
