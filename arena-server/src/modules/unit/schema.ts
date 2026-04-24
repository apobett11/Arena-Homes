import { pgTable, text, timestamp, uuid, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { properties } from '../property/schema';

export const unitStatusEnum = pgEnum('unit_status', ['VACANT', 'TAKEN']);

export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    propertyId: uuid('property_id').references(() => properties.id).notNull(),
    type: text('type').notNull(), // e.g., 'Single', 'Double'
    description: text('description'),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    status: unitStatusEnum('status').default('VACANT').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const unitAvailabilitySnapshots = pgTable('unit_availability_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    status: unitStatusEnum('status').notNull(),
    snapshotDate: timestamp('snapshot_date').defaultNow().notNull(),
    reason: text('reason'),
});
