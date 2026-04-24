import { LedgerRepository, LedgerEntryInput } from './repository';
import { AuditContext } from '../audit/types';

export class LedgerService {
    public static async recordTransaction(
        data: {
            description: string;
            referenceId?: string;
            referenceType?: string;
            entries: LedgerEntryInput[];
        },
        context: AuditContext
    ): Promise<string> {
        // Validate Double Entry
        let totalDebit = 0;
        let totalCredit = 0;

        for (const entry of data.entries) {
            const val = parseFloat(entry.amount);
            if (isNaN(val) || val < 0) throw new Error(`Invalid amount: ${entry.amount}`);

            if (entry.direction === 'DEBIT') totalDebit += val;
            if (entry.direction === 'CREDIT') totalCredit += val;
        }

        // Float precision checks (allow tiny epsilon difference due to JS math, but strict accounting usually uses integers)
        // We stored as decimal, so comparing parsed floats.
        if (Math.abs(totalDebit - totalCredit) > 0.005) {
            throw new Error(`Ledger Transaction Unbalanced: Debit ${totalDebit} vs Credit ${totalCredit}`);
        }

        return await LedgerRepository.createTransaction(data, context);
    }
}
