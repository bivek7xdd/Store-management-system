import api from "./api";
import { PurchaseOrder } from "@/types";

export interface CreatePurchaseOrderItem {
    supplier_id: string;
    product_id?: string;
    product_name: string;
    ordered_quantity: number;
    unit_cost: number;
}

export interface CreatePurchaseOrderData {
    order_date?: string;
    expected_delivery_date?: string;
    notes?: string;
    items: CreatePurchaseOrderItem[];
}

export interface ReceiveItem {
    item_id: string;
    received_quantity: number;
    damaged_quantity: number;
}

export interface SupplierPayment {
    supplier_id: string;
    payment_amount: number;
    payment_method: string;
    payment_notes?: string;
}

export interface ReceivePurchaseOrderData {
    items: ReceiveItem[];
    payments: SupplierPayment[];
}

export const purchaseOrderService = {
    create: async (data: CreatePurchaseOrderData) => {
        const response = await api.post("/purchase-orders", data);
        return response.data.data;
    },

    list: async (): Promise<PurchaseOrder[]> => {
        const response = await api.get("/purchase-orders");
        return response.data.data;
    },

    get: async (id: string): Promise<PurchaseOrder> => {
        const response = await api.get(`/purchase-orders/${id}`);
        return response.data.data;
    },

    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/purchase-orders/${id}/status`, { status });
        return response.data.data;
    },

    receive: async (id: string, data: ReceivePurchaseOrderData) => {
        const response = await api.post(`/purchase-orders/${id}/receive`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/purchase-orders/${id}`);
        return response.data;
    },

    getBySupplier: async (supplierId: string): Promise<PurchaseOrder[]> => {
        const response = await api.get(`/suppliers/${supplierId}/purchase-orders`);
        return response.data.data;
    },
};
