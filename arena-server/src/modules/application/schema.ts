import { pgTable, uuid, text, timestamp, pgEnum, json, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { properties } from '../property/schema';
import { users } from '../users/schema';

export const applicationStatusEnum = pgEnum('application_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const tenantApplications = pgTable('tenant_applications', {
    id: uuid('id').defaultRandom().primaryKey(),
    propertyId: uuid('property_id').references(() => properties.id).notNull(),
    caretakerId: uuid('caretaker_id').references(() => users.id).notNull(),
    
    // Applicant details (captured at application time)
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phoneNumber: text('phone_number').notNull(),
    whatsappNumber: text('whatsapp_number'),
    universityRegNo: text('university_reg_no'),
    
    // Application details
    preferredMoveInDate: timestamp('preferred_move_in_date'),
    message: text('message'),
    status: applicationStatusEnum('status').default('PENDING').notNull(),
    
    // Caretaker response
    caretakerNotes: text('caretaker_notes'),
    respondedAt: timestamp('responded_at'),
    
    // Linked user after approval
    userId: uuid('user_id').references(() => users.id),
    
    // Onboarding tracking
    hasSetPassword: boolean('has_set_password').default(false),
    hasCompletedProfile: boolean('has_completed_profile').default(false),
    hasAcceptedAgreement: boolean('has_accepted_agreement').default(false),
    tempPassword: text('temp_password'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenantApplicationsRelations = relations(tenantApplications, ({ one }) => ({
    property: one(properties, {
        fields: [tenantApplications.propertyId],
        references: [properties.id],
    }),
    caretaker: one(users, {
        fields: [tenantApplications.caretakerId],
        references: [users.id],
    }),
    user: one(users, {
        fields: [tenantApplications.userId],
        references: [users.id],
    }),
}));
