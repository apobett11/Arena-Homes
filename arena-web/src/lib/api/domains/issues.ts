import { fetchClient } from '../client';

export interface Issue {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    createdAt: string;
}

export const IssueApi = {
    getAll: async (): Promise<Issue[]> => {
        return fetchClient<Issue[]>('/issues');
    },

    create: async (data: any): Promise<{ id: string }> => {
        return fetchClient('/issues', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    resolve: async (id: string): Promise<void> => {
        return fetchClient(`/issues/${id}/resolve`, {
            method: 'PATCH',
        });
    }
};
