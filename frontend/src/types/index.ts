export interface Product {
  id: string;
  name: string;
  barcode?: { String: string; Valid: boolean };
  price: { Int64: number; Valid: boolean } | number;
  market_price?: { Int64: number; Valid: boolean } | number;
  stock_quantity: number;
  low_stock_threshold: { Int32: number; Valid: boolean } | number;
  expires_at?: { Time: string; Valid: boolean };
  status: { product_status: 'active' | 'out_of_stock' | 'discontinued'; valid: boolean };
  category_id: string;
  supplier_id?: string;
  store_id: string;
  image_url?: { String: string; Valid: boolean };
  created_at: { Time: string; Valid: boolean };
  updated_at: { Time: string; Valid: boolean };
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentType: "cash" | "credit";
  customerName?: string;
  customerPhone?: string;
  isPaid: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Debtor {
  id: string;
  name: string;
  phone: string;
  outstandingAmount: number;
  lastTransaction: string;
  sales: Sale[];
}

export interface MarketInsight {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  store_id?: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  store_id?: string;
}
