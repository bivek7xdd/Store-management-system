import api from './api';

export interface Debt {
    id: string;
    store_id: string;
    customer_id: string;
    sale_id: string | null;
    amount_owed: string; // pgtype.Numeric usually comes as string
    amount_paid: string;
    due_date: string;
    status: 'pending' | 'paid' | 'partial' | 'written-off';
    notes: string;
    created_at: string;
    updated_at: string;
    customer_name: string | null;
    customer_phone: string | null;
}

export const debtService = {
    getDebts: async () => {
        const response = await api.get<{ data: Debt[], message: string }>('/debts');
        return response.data.data;
    },

    updateDebt: async (id: string, data: { amount_paid?: number; status?: string; notes?: string }) => {
        const response = await api.put<{ data: Debt, message: string }>(`/debts/${id}`, data);
        return response.data.data;
    },

    deleteDebt: async (id: string) => {
        const response = await api.delete(`/debts/${id}`);
        return response.data;
    }
};
