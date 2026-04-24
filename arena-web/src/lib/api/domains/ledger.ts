import { fetchClient } from '../client';

export interface LedgerTransaction {
    id: string;
    description: string;
    referenceId?: string;
    referenceType?: string;
    postedAt: string;
}

export const LedgerApi = {
    getTransactions: async (): Promise<LedgerTransaction[]> => {
        return fetchClient<LedgerTransaction[]>('/ledger');
    },
};
