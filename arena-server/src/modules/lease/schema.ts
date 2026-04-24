import { pgTable, text, timestamp, uuid, pgEnum, date } from 'drizzle-orm/pg-core';
import { tenants } from '../tenant/schema';
import { units } from '../unit/schema';

export const leaseStatusEnum = pgEnum('lease_status', ['PENDING', 'ACTIVE', 'COMPLETED', 'TERMINATED']);

export const leases = pgTable('leases', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: leaseStatusEnum('status').default('PENDING').notNull(),
    pdfUrl: text('pdf_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaseHistory = pgTable('lease_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    leaseId: uuid('lease_id').references(() => leases.id).notNull(),
    changeType: text('change_type').notNull(),
    previousStatus: text('previous_status'),
    newStatus: text('new_status'),
    changedAt: timestamp('changed_at').defaultNow().notNull(),
    reason: text('reason'),
});
