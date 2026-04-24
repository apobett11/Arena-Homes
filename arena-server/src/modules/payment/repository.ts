import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { payments } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class PaymentRepository {
    public static async create(
        data: {
            tenantId: string;
            leaseId?: string;
            amount: string;
            gateway: 'MPESA' | 'STRIPE' | 'CASH' | 'BANK_TRANSFER';
            description?: string;
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const [payment] = await tx
                .insert(payments)
                .values({
                    tenantId: data.tenantId,
                    leaseId: data.leaseId,
                    amount: data.amount,
                    gateway: data.gateway,
                    description: data.description,
                    status: 'PENDING',
                })
                .returning({ id: payments.id });

            await AuditService.log(
                context,
                'PAYMENT',
                payment.id,
                { action: 'INITIATE_PAYMENT', data },
                tx
            );

            return payment.id;
        });
    }

    public static async updateStatus(
        id: string,
        status: 'SUCCESS' | 'FAILED',
        gatewayTransactionId: string | null,
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            await tx.update(payments)
                .set({
                    status: status,
                    gatewayTransactionId: gatewayTransactionId,
                    updatedAt: new Date()
                })
                .where(eq(payments.id, id));

            await AuditService.log(
                context,
                'PAYMENT',
                id,
                { action: 'UPDATE_PAYMENT_STATUS', status, gatewayTransactionId },
                tx
            );
        });
    }

    public static async get(id: string) {
        const result = await db().select().from(payments).where(eq(payments.id, id));
        return result[0] || null;
    }
}
