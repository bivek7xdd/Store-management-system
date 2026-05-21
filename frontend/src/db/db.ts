import Dexie, { Table } from 'dexie';
import { Product, Category, Supplier, Customer, ProductVariant, PendingReturn, PendingReturnItem } from '../types';
import { Notification } from '../services/notifications';
import { Debt } from '../services/debts';



export interface SaleItem {
    id?: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    variant_attributes?: any;
    warranty_days?: number;
}

export interface Sale {
    id?: number; // Local auto-increment ID
    offlineId?: string; // UUID for syncing
    sales_type: 'cash' | 'credit' | 'online' | 'mixed';
    amount_paid?: number;
    total_amount: number;
    total?: number;
    discount_applied: number;
    note?: string;
    sale_date: string;
    customer_id: string;
    payments?: any[];
    items?: SaleItem[];
    synced: number; // 0 = false, 1 = true
    customer_name?: string;
    customer_phone?: string;
    is_paid?: boolean;
}



export class StoreDatabase extends Dexie {
    products!: Table<Product, string>;
    categories!: Table<Category, string>;
    suppliers!: Table<Supplier, string>;
    sales!: Table<Sale, number>;
    customers!: Table<Customer, string>;
    notifications!: Table<Notification, string>;
    debts!: Table<Debt, string>;
    product_variants!: Table<ProductVariant, string>;
    pending_returns!: Table<PendingReturn, number>;
    constructor() {
        super('store-manager-db');
        this.version(11).stores({
            products: 'id, name, barcode, category_id, synced', // frequently queried fields
            categories: 'id, name, synced',
            suppliers: 'id, name, synced',
            sales: '++id, offlineId, synced, sale_date, customer_id',
            customers: 'id, name, phone, loyalty_status',
            notifications: 'id, reference_id, type, status, created_at',
            debts: 'id, customer_id, status',
            product_variants: 'id, product_id, sku, barcode, synced',
            pending_returns: '++id, offlineId, synced, sale_id'
        });
    }
}

export const db = new StoreDatabase();
