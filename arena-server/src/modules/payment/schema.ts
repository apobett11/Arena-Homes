import { pgTable, text, timestamp, uuid, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from '../tenant/schema';

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCESS', 'FAILED']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['MPESA', 'STRIPE', 'CASH', 'BANK_TRANSFER']);

export const payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    leaseId: uuid('lease_id'), // Optional, payment might be a general deposit or not linked to current lease
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('KES').notNull(),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    gateway: paymentGatewayEnum('gateway').notNull(),
    gatewayTransactionId: text('gateway_transaction_id'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
