import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { tenants } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class TenantRepository {
    public static async create(
        userId: string,
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const existing = await tx.select().from(tenants).where(eq(tenants.userId, userId));
            if (existing.length > 0) return existing[0].id;

            const [newTenant] = await tx
                .insert(tenants)
                .values({
                    userId: userId,
                    status: 'PROSPECT',
                })
                .returning({ id: tenants.id });

            await AuditService.log(
                context,
                'TENANT',
                newTenant.id,
                { action: 'CREATE_TENANT_RECORD', userId },
                tx
            );

            return newTenant.id;
        });
    }

    public static async updateStatus(
        id: string,
        status: 'PROSPECT' | 'ACTIVE' | 'PAST' | 'EVICTED',
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            const current = await tx.select().from(tenants).where(eq(tenants.id, id));
            if (!current[0]) throw new Error('Tenant not found');

            await tx.update(tenants).set({ status, updatedAt: new Date() }).where(eq(tenants.id, id));

            await AuditService.log(
                context,
                'TENANT',
                id,
                { action: 'UPDATE_TENANT_STATUS', old: current[0].status, new: status },
                tx
            );
        });
    }

    public static async get(id: string) {
        return (await db().select().from(tenants).where(eq(tenants.id, id)))[0] || null;
    }

    public static async getByUserId(userId: string) {
        return (await db().select().from(tenants).where(eq(tenants.userId, userId)))[0] || null;
    }
}
