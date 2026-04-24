import { App } from './app';
import * as dotenv from 'dotenv';
import { Database } from './infrastructure/database/connection';
import { log } from './infrastructure/logger';
import { env } from './infrastructure/config/env';

dotenv.config();

const port = env.PORT || 4000;

async function bootstrap() {
    try {
        log.info('🚀 Arena Homes Backend - Starting...');
        log.info(`📍 Environment: ${env.NODE_ENV}`);
        log.info(`🔌 Port: ${port}`);

        // Initialize Database Pool
        Database.initialize();
        log.info('✅ Database pool initialized');

        // Test Connection
        const pool = Database.getPool();
        const res = await pool.query('SELECT NOW()');
        log.info('✅ Database connection verified', { time: res.rows[0].now });

        // Check if migrations are applied (optional check)
        try {
            await pool.query('SELECT 1 FROM users LIMIT 1');
            log.info('✅ Database schema ready');
        } catch (error) {
            log.warn('⚠️  Database schema may not be initialized. Run: npm run db:push');
        }

        const app = new App();
        app.listen(port);

        log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log.info(`✅ Arena Server is LIVE`);
        log.info(`📡 API: http://localhost:${port}/api`);
        log.info(`🔍 Health: http://localhost:${port}/api/system/health`);
        log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
        log.error('❌ Failed to start server', error);
        process.exit(1);
    }
}

bootstrap();

