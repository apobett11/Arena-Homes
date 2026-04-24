import { fetchClient } from '../client';

export interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    scheduledDate: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    assignedToId?: string;
}

export const MaintenanceApi = {
    getAll: async (): Promise<MaintenanceRequest[]> => {
        return fetchClient<MaintenanceRequest[]>('/maintenance');
    },

    create: async (data: any): Promise<{ id: string }> => {
        return fetchClient('/maintenance', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
