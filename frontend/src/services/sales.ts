import api from './api';

export interface SaleItemReq {
    product_id: string;
    quantity: number;
    unit_price: number;
}

export interface CreateSaleData {
    sales_type: 'cash' | 'credit' | 'online';
    discount_applied: number;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    items: SaleItemReq[];
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    store_id: string;
    created_at: string;
}

export const salesService = {
    createSale: async (data: CreateSaleData) => {
        const response = await api.post('sales/create', data);
        return response.data;
    },

    getSales: async () => {
        const response = await api.get('sales');
        return response.data.data;
    },

    getSaleDetails: async (id: string) => {
        const response = await api.get(`sales/${id}`);
        return response.data.data;
    },

    getCustomers: async () => {
        const response = await api.get('customers');
        return response.data.data;
    }
};
