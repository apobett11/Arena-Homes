import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { units, unitAvailabilitySnapshots } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class UnitRepository {
    public static async create(
        data: {
            propertyId: string;
            type: string;
            description?: string;
            basePrice: string;
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const [newUnit] = await tx
                .insert(units)
                .values({
                    propertyId: data.propertyId,
                    type: data.type,
                    description: data.description,
                    basePrice: data.basePrice,
                    status: 'VACANT',
                })
                .returning({ id: units.id });

            // Initial snapshot
            await tx.insert(unitAvailabilitySnapshots).values({
                unitId: newUnit.id,
                status: 'VACANT',
                reason: 'Initial creation',
            });

            await AuditService.log(
                context,
                'UNIT',
                newUnit.id,
                { action: 'CREATE_UNIT', data },
                tx
            );

            return newUnit.id;
        });
    }

    public static async updateStatus(
        id: string,
        newStatus: 'VACANT' | 'TAKEN',
        reason: string,
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            const current = await tx.select().from(units).where(eq(units.id, id)).execute();
            if (!current[0]) throw new Error('Unit not found');

            if (current[0].status === newStatus) return;

            await tx.update(units)
                .set({ status: newStatus, updatedAt: new Date() })
                .where(eq(units.id, id));

            // Snapshot
            await tx.insert(unitAvailabilitySnapshots).values({
                unitId: id,
                status: newStatus,
                reason: reason,
            });

            await AuditService.log(
                context,
                'UNIT',
                id,
                { action: 'UPDATE_UNIT_STATUS', old: current[0].status, new: newStatus, reason },
                tx
            );
        });
    }

    public static async get(id: string) {
        const result = await db().select().from(units).where(eq(units.id, id));
        return result[0] || null;
    }

    public static async listAll() {
        return await db().select().from(units);
    }

    public static async listByProperty(propertyId: string) {
        return await db().select().from(units).where(eq(units.propertyId, propertyId));
    }
}
