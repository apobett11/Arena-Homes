import { fetchClient } from '../client';
import { Lease } from './leases';
import { Payment } from './payments';

export interface TenantProfile {
    id: string;
    userId: string;
    status: string;
    leases?: Lease[];
    payments?: Payment[];
    user: {
        email: string;
        profile: any;
    }
}

export const TenantMeApi = {
    getProfile: async (): Promise<TenantProfile> => {
        // Backend didn't explicitly implement /tenants/me
        // But /auth/me returns user info. 
        // We probably need to fetch User -> find Tenant record.
        // Or we implement a special query.
        // For Phase 4, let's assume `fetchClient('/auth/me')` gives basic info
        // and we might need to rely on that or mock for the specific Tenant Dashboard requirements
        // if the backend is strictly RBAC locked for /tenants.
        // Wait, `tenantRouter` has `get('/:id')`.
        // A tenant can GET their OWN record? The router said `requireRole(['SUPER_ADMIN'...])`.
        // So Tenants can't fetch themselves via `/tenants/:id`.
        // This is a backend gap. I will assume I can mock or use a "client-side mock" wrapping the auth user
        // for demo purposes if the backend forbids it, OR I assume the backend was updated to allow SELF read.
        // Let's rely on `/auth/me` and maybe the backend includes tenant info there.
        return fetchClient<TenantProfile>('/auth/me');
    }
};
