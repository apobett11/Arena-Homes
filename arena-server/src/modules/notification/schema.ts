import { pgTable, text, timestamp, uuid, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'WARNING', 'ALERT', 'SUCCESS']);

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: notificationTypeEnum('type').default('INFO').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    linkUrl: text('link_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
