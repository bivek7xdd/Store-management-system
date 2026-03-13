import api from './api';
import { Category, Supplier, Product } from '../types';
import { db } from '../db/db';

export interface CreateProductData {
    name: string;
    barcode?: string;
    price: number;
    cost_price?: number;
    market_price?: number;
    stock_quantity: number;
    low_stock_threshold?: number;
    expires_at?: string;
    status?: string;
    category_id: string;
    supplier_id?: string;
    image_url?: string;
    is_tracked?: boolean;
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

        // Handle both standard response structure (data) and potential non-standard ones
        // @ts-ignore - Handle fallback for different response structures
        const createdCategory = response.data.data || response.data.category || response.data;

        if (!createdCategory || !createdCategory.id) {
            console.error('[Inventory] Invalid category response:', response.data);
            throw new Error('Created category invalid or missing ID');
        }

        await db.categories.put(createdCategory);
        return createdCategory;
    },

    getCategory: async (id: string) => {
        // Try cache first for speed, or implementation choice
        const cached = await db.categories.get(id);
        if (cached) return cached;

        // Fetch from API if not in cache (or force refresh if needed)
        if (isOnline()) {
            const response = await api.get<{ data: Category }>(`categories/${id}`);
            return response.data.data;
        }

        const categories = await inventoryService.getCategories();
        return categories.find(c => c.id === id);
    },

    getCategoryStats: async (id: string) => {
        if (isOnline()) {
            const response = await api.get<{ data: { product_count: number, total_stock: number, total_value: number } }>(`categories/${id}/stats`);
            return response.data.data;
        }
        // Offline calculation could be done here if needed, but for now returned mocked or calculated from local products
        const products = await db.products.where('category_id').equals(id).toArray();
        return {
            product_count: products.length,
            total_stock: products.reduce((acc, p) => acc + p.stock_quantity, 0),
            total_value: products.reduce((acc, p) => {
                const price = typeof p.price === 'number' ? p.price : (p.price.Valid ? Number(p.price.Int64) : 0);
                return acc + (price * p.stock_quantity);
            }, 0)
        };
    },

    getCategoryProducts: async (id: string) => {
        if (isOnline()) {
            const response = await api.get<{ data: Product[] }>(`categories/${id}/products`);
            const products = response.data.data || [];
            if (products.length > 0) {
                await db.products.bulkPut(products);
            }
            return products;
        }
        return await db.products.where('category_id').equals(id).reverse().sortBy('created_at');
    },

    updateCategory: async (id: string, data: Partial<Omit<Category, 'id' | 'store_id'>>) => {
        const response = await api.put<{ data: Category }>(`categories/${id}`, data);
        const updatedCategory = response.data.data;
        await db.categories.put(updatedCategory);
        return updatedCategory;
    },

    deleteCategory: async (id: string) => {
        await api.delete(`categories?category_id=${id}`);
        await db.categories.delete(id);
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

    updateSupplier: async (id: string, data: Partial<Omit<Supplier, 'id' | 'store_id'>>) => {
        const response = await api.put<{ data: Supplier }>(`suppliers/${id}`, data);
        const updatedSupplier = response.data.data;
        await db.suppliers.put(updatedSupplier);
        return updatedSupplier;
    },

    deleteSupplier: async (id: string) => {
        await api.delete(`suppliers/${id}`);
        await db.suppliers.delete(id);
    },

    getSupplier: async (id: string) => {
        const cached = await db.suppliers.get(id);
        if (cached) return cached;

        const suppliers = await inventoryService.getSuppliers();
        return suppliers.find(s => s.id === id);
    },

    // Products
    getProducts: async (limit = 50, offset = 0) => {
        // Server-First: Try to fetch from server if online to ensure latest data
        if (isOnline()) {
            try {
                const response = await api.get<{ data: Product[] }>(`products?limit=${limit}&offset=${offset}`);
                const products = response.data.data || [];

                if (products.length > 0) {
                    // Update cache for offline use
                    await db.products.bulkPut(products);
                }
                return products;
            } catch (error) {
                console.warn('[Inventory] Fetching products failed, falling back to cache', error);
                // Fall through to local return
            }
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

    getTrackedProducts: async () => {
        if (isOnline()) {
            const response = await api.get<{ data: Product[] }>('products/tracked');
            const products = response.data.data || [];
            if (products.length > 0) {
                await db.products.bulkPut(products);
            }
            return products;
        }
        return await db.products.where('is_tracked').equals(1).toArray();
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