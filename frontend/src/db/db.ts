import Dexie, { Table } from 'dexie';
import { Product, Category, Supplier } from '../types';
import { Notification } from '../services/notifications';

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
    sales_type: 'cash' | 'credit' | 'online';
    amount_paid: number;
    total_amount: number;
    discount_applied: number;
    note?: string;
    sale_date: string;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    items: SaleItem[];
    synced: number; // 0 = false, 1 = true
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    credit_limit?: number;
    current_debt?: number;
}

export class StoreDatabase extends Dexie {
    products!: Table<Product, string>;
    categories!: Table<Category, string>;
    suppliers!: Table<Supplier, string>;
    sales!: Table<Sale, number>;
    customers!: Table<Customer, string>;
    notifications!: Table<Notification, string>;

    constructor() {
        super('store-manager-db');
        this.version(4).stores({
            products: 'id, name, barcode, category_id', // frequently queried fields
            categories: 'id, name',
            suppliers: 'id, name',
            sales: '++id, offlineId, synced, sale_date, customer_id',
            customers: 'id, name, phone',
            notifications: 'id, type, status, created_at, reference_id'
        });
    }
}

export const db = new StoreDatabase();
