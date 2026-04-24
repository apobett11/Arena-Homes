import { fetchClient } from '../client';

export interface User {
    id: string;
    email: string;
    roleId: string;
    isActive: boolean;
}

export const UsersApi = {
    getAll: async (): Promise<User[]> => {
        return fetchClient<User[]>('/users');
    },

    createEmployee: async (data: any): Promise<{ id: string }> => {
        return fetchClient('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
