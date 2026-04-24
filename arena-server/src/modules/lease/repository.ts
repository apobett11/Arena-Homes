import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { leases, leaseHistory } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class LeaseRepository {
    public static async create(
        data: {
            tenantId: string;
            unitId: string;
            startDate: string;
            endDate: string;
            pdfUrl?: string;
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const [newLease] = await tx
                .insert(leases)
                .values({
                    tenantId: data.tenantId,
                    unitId: data.unitId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: 'PENDING',
                    pdfUrl: data.pdfUrl,
                })
                .returning({ id: leases.id });

            // History
            await tx.insert(leaseHistory).values({
                leaseId: newLease.id,
                changeType: 'CREATE',
                newStatus: 'PENDING',
                reason: 'Initial creation',
            });

            await AuditService.log(
                context,
                'LEASE',
                newLease.id,
                { action: 'CREATE_LEASE', data },
                tx
            );

            return newLease.id;
        });
    }

    public static async updateStatus(
        id: string,
        item: { status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED'; reason: string },
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            const current = await tx.select().from(leases).where(eq(leases.id, id));
            if (!current[0]) throw new Error('Lease not found');

            await tx.update(leases)
                .set({ status: item.status, updatedAt: new Date() })
                .where(eq(leases.id, id));

            // History
            await tx.insert(leaseHistory).values({
                leaseId: id,
                changeType: 'STATUS_CHANGE',
                previousStatus: current[0].status,
                newStatus: item.status,
                reason: item.reason,
            });

            await AuditService.log(
                context,
                'LEASE',
                id,
                { action: 'UPDATE_LEASE_STATUS', old: current[0].status, new: item.status },
                tx
            );
        });
    }

    public static async get(id: string) {
        return (await db().select().from(leases).where(eq(leases.id, id)))[0] || null;
    }
}
