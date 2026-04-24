import { pgTable, text, timestamp, uuid, json } from 'drizzle-orm/pg-core';
import { users } from '../users/schema';

export const properties = pgTable('properties', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    location: text('location').notNull(),
    caretakerId: uuid('caretaker_id').references(() => users.id), // Nullable if not assigned yet? Requirement says Caretaker manages.
    logoUrl: text('logo_url'),
    facilities: json('facilities'), // e.g. ["wifi", "parking"]
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
