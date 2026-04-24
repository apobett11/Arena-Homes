import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const faqs = pgTable('faqs', {
    id: uuid('id').defaultRandom().primaryKey(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category'),
    order: integer('order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
