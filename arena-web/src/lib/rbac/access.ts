import { SYSTEM_ROLES } from './config';
import { UserRole } from './types';

/**
 * Checks if a role has a specific permission.
 * This is a basic implementation. For granular checks, we might need more complex logic
 * matched against the specific strings in config.ts.
 */
export function hasPermission(role: UserRole, type: 'view' | 'manage' | 'update' | 'create' | 'actions', keyword: string): boolean {
    const roleConfig = SYSTEM_ROLES[role];
    if (!roleConfig) return false;

    const permissions = roleConfig.permissions[type];
    if (!permissions) return false;

    // Simple keyword matching for this demo context
    // In a real app, 'keyword' would probably be a strictly typed ID
    // but here we match against the descriptive text provided in the prompt.
    return permissions.some(p => p.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * Returns the redirection path for a unauthorized access attempt based on role.
 */
export function getRedirectPath(role: UserRole): string {
    switch (role) {
        case UserRole.SUPER_ADMIN: return '/admin/dashboard';
        case UserRole.TENANT: return '/tenant/dashboard';
        case UserRole.CARETAKER: return '/caretaker/dashboard';
        case UserRole.ACCOUNTANT: return '/accountant/dashboard';
        case UserRole.IT_SUPPORT: return '/it-support/dashboard';
        default: return '/';
    }
}

/**
 * Validates if the user can access a specific route segment.
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
    if (role === UserRole.SUPER_ADMIN) return true; // Super admin sees all

    // Define route prefixes for roles (SUPER_ADMIN already returned above)
    if (path.startsWith('/admin')) return false;

    if (path.startsWith('/tenant')) {
        return role === UserRole.TENANT;
    }

    if (path.startsWith('/caretaker')) {
        return role === UserRole.CARETAKER;
    }

    if (path.startsWith('/accountant')) {
        return role === UserRole.ACCOUNTANT;
    }

    if (path.startsWith('/it-support')) {
        return role === UserRole.IT_SUPPORT;
    }

    return true; // Public routes
}
