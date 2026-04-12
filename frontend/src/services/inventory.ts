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

export interface DiscoveredSupplier {
    name: string;
    address: string;
    phone: string;
    website: string;
    rating: number;
    reviews: number;
    category: string;
    place_id: string;
    latitude: number;
    longitude: number;
}

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
        // Offline-first: Save locally first
        const tempId = `temp-cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const localCategory: Category = {
            id: tempId,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: 0
        };
        
        await db.categories.put(localCategory);

        // If online, sync immediately
        if (isOnline()) {
            try {
                const response = await api.post('categories/create', data);
                // @ts-ignore - Handle various response structures
                const createdCategory = response.data?.data || response.data?.category || response.data;
                
                if (createdCategory && createdCategory.id) {
                    // Replace temp ID with server ID
                    await db.categories.delete(tempId);
                    await db.categories.put({ ...createdCategory, synced: 1 });
                    return createdCategory;
                }
            } catch (error) {
                console.warn('[Inventory] Failed to sync category, keeping local', error);
                // Keep local version with synced=0
            }
        }

        return localCategory;
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
        const allInCategory = await db.products.where('category_id').equals(id).toArray();
        return allInCategory
            .filter(p => {
                const status = typeof p.status === 'string'
                    ? p.status
                    : (p.status?.product_status || 'active');
                return status !== 'discontinued';
            })
            .sort((a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime());
    },

    updateCategory: async (id: string, data: Partial<Omit<Category, 'id' | 'store_id'>>) => {
        // Check if this is a temp/offline category
        const existing = await db.categories.get(id);
        
        if (existing && id.startsWith('temp-cat-')) {
            // Still a temp category, just update locally
            const updated = { ...existing, ...data, updated_at: new Date().toISOString(), synced: 0 };
            await db.categories.put(updated);
            return updated;
        }

        // If offline, update locally and mark as needing sync
        if (!isOnline()) {
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString(), synced: 0 };
                await db.categories.put(updated);
                return updated;
            }
            throw new Error('Category not found locally');
        }

        // Online: update on server
        const response = await api.put(`categories/${id}`, data);
        // @ts-ignore - Handle response structure
        const updatedCategory = response.data?.data || response.data;
        await db.categories.put({ ...updatedCategory, synced: 1 });
        return updatedCategory;
    },

    deleteCategory: async (id: string) => {
        // Check if this is a temp/offline category
        if (id.startsWith('temp-cat-')) {
            // Just delete locally
            await db.categories.delete(id);
            return;
        }

        // If offline, mark as deleted locally (soft delete with flag)
        if (!isOnline()) {
            const existing = await db.categories.get(id);
            if (existing) {
                // Mark for deletion by setting a flag
                await db.categories.put({ ...existing, synced: -1 }); // -1 = marked for deletion
            }
            return;
        }

        // Online: delete from server
        try {
            await api.delete(`categories?category_id=${id}`);
        } catch (error) {
            console.warn('[Inventory] Failed to delete category on server', error);
        }
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
        // Offline-first: Save locally first
        const tempId = `temp-sup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const localSupplier: Supplier = {
            id: tempId,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: 0
        };
        
        await db.suppliers.put(localSupplier);

        // If online, sync immediately
        if (isOnline()) {
            try {
                const response = await api.post('suppliers/create', data);
                // @ts-ignore - Handle various response structures
                const createdSupplier = response.data?.data || response.data;
                
                if (createdSupplier && createdSupplier.id) {
                    // Replace temp ID with server ID
                    await db.suppliers.delete(tempId);
                    await db.suppliers.put({ ...createdSupplier, synced: 1 });
                    return createdSupplier;
                }
            } catch (error) {
                console.warn('[Inventory] Failed to sync supplier, keeping local', error);
                // Keep local version with synced=0
            }
        }

        return localSupplier;
    },

    updateSupplier: async (id: string, data: Partial<Omit<Supplier, 'id' | 'store_id'>>) => {
        // Check if this is a temp/offline supplier
        const existing = await db.suppliers.get(id);
        
        if (existing && id.startsWith('temp-sup-')) {
            // Still a temp supplier, just update locally
            const updated = { ...existing, ...data, updated_at: new Date().toISOString(), synced: 0 };
            await db.suppliers.put(updated);
            return updated;
        }

        // If offline, update locally and mark as needing sync
        if (!isOnline()) {
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString(), synced: 0 };
                await db.suppliers.put(updated);
                return updated;
            }
            throw new Error('Supplier not found locally');
        }

        // Online: update on server
        const response = await api.put(`suppliers/${id}`, data);
        // @ts-ignore - Handle response structure
        const updatedSupplier = response.data?.data || response.data;
        await db.suppliers.put({ ...updatedSupplier, synced: 1 });
        return updatedSupplier;
    },

    deleteSupplier: async (id: string) => {
        // Check if this is a temp/offline supplier
        if (id.startsWith('temp-sup-')) {
            // Just delete locally
            await db.suppliers.delete(id);
            return;
        }

        // If offline, mark as deleted locally (soft delete with flag)
        if (!isOnline()) {
            const existing = await db.suppliers.get(id);
            if (existing) {
                // Mark for deletion by setting a flag
                await db.suppliers.put({ ...existing, synced: -1 }); // -1 = marked for deletion
            }
            return;
        }

        // Online: delete from server
        try {
            await api.delete(`suppliers/${id}`);
        } catch (error) {
            console.warn('[Inventory] Failed to delete supplier on server', error);
        }
        await db.suppliers.delete(id);
    },

    getSupplier: async (id: string) => {
        const cached = await db.suppliers.get(id);
        if (cached) return cached;

        const suppliers = await inventoryService.getSuppliers();
        return suppliers.find(s => s.id === id);
    },

    getSupplierStats: async (id: string) => {
        if (isOnline()) {
            const response = await api.get<{ data: { product_count: number, total_stock: number, total_value: number, low_stock_count: number } }>(`suppliers/${id}/stats`);
            return response.data.data;
        }
        // Offline calculation
        const products = await db.products.where('supplier_id').equals(id).toArray();
        return {
            product_count: products.length,
            total_stock: products.reduce((acc, p) => acc + p.stock_quantity, 0),
            total_value: products.reduce((acc, p) => {
                const price = typeof p.price === 'number' ? p.price : (p.price.Valid ? Number(p.price.Int64) : 0);
                return acc + (price * p.stock_quantity);
            }, 0),
            low_stock_count: products.filter(p => {
                const threshold = typeof p.low_stock_threshold === 'number'
                    ? p.low_stock_threshold
                    : (p.low_stock_threshold && 'Int32' in p.low_stock_threshold && p.low_stock_threshold.Valid ? p.low_stock_threshold.Int32 : 10);
                return p.stock_quantity <= (threshold || 10);
            }).length
        };
    },

    getSupplierProducts: async (id: string) => {
        if (isOnline()) {
            const response = await api.get<{ data: Product[] }>(`suppliers/${id}/products`);
            const products = response.data.data || [];
            if (products.length > 0) {
                await db.products.bulkPut(products);
            }
            return products;
        }
        return await db.products.where('supplier_id').equals(id).toArray();
    },

    // Supplier Discovery
    findSuppliers: async (query: string, location?: string) => {
        const params = new URLSearchParams({ q: query });
        if (location) {
            params.append('location', location);
        }
        
        const response = await api.get<{ data: DiscoveredSupplier[] }>(`market/suppliers?${params.toString()}`);
        return response.data.data || [];
    },

    // Products
    getProducts: async (limit = 50, offset = 0) => {
        // Server-First: Try to fetch from server if online to ensure latest data
        if (isOnline()) {
            try {
                const response = await api.get<{ data: Product[] }>(`products?limit=${limit}&offset=${offset}`);
                const serverProducts = response.data.data || [];

                // For the first page (offset 0), we can assume it's a good time to sync
                // and potentially remove local items that aren't on the server
                if (offset === 0) {
                    const localProducts = await db.products.toArray();
                    const serverIds = new Set(serverProducts.map(p => p.id));

                    // If we have products on server, items missing from server response 
                    // AND not recently created locally (offline) should be removed.
                    // For simplicity in this app, we'll sync by replacement for the fetched range.
                    await db.products.bulkPut(serverProducts);

                    // But wait, if serverProducts is just a page, we can't delete everything.
                    // However, if the user deleted something, it won't be in serverProducts.
                    // If we want a true sync, we'd need a "ListAllProductIds" or similar.
                } else {
                    await db.products.bulkPut(serverProducts);
                }

                return serverProducts;
            } catch (error) {
                console.warn('[Inventory] Fetching products failed, falling back to cache', error);
            }
        }

        // Return local data as the source of truth for the UI
        return await db.products.reverse().sortBy('created_at');
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
        if (!isOnline()) {
            const tempProduct = {
                id: `temp-${Date.now()}`,
                store_id: 'temp',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced: 0, // Mark as needing sync
                ...data
            } as unknown as Product;
            await db.products.put(tempProduct);
            return tempProduct;
        }
        
        try {
            // Direct API call.
            const response = await api.post('products/create', data);
            const createdProduct = response.data?.data || response.data;
            await db.products.put({ ...createdProduct, synced: 1 });
            return createdProduct;
        } catch (error) {
            console.warn('[Inventory] Failed to create product on server, saving locally', error);
            // If server creation fails, save locally with synced=0
            const tempProduct = {
                id: `temp-${Date.now()}`,
                store_id: 'temp',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced: 0,
                ...data
            } as unknown as Product;
            await db.products.put(tempProduct);
            return tempProduct;
        }
    },

    updateProduct: async (id: string, data: UpdateProductData) => {
        console.log('[Inventory] updateProduct called, id:', id);
        
        // Check if this is a temp/offline product
        const existing = await db.products.get(id);
        
        if (existing && id.startsWith('temp-')) {
            // Still a temp product, just update locally
            const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as unknown as Product;
            await db.products.put(updated);
            return updated;
        }

        // If offline, update locally and mark as needing sync
        if (!isOnline()) {
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as any;
                updated.synced = 0; // Mark as needing sync
                await db.products.put(updated);
                return updated;
            }
            throw new Error('Offline and product not found locally');
        }

        // Online: update on server
        try {
            const response = await api.put(`products/${id}`, data);
            const updatedProduct = response.data?.data || response.data;
            await db.products.put({ ...updatedProduct, synced: 1 });
            return updatedProduct;
        } catch (error) {
            console.warn('[Inventory] Failed to update product on server, saving locally', error);
            // If server update fails, save locally with synced=0
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as any;
                updated.synced = 0;
                await db.products.put(updated);
                return updated;
            }
            throw error;
        }
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
        const performOfflineSearch = async () => {
            const lowerQuery = query.toLowerCase();
            const all = await db.products.toArray();
            return all.filter(p => {
                const status = typeof p.status === 'string'
                    ? p.status
                    : (p.status?.product_status || 'active');

                if (status === 'discontinued') return false;

                const barcodeStr = typeof p.barcode === 'string'
                    ? p.barcode
                    : (p.barcode && 'Valid' in p.barcode && p.barcode.Valid ? p.barcode.String : '');

                return p.name.toLowerCase().includes(lowerQuery) ||
                    (barcodeStr && barcodeStr.includes(query));
            });
        };

        try {
            if (isOnline()) {
                const response = await api.get<{ data: Product[] }>(`products/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
                return response.data.data || [];
            }
            return await performOfflineSearch();
        } catch (error) {
            console.warn('[Inventory] Search failed, falling back to local', error);
            return await performOfflineSearch();
        }
    },
};