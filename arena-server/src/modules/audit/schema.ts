import { pgTable, bigserial, text, timestamp, json, uuid, inet } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id').notNull(),
    action: text('action').notNull(),
    targetEntity: text('target_entity').notNull(),
    targetId: uuid('target_id').notNull(),
    diffJson: json('diff_json').notNull(),
    ipAddress: inet('ip_address').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
