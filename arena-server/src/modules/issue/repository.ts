import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { issues } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class IssueRepository {
    public static async create(
        data: {
            reporterId: string;
            unitId?: string;
            type: string;
            title: string;
            description?: string;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const [newIssue] = await tx.insert(issues).values({
                reporterId: data.reporterId,
                unitId: data.unitId,
                type: data.type,
                title: data.title,
                description: data.description,
                priority: data.priority || 'LOW',
                status: 'OPEN',
            }).returning({ id: issues.id });

            await AuditService.log(context, 'ISSUE', newIssue.id, { action: 'CREATE_ISSUE', data }, tx);
            return newIssue.id;
        });
    }

    public static async updateStatus(
        id: string,
        status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            await tx.update(issues).set({ status, updatedAt: new Date() }).where(eq(issues.id, id));
            await AuditService.log(context, 'ISSUE', id, { action: 'UPDATE_ISSUE_STATUS', status }, tx);
        });
    }
}
