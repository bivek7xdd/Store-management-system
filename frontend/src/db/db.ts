import Dexie, { Table } from 'dexie';
import { Product, Category, Supplier, Customer } from '../types';
import { Notification } from '../services/notifications';
import { Debt } from '../services/debts';

export interface SaleItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
}

export interface Sale {
    id?: number; // Local auto-increment ID
    offlineId?: string; // UUID for syncing
    sales_type: 'cash' | 'credit' | 'online' | 'mixed';
    amount_paid?: number;
    total_amount: number;
    discount_applied: number;
    note?: string;
    sale_date: string;
    customer_id: string;
    payments?: any[];
    items?: SaleItem[];
    synced: number; // 0 = false, 1 = true
    customer_name?: string;
    customer_phone?: string;
}



export class StoreDatabase extends Dexie {
    products!: Table<Product, string>;
    categories!: Table<Category, string>;
    suppliers!: Table<Supplier, string>;
    sales!: Table<Sale, number>;
    customers!: Table<Customer, string>;
    notifications!: Table<Notification, string>;
    debts!: Table<Debt, string>;
    constructor() {
        super('store-manager-db');
        this.version(9).stores({
            products: 'id, name, barcode, category_id, synced', // frequently queried fields
            categories: 'id, name, synced',
            suppliers: 'id, name, synced',
            sales: '++id, offlineId, synced, sale_date, customer_id',
            customers: 'id, name, phone, loyalty_status',
            notifications: 'id, reference_id, type, status, created_at',
            debts: 'id, customer_id, status'
        });
    }
}

export const db = new StoreDatabase();
