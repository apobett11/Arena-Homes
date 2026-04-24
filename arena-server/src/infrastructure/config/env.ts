import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Backend default is 4000 (matches docs and avoids conflict with Next.js dev server on 3000)
    PORT: z.coerce.number().default(4000),

    // Database
    DATABASE_URL: z.string().url(),

    // Security
    JWT_SECRET: z.string().min(16),
    REFRESH_TOKEN_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:', error.issues);
            process.exit(1);
        }
        throw error;
    }
};

export const env = validateEnv();
