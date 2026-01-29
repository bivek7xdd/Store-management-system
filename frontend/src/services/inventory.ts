import api from './api';
import { Category, Supplier, Product } from '../types';
import { db } from '../db/db';

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

const isOnline = () => navigator.onLine;

export const inventoryService = {
    // Categories
    getCategories: async () => {
        try {
            if (isOnline()) {
                const response = await api.get<{ data: Category[] }>('categories');
                const categories = response.data.data || [];
                await db.categories.bulkPut(categories);
                return categories;
            }
            return await db.categories.toArray();
        } catch (error) {
            console.warn('Fetching categories failed, falling back to cache', error);
            return await db.categories.toArray();
        }
    },

    createCategory: async (data: Omit<Category, 'id' | 'store_id'>) => {
        const response = await api.post<{ data: Category }>('categories/create', data);
        await db.categories.put(response.data.data);
        return response.data.data;
    },

    getCategory: async (id: string) => {
        // Try cache first for speed, or implementation choice
        const cached = await db.categories.get(id);
        if (cached) return cached;

        const categories = await inventoryService.getCategories();
        return categories.find(c => c.id === id);
    },

    // Suppliers
    getSuppliers: async () => {
        try {
            if (isOnline()) {
                const response = await api.get<{ data: Supplier[] }>('suppliers');
                const suppliers = response.data.data || [];
                await db.suppliers.bulkPut(suppliers);
                return suppliers;
            }
            return await db.suppliers.toArray();
        } catch (error) {
            console.warn('Fetching suppliers failed, falling back to cache', error);
            return await db.suppliers.toArray();
        }
    },

    createSupplier: async (data: Omit<Supplier, 'id' | 'store_id'>) => {
        const response = await api.post<{ data: Supplier }>('suppliers/create', data);
        await db.suppliers.put(response.data.data);
        return response.data.data;
    },

    getSupplier: async (id: string) => {
        const cached = await db.suppliers.get(id);
        if (cached) return cached;

        const suppliers = await inventoryService.getSuppliers();
        return suppliers.find(s => s.id === id);
    },

    // Products
    getProducts: async (limit = 50, offset = 0) => {
        // Offline-First: Always return local data to ensure immediate UI updates (e.g. stock changes)
        // If online, trigger a background refresh to keep cache in sync.

        if (isOnline()) {
            // Background fetch - don't await to keep UI snappy
            api.get<{ data: Product[] }>(`products?limit=${limit}&offset=${offset}`)
                .then(async (response) => {
                    const products = response.data.data || [];
                    if (products.length > 0) {
                        await db.products.bulkPut(products);
                        console.log('[Inventory] Background synced products');
                    }
                })
                .catch(err => console.warn('[Inventory] Background sync failed', err));
        }

        // Return local data as the source of truth for the UI
        try {
            return await db.products.toArray();
        } catch (error) {
            console.error('Failed to read from local DB', error);
            return [];
        }
    },

    getProduct: async (id: string) => {
        try {
            // Check cache first? Or prefer fresh?
            // User wants offline first, but consistency matters. 
            // Let's try network if online, else cache.
            if (isOnline()) {
                const response = await api.get<{ data: Product }>(`products/${id}`);
                await db.products.put(response.data.data);
                return response.data.data;
            }
            const product = await db.products.get(id);
            if (product) return product;
            throw new Error('Product not found in cache');
        } catch (error) {
            const product = await db.products.get(id);
            if (product) return product;
            throw error;
        }
    },

    createProduct: async (data: CreateProductData) => {
        console.log('[Inventory] createProduct called');
        // No offline queueing. Direct API call.
        const response = await api.post<{ data: Product }>('products/create', data);
        await db.products.put(response.data.data);
        return response.data.data;
    },

    updateProduct: async (id: string, data: UpdateProductData) => {
        console.log('[Inventory] updateProduct called, id:', id);
        const response = await api.put<{ data: Product }>(`products/${id}`, data);
        await db.products.put(response.data.data);
        return response.data.data;
    },

    deleteProduct: async (id: string) => {
        console.log('[Inventory] deleteProduct called, id:', id);
        await api.delete(`products/${id}`);
        await db.products.delete(id);
    },

    searchProducts: async (query: string, limit = 50, offset = 0) => {
        try {
            if (isOnline()) {
                const response = await api.get<{ data: Product[] }>(`products/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
                return response.data.data || [];
            }
            // Offline search
            const lowerQuery = query.toLowerCase();
            const all = await db.products.toArray();
            return all.filter(p => {
                const barcodeStr = typeof p.barcode === 'string'
                    ? p.barcode
                    : (p.barcode && 'Valid' in p.barcode && p.barcode.Valid ? p.barcode.String : '');

                return p.name.toLowerCase().includes(lowerQuery) ||
                    (barcodeStr && barcodeStr.includes(query));
            });
        } catch (error) {
            // Fallback to offline search
            const lowerQuery = query.toLowerCase();
            const all = await db.products.toArray();
            return all.filter(p => {
                const barcodeStr = typeof p.barcode === 'string'
                    ? p.barcode
                    : (p.barcode && 'Valid' in p.barcode && p.barcode.Valid ? p.barcode.String : '');

                return p.name.toLowerCase().includes(lowerQuery) ||
                    (barcodeStr && barcodeStr.includes(query));
            });
        }
    },
};