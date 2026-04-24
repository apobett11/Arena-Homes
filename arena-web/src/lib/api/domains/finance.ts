import { fetchClient } from '../client';

export interface FinancialSnapshot {
    id: string;
    month: number;
    year: number;
    totalIncome: string;
    totalExpenses: string;
    netProfit: string;
    status: 'DRAFT' | 'FINALIZED';
}

export const FinanceApi = {
    getSnapshots: async (): Promise<FinancialSnapshot[]> => {
        return fetchClient<FinancialSnapshot[]>('/reports/snapshots');
    },

    generateSnapshot: async (month: number, year: number, propertyId?: string): Promise<{ id: string }> => {
        return fetchClient('/reports/snapshot', {
            method: 'POST',
            body: JSON.stringify({ month, year, propertyId }),
        });
    }
};
