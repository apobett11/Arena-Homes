import { pgTable, text } from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
    id: text('id').primaryKey(), // e.g., 'finance.approve'
    description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
    roleId: text('role_id').references(() => roles.id).notNull(),
    permissionId: text('permission_id').references(() => permissions.id).notNull(),
});

// Circular dependency fix: Roles needs to be defined or imported.
// In Drizzle, we can define them in the same file or separate.
// I'll create roles in valid schema file and import here or use delayed reference if needed.
// Actually, for circular refs in Drizzle, usually we define them in their modules.
// Let's rely on string references or define `roles` here just for type safety if needed,
// but better to put RolePermissions in the `roles` module or a join table module.
// The user asked for `src/modules/permissions/`.

// Re-writing to allow pure definition. I will handle relations in centralized schema if possible,
// or just use string names for FKs if Drizzle allows (it does, but object ref is better).
// For now, I will import roles from roles module to define FK.
import { roles } from '../roles/schema';
