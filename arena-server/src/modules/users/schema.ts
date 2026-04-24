import { pgTable, text, timestamp, boolean, uuid, json } from 'drizzle-orm/pg-core';
import { roles } from '../roles/schema';
import { properties } from '../property/schema';
// I'll comment out the property relation for now to avoid breaking if units schema doesn't exist.
// Or I will create a stub in units.

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    roleId: text('role_id').references(() => roles.id).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
});

export const employeeProfiles = pgTable('employee_profiles', {
    userId: uuid('user_id').references(() => users.id).primaryKey(),
    fullName: text('full_name').notNull(),
    username: text('username'), // Added per request
    avatarUrl: text('avatar_url'), // Added per request
    nationalId: text('national_id'), // Encrypted in app logic
    phoneNumber: text('phone_number').notNull(),
    jobTitle: text('job_title'),
    assignedPropertyId: uuid('assigned_property_id').references(() => properties.id),
    editableFields: json('editable_fields'), // Added per request
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tenantProfiles = pgTable('tenant_profiles', {
    userId: uuid('user_id').references(() => users.id).primaryKey(),
    fullName: text('full_name').notNull(),
    username: text('username'), // Added per request
    avatarUrl: text('avatar_url'), // Added per request
    phoneNumber: text('phone_number').notNull(),
    idNumber: text('id_number'), // Encrypted in logic
    emergencyContactJson: json('emergency_contact_json'),
    universityRegNo: text('university_reg_no'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
