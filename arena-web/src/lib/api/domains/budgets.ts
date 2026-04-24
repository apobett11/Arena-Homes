import { fetchClient } from '../client';

export interface Budget {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    totalAmount: string;
    status: string;
}

export const BudgetApi = {
    getAll: async (): Promise<Budget[]> => {
        return fetchClient<Budget[]>('/budgets');
    },
    create: async (payload: {
        name: string;
        periodStart: string;
        periodEnd: string;
        totalAmount: string;
        status?: string;
    }) => {
        return fetchClient('/budgets', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                status: payload.status || 'ACTIVE',
                allocations: [],
            }),
        });
    },
};
