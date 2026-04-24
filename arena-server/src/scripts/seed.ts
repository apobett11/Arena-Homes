import { db } from '../infrastructure/orm/drizzle';
import { roles, permissions, rolePermissions } from '../infrastructure/orm/schema';
import { log } from '../infrastructure/logger';

async function seed() {
    log.info('🌱 Starting Database Seed...');

    // 1. Seed Roles
    const ROLES = [
        { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'System Owner' },
        { id: 'ACCOUNTANT', name: 'Accountant', description: 'Financial Controller' },
        { id: 'CARETAKER', name: 'Caretaker', description: 'Property Manager' },
        { id: 'IT_SUPPORT', name: 'IT Support', description: 'Tech Support' },
        { id: 'TENANT', name: 'Tenant', description: 'Resident' },
    ];

    try {
        for (const role of ROLES) {
            log.info(`Seeding Role: ${role.id}`);
            await db()
                .insert(roles)
                .values(role)
                .onConflictDoUpdate({ target: roles.id, set: role });
        }

        // 2. Seed Permissions (Stubbed)
        const PERMISSIONS = [
            { id: 'users.manage', description: 'Create and edit users' },
            { id: 'finance.read', description: 'View financial records' },
            { id: 'finance.write', description: 'Create ledger entries' },
            { id: 'leases.manage', description: 'Manage leases' },
        ];

        for (const perm of PERMISSIONS) {
            await db()
                .insert(permissions)
                .values(perm)
                .onConflictDoNothing();
        }

        // 3. Map Roles to Permissions (Simple Stub)
        const ROLE_MAP = [
            { roleId: 'SUPER_ADMIN', permissions: ['users.manage', 'finance.read', 'finance.write', 'leases.manage'] },
            { roleId: 'ACCOUNTANT', permissions: ['finance.read', 'finance.write'] },
            { roleId: 'CARETAKER', permissions: ['leases.manage'] },
        ];

        for (const map of ROLE_MAP) {
            for (const permId of map.permissions) {
                await db()
                    .insert(rolePermissions)
                    .values({ roleId: map.roleId, permissionId: permId })
                    .onConflictDoNothing();
            }
        }

        log.info('✅ Seeding Complete');
        process.exit(0);
    } catch (err) {
        log.error('❌ Seeding Failed', err);
        process.exit(1);
    }
}

seed();
