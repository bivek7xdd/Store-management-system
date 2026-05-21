import api from "./api";

export interface SupplierPayable {
    id: string;
    store_id: string;
    supplier_id: string;
    supplier_name: string;
    supplier_phone: string;
    invoice_number?: string;
    description: string;
    amount_owed: number;
    amount_paid: number;
    due_date: string;
    status: "pending" | "partial" | "paid" | "overdue";
    created_at: string;
    updated_at: string;
}

export interface SupplierPayment {
    id: string;
    store_id: string;
    payable_id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes: string;
    created_at: string;
}

export interface PayableSummary {
    summary: {
        total_count: number;
        total_outstanding: number;
        total_overdue: number;
        due_this_week: number;
    };
    overdue: Array<{
        id: string;
        supplier_name: string;
        amount_owed: number;
        amount_paid: number;
        due_date: string;
        status: string;
    }>;
}

export const PAYABLE_STATUS_COLORS = {
    pending: { bg: "bg-[#1A1A1A]", text: "text-[#888888]", border: "border-[#303030]" },
    partial: { bg: "bg-amber-900/20", text: "text-amber-400", border: "border-amber-800" },
    paid: { bg: "bg-emerald-900/20", text: "text-emerald-400", border: "border-emerald-800" },
    overdue: { bg: "bg-[#DA291C]/10", text: "text-[#DA291C]", border: "border-[#DA291C]/30" },
};

export const createSupplierPayable = async (data: {
    supplier_id: string;
    description?: string;
    amount_owed: number;
    due_date?: string;
}) => {
    const response = await api.post("/supplier-payables", data);
    return response.data.data;
};

export const getSupplierPayables = async (status: string = "") => {
    const params = status ? `?status=${status}` : "";
    const response = await api.get(`/supplier-payables${params}`);
    return response.data.data;
};

export const getSupplierPayable = async (id: string) => {
    const response = await api.get(`/supplier-payables/${id}`);
    return response.data.data;
};

export const updateSupplierPayable = async (id: string, data: {
    description?: string;
    amount_owed?: number;
    due_date?: string;
    status?: string;
}) => {
    const response = await api.put(`/supplier-payables/${id}`, data);
    return response.data.data;
};

export const deleteSupplierPayable = async (id: string) => {
    const response = await api.delete(`/supplier-payables/${id}`);
    return response.data;
};

export const recordSupplierPayment = async (payableId: string, data: {
    amount: number;
    payment_method?: string;
    notes?: string;
}) => {
    const response = await api.post(`/supplier-payables/${payableId}/payment`, data);
    return response.data.data;
};

export const getSupplierPayableSummary = async () => {
    const response = await api.get("/supplier-payables/summary");
    return response.data.data;
};
