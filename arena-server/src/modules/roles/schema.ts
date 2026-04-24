import { pgTable, text } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
    id: text('id').primaryKey(), // e.g. 'SUPER_ADMIN'
    name: text('name').notNull(),
    description: text('description'),
});
