import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const announcements = pgTable('announcements', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: uuid('author_id').references(() => users.id).notNull(),
    targetRole: text('target_role'), // 'TENANT', 'ALL', etc.
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
