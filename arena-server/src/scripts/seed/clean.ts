
import { Database } from '../../infrastructure/database/connection';
import { db } from '../../infrastructure/orm/drizzle';
import { sql } from 'drizzle-orm';
import { seedLog } from './utils';

async function clean() {
    seedLog.section('Cleaning Database (Safe Tables)');
    Database.initialize();
    const database = db();

    // List of tables to truncate (order matters for foreign keys if we don't cascade, but CASCADE handles it)
    // We use CASCADE to ensure child records are removed.
    const tables = [
        'financial_snapshots',
        'budget_allocations',
        'budgets',
        'notifications',
        'announcements',
        'maintenance_requests',
        'issues',
        'payments',
        'leases',
        'tenant_profiles',
        'tenants',
        'units',
        'properties',
        'employee_profiles',
        'users',
        // 'roles', // Keep roles as they are static
    ];

    try {
        for (const table of tables) {
            try {
                await database.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`));
                seedLog.info(`Truncated table: ${table}`);
            } catch (err) {
                seedLog.warn(`Could not truncate table ${table} (it may not exist yet)`);
            }
        }
        seedLog.section('Clean Complete ✓');
    } catch (error) {
        seedLog.error('Clean failed');
        console.error(error);
        process.exit(1);
    }
}

if (require.main === module) {
    clean().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
