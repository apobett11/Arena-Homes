import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const chatThreads = pgTable('chat_threads', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').default('DIRECT'), // 'DIRECT', 'GROUP'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatParticipants = pgTable('chat_participants', {
    threadId: uuid('thread_id').references(() => chatThreads.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => ({
    // composite primary key removed for simplicity in Drizzle unless strictly needed, but logical uniqueness required
}));

export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    threadId: uuid('thread_id').references(() => chatThreads.id).notNull(),
    senderId: uuid('sender_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
