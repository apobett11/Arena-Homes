import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    schema: './src/infrastructure/orm/schema.ts',
    out: './src/infrastructure/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/db',
    },
    verbose: true,
    strict: true,
});
