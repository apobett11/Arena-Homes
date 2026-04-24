import bcrypt from 'bcrypt';
import { AuditContext } from '../../modules/audit/types';

/**
 * Seeding Utilities
 * Helper functions for idempotent, deterministic seeding
 */

// SYSTEM Actor for seeding operations
export const SYSTEM_ACTOR_EMAIL = 'system@arenahomes.test';
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001'; // Stable UUID for SYSTEM

/**
 * Creates a consistent AuditContext for seeding operations
 */
export function createSeedAuditContext(action: string): AuditContext {
    return {
        actorId: SYSTEM_ACTOR_ID,
        actorType: 'SYSTEM',
        action,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-runner',
        correlationId: `seed-${Date.now()}`,
    };
}

/**
 * Hash password with bcrypt (consistent rounds for testing)
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
}

/**
 * Deterministic random number generator (seeded)
 * For repeatable "random" data generation
 */
export class SeededRandom {
    private seed: number;

    constructor(seed: number = 12345) {
        this.seed = seed;
    }

    next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    choice<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

/**
 * Generate stable unit code
 */
export function generateUnitCode(propertyPrefix: string, type: string, index: number): string {
    const typeMap: Record<string, string> = {
        SINGLE: 'S',
        BEDSITTER: 'BS',
        ONE_BEDROOM: '1B',
        TWO_BEDROOM: '2B',
        APARTMENT: 'APT',
    };
    return `${propertyPrefix}-${typeMap[type] || 'U'}${index}`;
}

/**
 * Generate MPESA reference for seeding
 */
export function generateMpesaReference(index: number, status: 'SUCCESS' | 'FAILED' = 'SUCCESS'): string {
    const statusPrefix = status === 'FAILED' ? 'FAIL-' : '';
    return `SEED-MPESA-${statusPrefix}${String(index).padStart(4, '0')}`;
}

/**
 * Get date offset (for historical data)
 */
export function getDateOffset(monthsAgo: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return date;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Logging utilities
 */
export const seedLog = {
    section: (title: string) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`  ${title}`);
        console.log(`${'='.repeat(60)}\n`);
    },
    info: (message: string) => {
        console.log(`✓ ${message}`);
    },
    warn: (message: string) => {
        console.log(`⚠ ${message}`);
    },
    error: (message: string) => {
        console.error(`✗ ${message}`);
    },
    data: (label: string, value: any) => {
        console.log(`  ${label}: ${value}`);
    },
};
