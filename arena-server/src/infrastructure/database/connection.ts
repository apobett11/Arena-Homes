import { Pool } from 'pg';
import { env } from '../config/env';
import { log } from '../logger';

export class Database {
    private static pool: Pool;

    public static initialize(): void {
        if (!this.pool) {
            this.pool = new Pool({
                connectionString: env.DATABASE_URL,
                max: 20, // Max clients in the pool
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            this.pool.on('error', (err) => {
                log.error('Unexpected error on idle client', err);
                process.exit(-1);
            });

            this.pool.on('connect', () => {
                log.debug('New database client connected');
            });
        }
    }

    public static getPool(): Pool {
        if (!this.pool) {
            throw new Error('Database not initialized. Call Database.initialize() first.');
        }
        return this.pool;
    }

    public static async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            log.info('Database pool closed');
        }
    }
}
