#!/usr/bin/env node
import { Database } from '../../infrastructure/database/connection';
import { seedMinimal } from './minimal';
import { seedDemo } from './demo';
import { seedLog } from './utils';

/**
 * Arena Homes Seed Runner
 * 
 * Usage:
 *   npm run seed:minimal  - Fast smoke test dataset
 *   npm run seed:demo     - Larger dataset for charts/dashboards
 * 
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Uses domain services (not direct DB inserts for critical flows)
 * - Preserves invariants (ledger append-only, audit logs, etc.)
 * - Deterministic (repeatable results)
 */

async function main() {
    const mode = process.argv[2] || 'minimal';

    seedLog.section('Arena Homes Seed Runner');
    seedLog.data('Mode', mode.toUpperCase());
    seedLog.data('Timestamp', new Date().toISOString());

    // Initialize database connection
    try {
        Database.initialize();
        seedLog.info('Database connection initialized');
    } catch (error) {
        seedLog.error('Failed to initialize database connection');
        console.error(error);
        process.exit(1);
    }

    // Run appropriate seed
    try {
        switch (mode.toLowerCase()) {
            case 'minimal':
                await seedMinimal();
                break;
            case 'demo':
                await seedDemo();
                break;
            default:
                seedLog.error(`Unknown seed mode: ${mode}`);
                seedLog.info('Valid modes: minimal, demo');
                process.exit(1);
        }
    } catch (error) {
        seedLog.error('Seed execution failed');
        console.error(error);
        process.exit(1);
    } finally {
        // Close database connection
        try {
            await Database.close();
            seedLog.info('Database connection closed');
        } catch (error) {
            seedLog.warn('Error closing database connection');
            console.error(error);
        }
    }

    seedLog.section('Seed Runner - Exit');
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error in seed runner:');
        console.error(error);
        process.exit(1);
    });
}

export { main as runSeed };
