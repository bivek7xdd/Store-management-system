import api from './api';
import { Category, Supplier, Product, ProductVariant } from '../types';
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
    variants?: Partial<ProductVariant>[];
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
        let products: Product[] = [];

        if (isOnline()) {
            try {
                const response = await api.get<{ data: any[] }>(`products?limit=${limit}&offset=${offset}`);
                const raw = response.data.data || [];

                // The list endpoint now returns { ...product, variants: [] }
                // Split out and cache variants separately, then store clean products.
                const variantsToBulkPut: any[] = [];
                products = raw.map((item: any) => {
                    const { variants, ...product } = item;
                    if (Array.isArray(variants) && variants.length > 0) {
                        variants.forEach((v: any) => {
                            variantsToBulkPut.push({ ...v, product_id: product.id, synced: 1 });
                        });
                    }
                    // Carry variants on the returned object for immediate UI use
                    return { ...product, variants: variants || [] } as Product;
                });

                // Persist to IndexedDB for offline use
                if (products.length > 0) {
                    await db.products.bulkPut(products.map(p => ({ ...(p as any), variants: undefined })));
                }
                if (variantsToBulkPut.length > 0) {
                    await db.product_variants.bulkPut(variantsToBulkPut);
                }
            } catch (error) {
                console.warn('[Inventory] Fetching products failed, falling back to cache', error);
                products = await db.products.reverse().sortBy('created_at');
                // Enrich from cache
                return Promise.all(products.slice(offset, offset + limit).map(async (p) => {
                    const variants = await db.product_variants.where('product_id').equals(p.id).toArray();
                    return { ...p, variants };
                }));
            }
        } else {
            const cached = await db.products.reverse().sortBy('created_at');
            return Promise.all(cached.slice(offset, offset + limit).map(async (p) => {
                const variants = await db.product_variants.where('product_id').equals(p.id).toArray();
                return { ...p, variants };
            }));
        }

        // Apply offset/limit (API already honours them, but handle edge cases)
        return products.slice(0, limit);
    },

    getPOSCatalog: async () => {
        if (isOnline()) {
            try {
                const response = await api.get<{ data: any[] }>(`pos/catalog`);
                const catalog = response.data.data || [];
                
                // Keep local items synchronized implicitly
                // For a robust offline app, you'd sync products and variants correctly
                return catalog;
            } catch (error) {
                console.warn('[Inventory] Fetching POS catalog failed, falling back to cache', error);
            }
        }
        
        // Offline representation
        const allProducts = await db.products.toArray();
        const catalog = [];
        
        for (const p of allProducts) {
             if (p.status === 'discontinued') continue;
             const variants = await db.product_variants.where('product_id').equals(p.id).toArray();
             catalog.push({
                 ...p,
                 variants: variants
             });
        }
        
        return catalog;
    },

    getProduct: async (id: string): Promise<Product & { variants: ProductVariant[] }> => {
        try {
            if (isOnline()) {
                const response = await api.get<{ data: any }>(`products/${id}`);
                const responseData = response.data?.data || response.data;
                
                const product = responseData.product || responseData;
                const variants = responseData.variants || [];

                await db.products.put({ ...product, synced: 1 });
                
                if (variants.length > 0) {
                    const variantsToCache = variants.map((v: any) => ({
                        ...v,
                        product_id: product.id,
                        synced: 1
                    }));
                    await db.product_variants.bulkPut(variantsToCache);
                }
                
                return { ...product, variants };
            }
            
            const product = await db.products.get(id);
            if (product) {
                const variants = await db.product_variants.where('product_id').equals(id).toArray();
                return { ...product, variants };
            }
            throw new Error('Product not found in cache');
        } catch (error) {
            const product = await db.products.get(id);
            if (product) {
                const variants = await db.product_variants.where('product_id').equals(id).toArray();
                return { ...product, variants };
            }
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

            // Save variants locally if they exist
            if (data.variants && data.variants.length > 0) {
                const variantsToCache = data.variants.map((v: any) => ({
                    ...v,
                    id: v.id || `temp-var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    product_id: tempProduct.id,
                    synced: 0
                }));
                await db.product_variants.bulkPut(variantsToCache);
                // Attach variants to the returned object for immediate UI update
                (tempProduct as any).variants = variantsToCache;
            }

            return tempProduct;
        }
        
        try {
            // Direct API call.
            const response = await api.post('products/create', data);
            const responseData = response.data?.data || response.data;
            
            // Handle the case where variants are returned separately (nested response)
            const product = responseData.product || responseData;
            const variants = responseData.variants || [];

            await db.products.put({ ...product, synced: 1 });
            
            if (variants.length > 0) {
                const variantsToCache = variants.map((v: any) => ({
                    ...v,
                    product_id: product.id,
                    synced: 1
                }));
                await db.product_variants.bulkPut(variantsToCache);
            }
            
            return product;
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
        console.log('[Inventory] isOnline:', isOnline());
        
        // Check if this is a temp/offline product
        const existing = await db.products.get(id);
        console.log('[Inventory] existing product:', existing ? 'found' : 'not found');
        
        if (existing && id.startsWith('temp-')) {
            console.log('[Inventory] Updating temp product locally');
            // Still a temp product, just update locally
            const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as unknown as Product;
            await db.products.put(updated);
            console.log('[Inventory] Temp product updated successfully');
            return updated;
        }

        // If offline, update locally and mark as needing sync
        if (!isOnline()) {
            console.log('[Inventory] Offline - updating locally only');
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as any;
                updated.synced = 0; // Mark as needing sync
                await db.products.put(updated);

                // Update variants locally if they exist in the update data
                if (data.variants) {
                    // Simple replacement for offline: clear existing and add new
                    // (A more sophisticated diffing could be done, but this is safer for offline state)
                    await db.product_variants.where('product_id').equals(id).delete();
                    
                    if (data.variants.length > 0) {
                        const variantsToCache = data.variants.map((v: any) => ({
                            ...v,
                            id: v.id || `temp-var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            product_id: id,
                            synced: 0
                        }));
                        await db.product_variants.bulkPut(variantsToCache);
                        updated.variants = variantsToCache;
                    }
                }

                console.log('[Inventory] Offline update successful, synced=0');
                return updated;
            }
            console.error('[Inventory] Offline and product not found locally');
            throw new Error('Offline and product not found locally');
        }

        // Online: update on server
        console.log('[Inventory] Online - updating on server');
        try {
            const response = await api.put(`products/${id}`, data);
            const responseData = response.data?.data || response.data;
            
            const product = responseData.product || responseData;
            const variants = responseData.variants || [];

            await db.products.put({ ...product, synced: 1 });

            if (variants.length > 0) {
                const variantsToCache = variants.map((v: any) => ({
                    ...v,
                    product_id: product.id,
                    synced: 1
                }));
                await db.product_variants.bulkPut(variantsToCache);
            }
            
            console.log('[Inventory] Server update successful');
            return product;
        } catch (error) {
            console.warn('[Inventory] Failed to update product on server, saving locally', error);
            // If server update fails, save locally with synced=0
            if (existing) {
                const updated = { ...existing, ...data, updated_at: new Date().toISOString() } as any;
                updated.synced = 0;
                await db.products.put(updated);
                console.log('[Inventory] Fallback to local save successful');
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
            const results = all.filter(p => {
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

            // Also search in variants SKU
            const matchedVariants = await db.product_variants.where('sku').equals(query).toArray();
            if (matchedVariants.length > 0) {
                const parentIds = [...new Set(matchedVariants.map(v => v.product_id))];
                const parents = await db.products.where('id').anyOf(parentIds).toArray();
                
                // Merge with results, avoiding duplicates
                const existingIds = new Set(results.map(r => r.id));
                for (const parent of parents) {
                    if (!existingIds.has(parent.id)) {
                        results.push(parent);
                    }
                }
            }
            return results;
        };

        let results: Product[] = [];
        try {
            if (isOnline()) {
                const response = await api.get<{ data: Product[] }>(`products/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
                results = response.data.data || [];
            } else {
                results = await performOfflineSearch();
            }
        } catch (error) {
            console.warn('[Inventory] Search failed, falling back to local', error);
            results = await performOfflineSearch();
        }

        // Enrich search results with variants
        const enriched = await Promise.all(results.map(async (p) => {
            const variants = await db.product_variants.where('product_id').equals(p.id).toArray();
            return { ...p, variants };
        }));

        return enriched;
    },
};