import api from './api';
import { db, Sale, SaleItem } from '../db/db';
import { syncService } from './syncService';

export type { SaleItem };

export interface SaleItemReq {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number; // Added total_price to match db schema
    product_name: string; // Added product_name to match db schema
}

export interface CreateSaleData {
    sales_type: 'cash' | 'credit' | 'online';
    amount_paid: number;
    total_amount: number; // Added total_amount to match Sale interface
    note?: string;
    discount_applied: number;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    items: SaleItemReq[];
    sale_date?: string; // Optional override
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
            await db.transaction('rw', db.products, async () => {
                for (const item of data.items) {
                    const product = await db.products.get(item.product_id);
                    if (product) {
                        const newStock = Math.max(0, product.stock_quantity - item.quantity);
                        await db.products.update(item.product_id, {
                            stock_quantity: newStock
                        });
                        console.log(`[Sales] Updated stock for ${product.name}: ${product.stock_quantity} -> ${newStock}`);
                    }
                }
            });
        } catch (e) {
            console.error('[Sales] Failed to update local inventory:', e);
            // Don't fail the sale just because inventory update failed, but it's bad.
        }

        // 2. Trigger background sync if online
        // We don't await this, so UI gets immediate response
        if (navigator.onLine) {
            syncService.syncSales().catch(err => console.error('Background sync failed:', err));
        }

        // Return the local sale object with the generated ID
        return {
            id: saleId.toString(), // Convert to string to match existing API ID type if needed
            ...data,
            sale_date: data.sale_date || new Date().toISOString(),
        };
    },

    getSales: async () => {
        // For offline first, we should return local sales?
        // Or hybrid?
        // If we want a full history, we need to sync server -> local.
        // For now, let's try getting from API if online, else local.
        try {
            if (navigator.onLine) {
                const response = await api.get('sales');
                // Ideally, we would cache these too.
                // But `sales` table in Dexie might conflict with server IDs if not careful (using ++id).
                // Strategy: Use Dexie mainly for unsynced sales queue, and API for history.
                // Or: Separate table for history?
                // Given the instructions, the priority is "handle inventory and POS logic when internet is down".
                // Reading PAST sales history offline might be secondary.
                // Let's return API data if online.
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
