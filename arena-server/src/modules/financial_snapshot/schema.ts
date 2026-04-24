import { pgTable, integer, uuid, decimal, pgEnum, timestamp, text } from 'drizzle-orm/pg-core';
import { properties } from '../property/schema';

export const snapshotStatusEnum = pgEnum('snapshot_status', ['DRAFT', 'FINALIZED']);

export const financialSnapshots = pgTable('financial_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    propertyId: uuid('property_id').references(() => properties.id), // Null for global snapshot

    totalIncome: decimal('total_income', { precision: 12, scale: 2 }).default('0').notNull(),
    totalExpenses: decimal('total_expenses', { precision: 12, scale: 2 }).default('0').notNull(),
    netProfit: decimal('net_profit', { precision: 12, scale: 2 }).default('0').notNull(),

    discrepancyAmount: decimal('discrepancy_amount', { precision: 12, scale: 2 }).default('0'),

    status: snapshotStatusEnum('status').default('DRAFT').notNull(),
    pdfUrl: text('pdf_url'), // Link to generated report

    generatedAt: timestamp('generated_at').defaultNow().notNull(),
});
