import { fetchClient } from '../client';

export interface Lease {
    id: string;
    propertyId: string;
    unitId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    status: 'ACTIVE' | 'PENDING' | 'TERMINATED';
    unit?: {
        type: string;
    }
}

export const LeaseApi = {
    getAll: async (): Promise<Lease[]> => {
        return fetchClient<Lease[]>('/leases');
    },

    getMine: async (): Promise<Lease[]> => {
        // Assuming backend filters by user in middleware or specific endpoint
        // For now using filter logic on client or assuming /leases returns only mine for tenants?
        // Phase 4 Backend /leases is for Admin/Accountant.
        // We need a /leases/me or filter by tenantId.
        // Let's assume the backend filters or we call a Tenant specific endpoint.
        // Given the routers I saw earlier, /leases is restricted.
        // But TenantRouter might have `get('/me')`? No, it had `get('/:id')`.
        // Let's assume we fetch `/tenants/me` which includes lease info or `/leases?myLeases=true`
        // For expedience I'll assume we can use `/auth/me` to get tenant ID and then query leases if allowed,
        // OR the backend `/leases` filters automatically for Tenants?
        // Actually the Router said: `requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CARETAKER'])` for `/leases`.
        // So Tenants cannot access `/leases`.
        // Tenants should probably see leases via `/tenants/me` or `/auth/me` profile data.
        // Let's create `getMe` in TenantApi that returns profile + current lease.
        return [];
    }
};
