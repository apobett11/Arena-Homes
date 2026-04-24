import { fetchClient } from '../client';

export interface Payment {
    id: string;
    amount: number;
    date: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    description: string;
}

export const PaymentApi = {
    getHistory: async (): Promise<Payment[]> => {
        // Tenants might need a specific endpoint or filtered list
        // /payments is restrictred to Admins.
        // We likely need queries via Tenant profile.
        return [];
    },

    makePayment: async (data: any): Promise<{ id: string }> => {
        return fetchClient('/payments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
