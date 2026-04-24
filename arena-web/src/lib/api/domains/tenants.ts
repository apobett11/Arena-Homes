import { fetchClient } from '../client';

export interface Tenant {
    id: string;
    userId: string;
    status: 'PROSPECT' | 'ACTIVE' | 'PAST' | 'EVICTED';
    user?: {
        email: string;
        profile?: {
            fullName: string;
            // ...
        }
    }
}

export const TenantApi = {
    getAll: async (): Promise<Tenant[]> => {
        return fetchClient<Tenant[]>('/tenants');
    },

    getOne: async (id: string): Promise<Tenant> => {
        return fetchClient<Tenant>(`/tenants/${id}`);
    },

    list: async (): Promise<Tenant[]> => {
        return fetchClient<Tenant[]>('/tenants'); // Simplified
    }
};
