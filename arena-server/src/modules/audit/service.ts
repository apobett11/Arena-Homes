import { db } from '../../infrastructure/orm/drizzle';
import { auditLogs } from './schema';
import { AuditContext, AuditLogEntry } from './types';
import { log } from '../../infrastructure/logger';

export class AuditService {
    /**
     * Records an action in the immutable audit log.
     * This should be called within the same transaction as the business operation if possible.
     */
    public static async log(
        context: AuditContext,
        targetEntity: string,
        targetId: string,
        diff: Record<string, any>,
        tx?: any
    ): Promise<void> {
        const entry = {
            actorId: context.actorId,
            action: context.action,
            targetEntity: targetEntity,
            targetId: targetId,
            diffJson: diff,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        };

        try {
            const database = tx || db();
            await database.insert(auditLogs).values(entry);
        } catch (error) {
            // Audit logging critical failure
            // In a high-security system, if audit fails, the transaction should fail.
            log.error('CRITICAL: Failed to write audit log', error);
            throw new Error('Audit logging failed. Transaction aborted for security.');
        }
    }
}
