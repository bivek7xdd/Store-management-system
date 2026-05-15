import api from "./api";

export interface Expense {
    id: string;
    store_id: string;
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    payment_method: string;
    receipt_url: string;
    created_at: string;
}

export interface ExpenseCategoryTotal {
    category: string;
    count: number;
    total: number;
}

export interface ExpenseSummary {
    summary: {
        total_count: number;
        total_amount: number;
    };
    by_category: ExpenseCategoryTotal[];
    daily: {
        expense_date: string;
        daily_total: number;
    }[];
}

export const EXPENSE_CATEGORIES = [
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "salaries", label: "Salaries" },
    { value: "supplies", label: "Supplies" },
    { value: "transport", label: "Transport" },
    { value: "marketing", label: "Marketing" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other" },
];

export const PAYMENT_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "esewa", label: "eSewa" },
    { value: "khalti", label: "Khalti" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "online", label: "Online" },
];

export const createExpense = async (data: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
    payment_method?: string;
    receipt_url?: string;
}) => {
    const response = await api.post("/expenses", data);
    return response.data.data;
};

export const getExpenses = async (range: string = "month", category: string = "") => {
    const params = new URLSearchParams({ range });
    if (category) params.append("category", category);
    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data.data;
};

export const getExpense = async (id: string) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data;
};

export const updateExpense = async (id: string, data: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
    payment_method?: string;
}) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data;
};

export const deleteExpense = async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};

export const getExpenseSummary = async (range: string = "month") => {
    const response = await api.get(`/expenses/summary?range=${range}`);
    return response.data.data;
};
