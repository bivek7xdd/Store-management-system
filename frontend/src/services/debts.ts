import api from './api';
import { db } from '../db/db';

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

const isOnline = () => navigator.onLine;

export const debtService = {
    getDebts: async () => {
        if (isOnline()) {
            try {
                const response = await api.get<{ data: Debt[], message: string }>('/debts');
                const debts = response.data.data || [];
                if (debts.length > 0) {
                    await db.debts.bulkPut(debts);
                }
                return debts;
            } catch (error) {
                console.warn('Network error, falling back to cache');
                return await db.debts.toArray();
            }
        }
        return await db.debts.toArray();
    },

    createDebt: async (data: { customer_id: string; amount_owed: number; due_date?: string; notes?: string }) => {
        if (!isOnline()) {
            const tempDebt: Debt = {
                id: `temp-${Date.now()}`,
                store_id: 'temp',
                customer_id: data.customer_id,
                sale_id: null,
                amount_owed: data.amount_owed.toString(),
                amount_paid: '0',
                due_date: data.due_date || new Date().toISOString(),
                status: 'pending',
                notes: data.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                customer_name: null,
                customer_phone: null
            };
            await db.debts.put(tempDebt);
            return tempDebt;
        }

        const response = await api.post<{ data: Debt, message: string }>('/debts/create', data);
        await db.debts.put(response.data.data);
        return response.data.data;
    },

    updateDebt: async (id: string, data: { amount_owed?: number; amount_paid?: number; due_date?: string; status?: string; notes?: string }) => {
        if (!isOnline()) {
            const existing = await db.debts.get(id);
            if (existing) {
                const updated: Debt = {
                    ...existing,
                    amount_owed: data.amount_owed !== undefined ? data.amount_owed.toString() : existing.amount_owed,
                    amount_paid: data.amount_paid !== undefined ? data.amount_paid.toString() : existing.amount_paid,
                    due_date: data.due_date || existing.due_date,
                    status: (data.status as Debt['status']) || existing.status,
                    notes: data.notes !== undefined ? data.notes : existing.notes,
                    updated_at: new Date().toISOString()
                };
                await db.debts.put(updated);
                return updated;
            }
            throw new Error('Offline and debt not found locally');
        }

        const response = await api.put<{ data: Debt, message: string }>(`/debts/${id}`, data);
        await db.debts.put(response.data.data);
        return response.data.data;
    },

    deleteDebt: async (id: string) => {
        if (!isOnline()) {
            await db.debts.delete(id);
            return { message: "Deleted locally" };
        }

        const response = await api.delete(`/debts/${id}`);
        await db.debts.delete(id);
        return response.data;
    },

    sendReminder: async (id: string, message?: string) => {
        if (!isOnline()) {
             throw new Error('You must be online to send a reminder');
        }
        const response = await api.post(`/debts/${id}/remind`, { message });
        return response.data;
    },

    recordPayment: async (id: string, amount: number) => {
        if (!isOnline()) {
            const existing = await db.debts.get(id);
            if (existing) {
                const currentPaid = parseFloat(existing.amount_paid || '0');
                const totalOwed = parseFloat(existing.amount_owed || '0');
                const newPaid = currentPaid + amount;
                
                let newStatus = existing.status;
                if (newPaid >= totalOwed) {
                    newStatus = 'paid';
                } else if (newPaid > 0) {
                    newStatus = 'partial';
                }

                const updated: Debt = {
                    ...existing,
                    amount_paid: newPaid.toString(),
                    status: newStatus,
                    updated_at: new Date().toISOString()
                };
                await db.debts.put(updated);
                return updated;
            }
            throw new Error('Offline and debt not found locally');
        }

        const response = await api.post<{ data: Debt, message: string }>(`/debts/${id}/pay`, { amount });
        await db.debts.put(response.data.data);
        return response.data.data;
    }
};
