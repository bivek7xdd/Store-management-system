import api from './api';
import { db, Sale, SaleItem } from '../db/db';
import { syncService } from './syncService';

export type { SaleItem };

export interface SaleItemReq {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
}

export interface CreateSaleData {
    sales_type: 'cash' | 'credit' | 'online' | 'mixed';
    amount_paid: number;
    total_amount: number;
    payments: any[];
    note?: string;
    discount_applied: number;
    customer_id: string;
    items: SaleItemReq[];
    sale_date?: string;
}

// Re-export types if needed by components
export type { Sale };

export const salesService = {
    createSale: async (data: CreateSaleData) => {
        console.log('[Sales] createSale called', data);

        // 1. Save to Dexie first (Offline First)
        const saleId = await db.sales.add({
            ...data,
            sales_type: data.sales_type,
            sale_date: data.sale_date || new Date().toISOString(),
            synced: 0,
            offlineId: crypto.randomUUID()
        });

        // 1.5 Update local inventory (decrement stock)
        try {
            await db.transaction('rw', [db.products, db.notifications], async () => {
                for (const item of data.items) {
                    const product = await db.products.get(item.product_id);
                    if (product) {
                        let newStock = product.stock_quantity;
                        if (item.variant_id) {
                            const variant = await db.product_variants.get(item.variant_id);
                            if (variant) {
                                const newVariantStock = Math.max(0, variant.stock_level - item.quantity);
                                await db.product_variants.update(item.variant_id, {
                                    stock_level: newVariantStock
                                });
                                console.log(`[Sales] Updated stock for variant ${variant.sku}: ${variant.stock_level} -> ${newVariantStock}`);
                            }
                        } else {
                            newStock = Math.max(0, product.stock_quantity - item.quantity);
                            await db.products.update(item.product_id, {
                                stock_quantity: newStock
                            });
                            console.log(`[Sales] Updated stock for ${product.name}: ${product.stock_quantity} -> ${newStock}`);
                        }

                        // 1.6 Local Low Stock Check
                        const threshold = typeof product.low_stock_threshold === 'number'
                            ? product.low_stock_threshold
                            : (product.low_stock_threshold && typeof product.low_stock_threshold === 'object' && 'Int32' in (product.low_stock_threshold as any) && (product.low_stock_threshold as any).Valid
                                ? (product.low_stock_threshold as any).Int32
                                : 0);

                        console.log(`[Sales] Low stock check for ${product.name}: stock=${newStock}, threshold=${threshold}`);

                        if (newStock <= threshold) {
                            // Check if we already have a local unread notification for this product
                            // or one created in the last 24h
                            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                            const existing = await db.notifications.where('reference_id').equals(item.product_id)
                                .and(n => n.type === 'low_stock' && n.created_at > twentyFourHoursAgo)
                                .first();

                            if (!existing) {
                                await db.notifications.add({
                                    id: `local-${crypto.randomUUID()}`,
                                    store_id: product.store_id,
                                    type: 'low_stock',
                                    title: 'Low Stock Alert',
                                    message: `${product.name} is running low on stock. Current: ${newStock}, Threshold: ${threshold}`,
                                    reference_id: product.id,
                                    reference_type: 'product',
                                    status: 'unread',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                });
                                console.log(`[Sales] Created local low stock notification for ${product.name}`);
                            } else {
                                console.log(`[Sales] Notification already exists for ${product.name}, skipping`);
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('[Sales] Failed to update local inventory or create notification:', e);
        }

        // 2. Trigger background sync if online
        // If online, we await this so the backend has time to process the sale
        // and create notifications before the UI fetches them.
        if (navigator.onLine) {
            try {
                await syncService.syncSales();
            } catch (err) {
                console.error('Background sync failed:', err);
            }
        }

        // Return the local sale object with the generated ID
        return {
            id: saleId.toString(), // Convert to string to match existing API ID type if needed
            ...data,
            sale_date: data.sale_date || new Date().toISOString(),
        };
    },

    getSales: async () => {

        try {
            if (navigator.onLine) {
                const response = await api.get('sales');
            
                return response.data.data;
            }
            // Offline: Return only local unsynced sales? Or all local sales?
            // If we don't sync server sales down, we only have what we created on this device.
            return await db.sales.toArray();
        } catch (error) {
            console.warn('Fetching sales failed, falling back to local', error);
            return await db.sales.toArray();
        }
    },

    getSaleDetails: async (id: string) => {
        try {
            if (navigator.onLine) {
                const response = await api.get(`sales/${id}`);
                return response.data.data;
            }
            // Try to find in local DB (generic check, id checks might mismatch string vs number)
            const localSale = await db.sales.get(Number(id));
            if (localSale) return localSale;
            throw new Error('Sale not found');
        } catch (error) {
            const localSale = await db.sales.get(Number(id));
            if (localSale) return localSale;
            throw error;
        }
    },

    getCustomers: async () => {
        try {
            if (navigator.onLine) {
                const response = await api.get('customers');
                const customers = response.data.data;
                // Cache customers for offline credit sales
                await db.customers.bulkPut(customers);
                return customers;
            }
            return await db.customers.toArray();
        } catch (error) {
            return await db.customers.toArray();
        }
    }
};
