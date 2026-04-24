import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { db } from './drizzle';
import { log } from '../logger';

// Type alias for the transaction scope
// Since we don't have the full schema type yet, we use generic NodePgDatabase
type TxClient = NodePgDatabase<Record<string, never>> | NodePgDatabase<any>;

/**
 * Executes a callback within a database transaction.
 * Supports nested transactions via Drizzle's savepoints.
 */
export async function withTransaction<T>(
    callback: (tx: TxClient) => Promise<T>,
    existingTx?: TxClient
): Promise<T> {
    const database = existingTx || db();

    try {
        return await database.transaction(async (tx) => {
            return await callback(tx);
        });
    } catch (error) {
        log.error('Transaction Failed', error);
        throw error;
    }
}
