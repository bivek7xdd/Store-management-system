import { Product, Sale, Debtor, MarketInsight } from "@/types";

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Basmati Rice",
    category: "Grains",
    barcode: "8901234567890",
    costPrice: 110,
    sellingPrice: 130,
    stock: 45,
    expiryDate: "2025-12-31",
    lowStockThreshold: 10,
  },
  {
    id: "2",
    name: "Cooking Oil (1L)",
    category: "Cooking Essentials",
    costPrice: 180,
    sellingPrice: 210,
    stock: 3,
    expiryDate: "2025-08-15",
    lowStockThreshold: 5,
  },
  {
    id: "3",
    name: "Toor Dal",
    category: "Pulses",
    barcode: "8901234567891",
    costPrice: 140,
    sellingPrice: 165,
    stock: 22,
    expiryDate: "2025-11-20",
    lowStockThreshold: 8,
  },
  {
    id: "4",
    name: "Tea Powder (500g)",
    category: "Beverages",
    costPrice: 320,
    sellingPrice: 380,
    stock: 15,
    expiryDate: "2025-06-10",
    lowStockThreshold: 5,
  },
  {
    id: "5",
    name: "Milk Powder",
    category: "Dairy",
    costPrice: 450,
    sellingPrice: 520,
    stock: 2,
    expiryDate: "2025-03-25",
    lowStockThreshold: 4,
  },
  {
    id: "6",
    name: "Sugar (1kg)",
    category: "Cooking Essentials",
    costPrice: 55,
    sellingPrice: 65,
    stock: 60,
    lowStockThreshold: 15,
  },
];

export const mockSales: Sale[] = [
  {
    id: "s1",
    date: "2025-01-30T10:30:00",
    items: [
      { productId: "1", productName: "Basmati Rice", quantity: 2, price: 130, total: 260 },
      { productId: "3", productName: "Toor Dal", quantity: 1, price: 165, total: 165 },
    ],
    total: 425,
    paymentType: "cash",
    isPaid: true,
  },
  {
    id: "s2",
    date: "2025-01-30T14:15:00",
    items: [
      { productId: "2", productName: "Cooking Oil (1L)", quantity: 3, price: 210, total: 630 },
    ],
    total: 630,
    paymentType: "credit",
    customerName: "Ram Sharma",
    customerPhone: "9841234567",
    isPaid: false,
  },
  {
    id: "s3",
    date: "2025-01-29T16:45:00",
    items: [
      { productId: "4", productName: "Tea Powder (500g)", quantity: 1, price: 380, total: 380 },
      { productId: "6", productName: "Sugar (1kg)", quantity: 2, price: 65, total: 130 },
    ],
    total: 510,
    paymentType: "cash",
    isPaid: true,
  },
];

export const mockDebtors: Debtor[] = [
  {
    id: "d1",
    name: "Ram Sharma",
    phone: "9841234567",
    outstandingAmount: 1250,
    lastTransaction: "2025-01-30",
    sales: [mockSales[1]],
  },
  {
    id: "d2",
    name: "Sita Thapa",
    phone: "9849876543",
    outstandingAmount: 890,
    lastTransaction: "2025-01-28",
    sales: [],
  },
  {
    id: "d3",
    name: "Krishna Rai",
    phone: "9851112233",
    outstandingAmount: 2340,
    lastTransaction: "2025-01-25",
    sales: [],
  },
];

export const mockMarketInsights: MarketInsight[] = [
  {
    id: "m1",
    title: "Rice Prices Stabilizing",
    description: "Basmati rice prices in Kathmandu markets holding steady at रू 120-130/kg",
    date: "2025-01-30",
    category: "Grains",
  },
  {
    id: "m2",
    title: "High Demand for Cooking Oil",
    description: "Increased demand for cooking oil expected ahead of festival season",
    date: "2025-01-29",
    category: "Cooking Essentials",
  },
  {
    id: "m3",
    title: "Tea Powder Supply Improving",
    description: "Local suppliers report better availability of quality tea powder",
    date: "2025-01-28",
    category: "Beverages",
  },
];
