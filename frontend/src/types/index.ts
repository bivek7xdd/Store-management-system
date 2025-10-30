export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  expiryDate?: string;
  lowStockThreshold: number;
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
