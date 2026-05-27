export interface Product {
  id: string;
  name: string;
  barcode?: { String: string; Valid: boolean };
  price: { Int64: number; Valid: boolean } | number;
  cost_price: { Int64: number; Valid: boolean } | number;
  market_price?: { Int64: number; Valid: boolean } | number;
  stock_quantity: number;
  damaged_quantity?: number;
  warranty_days?: number;
  low_stock_threshold: { Int32: number; Valid: boolean } | number;
  expires_at?: { Time: string; Valid: boolean };
  status: { product_status: 'active' | 'out_of_stock' | 'discontinued'; valid: boolean };
  category_id: string;
  supplier_id?: string;
  store_id: string;
  image_url?: { String: string; Valid: boolean };
  is_tracked?: boolean;
  variants?: ProductVariant[];
  created_at: { Time: string; Valid: boolean };
  updated_at: { Time: string; Valid: boolean };
  synced?: number; // 0 = not synced, 1 = synced, -1 = marked for deletion
}

export interface Sale {
  id?: string | number;
  sale_date: string;
  items: SaleItem[];
  total: number;
  sales_type: "cash" | "credit" | "online" | "mixed";
  payments: PaymentRecord[];
  customer_id: string;
  discount_applied: number;
  is_paid: boolean;
  synced?: number;
}

export interface PaymentRecord {
  id: string;
  sale_id: string;
  amount: number;
  payment_type: "cash" | "credit" | "online";
  provider?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyalty_status: 'regular' | 'loyal' | 'vip';
  purchase_count: number;
  loyalty_points: number;
  last_purchase_at?: string;
  credit_limit?: number;
  current_debt?: number;
  created_at: string;
  store_id: string;
  synced?: number;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  warranty_days?: number;
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
  created_at?: string;
  updated_at?: string;
  synced?: number; // 0 = not synced, 1 = synced
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  store_id?: string;
  product_count?: number;
  low_stock_count?: number;
  created_at?: string;
  updated_at?: string;
  synced?: number; // 0 = not synced, 1 = synced
  //newer ones
  bank_name?: string;
  branch?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
  esewa_id?: string;
  khalti_id?: string;
}

export interface OfflineStatus {
  isOnline: boolean;
  pendingSales: number;
  pendingProducts: number;
  pendingCategories: number;
  pendingSuppliers: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncError: string | null;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>;
  cost_price: number;
  selling_price: number;
  stock_level: number;
  damaged_stock_level?: number;
  image_url?: string;
  archived_at?: string;
  synced?: number; // 0 = not synced, 1 = synced
}

export interface ReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  quantity: number;
  reason: string;
  condition: string;
  product_name?: string;
  variant_sku?: string;
}

export interface Return {
  id: string;
  sale_id: string;
  store_id: string;
  refund_amount: number;
  refund_method: string;
  created_at: string;
  sale_total?: number;
  customer_name?: string;
  items?: ReturnItem[];
}

export interface PendingReturnItem {
  sale_item_id: string;
  quantity: number;
  reason: string;
  condition: string;
}

export interface PendingReturn {
  id?: number;
  offlineId: string;
  sale_id: string;
  refund_amount: number;
  refund_method: string;
  items: PendingReturnItem[];
  created_at: string;
  synced: number;
}

export interface PurchaseOrder {
  id: string;
  store_id: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  notes?: string;
  total_cost: number;
  created_at: string;
  updated_at: string;
  items_json?: string;
  suppliers_json?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  supplier_id: string;
  supplier_name: string;
  product_id?: string;
  product_name: string;
  ordered_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
  product_name_lookup?: string;
}

export interface PurchaseOrderSupplier {
  id: string;
  name: string;
}

