import { log } from '../logger';

/**
 * Guards specifically meant to prevent mutation of the Immutable Ledger and Audit Logs.
 * These should be called before any write operation in logical services.
 */

const IMMUTABLE_TABLES = ['ledger_entries', 'audit_logs', 'financial_snapshots'] as const;
type ImmutableTable = (typeof IMMUTABLE_TABLES)[number];

export class ImmutabilityGuard {
    /**
     * Throws an error if an UPDATE or DELETE is attempted on an immutable table.
     * usage: Guard.assertSafeWrite('ledger_entries', 'UPDATE');
     */
    public static assertSafeWrite(
        tableName: string,
        operation: 'INSERT' | 'UPDATE' | 'DELETE',
    ): void {
        if (IMMUTABLE_TABLES.includes(tableName as ImmutableTable)) {
            if (operation === 'UPDATE' || operation === 'DELETE') {
                const errorMsg = `SECURITY VIOLATION: Attempted ${operation} on immutable table '${tableName}'.`;
                log.error(errorMsg, { tableName, operation });
                throw new Error(errorMsg);
            }
        }
    }

    /**
     * Ensures that financial corrections are strictly additive.
     * We never modify the original record.
     */
    public static validateCorrection(
        originalTransactionId: string,
        correctionPayload: any
    ): void {
        if (!originalTransactionId) {
            throw new Error('Correction must reference an original transaction ID');
        }
        // Further logic will go here when we have the LedgerEntry entity
    }
}
