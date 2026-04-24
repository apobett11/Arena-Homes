import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const maintenanceStatusEnum = pgEnum('maintenance_status', ['SCHEDULED', 'COMPLETED', 'CANCELLED']);

export const maintenanceRequests = pgTable('maintenance_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    scheduledDate: timestamp('scheduled_date').notNull(),
    status: maintenanceStatusEnum('status').default('SCHEDULED').notNull(),
    assignedToId: uuid('assigned_to_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
