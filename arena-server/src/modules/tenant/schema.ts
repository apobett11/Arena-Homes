import { pgTable, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const tenantStatusEnum = pgEnum('tenant_status', ['PROSPECT', 'ACTIVE', 'PAST', 'EVICTED']);

export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull().unique(),
    status: tenantStatusEnum('status').default('PROSPECT').notNull(),
    totalMonthsPaid: integer('total_months_paid').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
