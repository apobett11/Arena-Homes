import { pgTable, text, timestamp, uuid, decimal, pgEnum, integer } from 'drizzle-orm/pg-core';

export const budgetStatusEnum = pgEnum('budget_status', ['DRAFT', 'ACTIVE', 'CLOSED']);

export const budgets = pgTable('budgets', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    status: budgetStatusEnum('status').default('DRAFT').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const budgetAllocations = pgTable('budget_allocations', {
    id: uuid('id').defaultRandom().primaryKey(),
    budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
    category: text('category').notNull(), // e.g. 'MAINTENANCE', 'SALARY'
    allocatedAmount: decimal('allocated_amount', { precision: 12, scale: 2 }).notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
