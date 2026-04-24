import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const rules = pgTable('rules', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
