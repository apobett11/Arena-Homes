import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';
import { units } from '../unit/schema';

export const issueStatusEnum = pgEnum('issue_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const issuePriorityEnum = pgEnum('issue_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const issues = pgTable('issues', {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id').references(() => users.id).notNull(),
    unitId: uuid('unit_id').references(() => units.id), // Optional if it's a general property issue
    type: text('type').notNull(), // 'PLUMBING', 'ELECTRICAL', 'NOISE', 'OTHER'
    title: text('title').notNull(),
    description: text('description'),
    status: issueStatusEnum('status').default('OPEN').notNull(),
    priority: issuePriorityEnum('priority').default('LOW').notNull(),
    assignedToId: uuid('assigned_to_id').references(() => users.id), // Staff assigned
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
