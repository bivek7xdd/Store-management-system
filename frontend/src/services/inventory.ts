import api from './api';
import { Category, Supplier, Product } from '../types';

export interface CreateProductData {
    name: string;
    barcode?: string;
    price: number;
    market_price?: number;
    stock_quantity: number;
    low_stock_threshold?: number;
    expires_at?: string;
    status?: string;
    category_id: string;
    supplier_id?: string;
    image_url?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> { }

export const inventoryService = {
    // Categories
    getCategories: async () => {
        const response = await api.get<{ data: Category[] }>('categories');
        return response.data.data || [];
    },

    createCategory: async (data: Omit<Category, 'id' | 'store_id'>) => {
        const response = await api.post<{ data: Category }>('categories/create', data);
        return response.data.data;
    },

    getCategory: async (id: string) => {
        const categories = await inventoryService.getCategories();
        return categories.find(c => c.id === id);
    },

    // Suppliers
    getSuppliers: async () => {
        const response = await api.get<{ data: Supplier[] }>('suppliers');
        return response.data.data || [];
    },

    createSupplier: async (data: Omit<Supplier, 'id' | 'store_id'>) => {
        const response = await api.post<{ data: Supplier }>('suppliers/create', data);
        return response.data.data;
    },

    getSupplier: async (id: string) => {
        const suppliers = await inventoryService.getSuppliers();
        return suppliers.find(s => s.id === id);
    },

    // Products
    getProducts: async (limit = 50, offset = 0) => {
        const response = await api.get<{ data: Product[] }>(`products?limit=${limit}&offset=${offset}`);
        return response.data.data || [];
    },

    getProduct: async (id: string) => {
        const response = await api.get<{ data: Product }>(`products/${id}`);
        return response.data.data;
    },

    createProduct: async (data: CreateProductData) => {
        const response = await api.post<{ data: Product }>('products/create', data);
        return response.data.data;
    },

    updateProduct: async (id: string, data: UpdateProductData) => {
        const response = await api.put<{ data: Product }>(`products/${id}`, data);
        return response.data.data;
    },

    deleteProduct: async (id: string) => {
        await api.delete(`products/${id}`);
    },

    searchProducts: async (query: string, limit = 50, offset = 0) => {
        const response = await api.get<{ data: Product[] }>(`products/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
        return response.data.data || [];
    },
};
