import { pgTable, text, timestamp, uuid, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const ledgerAccountTypeEnum = pgEnum('ledger_account_type', ['TENANT', 'PROPERTY', 'PLATFORM', 'EXTERNAL']);
export const ledgerEntryDirectionEnum = pgEnum('ledger_entry_direction', ['DEBIT', 'CREDIT']);

export const ledgerTransactions = pgTable('ledger_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    description: text('description').notNull(),
    referenceId: text('reference_id'), // e.g. Payment ID, Invoice ID
    referenceType: text('reference_type'), // 'PAYMENT', 'BILL', 'REFUND'
    postedAt: timestamp('posted_at').defaultNow().notNull(),
    metadata: text('metadata'), // JSON string or text for extra info
});

export const ledgerEntries = pgTable('ledger_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id').references(() => ledgerTransactions.id).notNull(),
    accountId: uuid('account_id').notNull(), // ID of Tenant, Property, or System ID
    accountType: ledgerAccountTypeEnum('account_type').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // Always positive value in DB? or Signed?
    // Standard accounting: Debit/Credit columns or a Direction column. 
    // Capturing Direction explicitly is safer for "Double Entry" logic visualization.
    direction: ledgerEntryDirectionEnum('direction').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
