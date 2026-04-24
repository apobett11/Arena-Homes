import { pgTable, uuid, text, timestamp, boolean, inet } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    tokenHash: text('token_hash').notNull(), // Hashed for security
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    replacedBy: uuid('replaced_by'), // Links to the new token in the rotation chain
});
