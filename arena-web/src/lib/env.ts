/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

export function validateEnv() {
    const requiredEnvVars = {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    };

    const missing: string[] = [];

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach((key) => console.error(`   - ${key}`));
        console.error('\n💡 Copy .env.example to .env.local and fill in the values');
        throw new Error('Missing required environment variables');
    }

    console.log('✅ Environment variables validated');
    console.log(`📡 API Base URL: ${requiredEnvVars.NEXT_PUBLIC_API_URL}`);
}
