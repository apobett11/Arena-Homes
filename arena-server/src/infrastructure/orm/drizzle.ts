import { drizzle } from 'drizzle-orm/node-postgres';
import { Database } from '../database/connection';

// Placeholder for schema until models are defined logic
// In Phase 11.2 we don't have models yet, so we pass an empty object or basic types
export const db = () => {
    const pool = Database.getPool();
    return drizzle(pool, {
        logger: process.env.NODE_ENV === 'development',
    });
};
