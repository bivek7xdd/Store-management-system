import api from "./api";

// ── Insight types ──────────────────────────────────────────────────────────────
export interface Insight {
    type: "success" | "warning" | "info" | "alert" | "opportunity";
    message: string;
    action?: "view_sales" | "view_debtors" | "view_dead_stock" | "view_velocity" | "view_basket" | string;
    details?: string[];
}

// ── Dead Stock ────────────────────────────────────────────────────────────────
export interface DeadStockItem {
    product_id: string;
    product_name: string;
    category_name: string;
    stock_quantity: number;
    cost_price: number;
    capital_tied_up: number;
    days_since_last_sale: number;
}

export interface DeadStockCategorySummary {
    category: string;
    total: number;
}

export interface DeadStock {
    total_60d: number;
    total_90d: number;
    total_120d: number;
    items: DeadStockItem[];
    by_category: DeadStockCategorySummary[];
}

// ── Velocity ──────────────────────────────────────────────────────────────────
export interface VelocityItem {
    product_name: string;
    category_name: string;
    stock_quantity: number;
    avg_daily_sales: number;
    estimated_days_to_stockout: number;
}

// ── Basket Pairs ─────────────────────────────────────────────────────────────
export interface BasketPair {
    product_a_name: string;
    product_b_name: string;
    pair_frequency: number;
}

// ── Traffic Heatmap ──────────────────────────────────────────────────────────
export interface HeatmapCell {
    day_of_week: number;   // 1=Mon … 7=Sun (ISO DOW)
    hour_of_day: number;   // 0–23
    transaction_count: number;
}

// ── Full Report Stats ────────────────────────────────────────────────────────
export interface ReportStats {
    sales: {
        total: number;
        count: number;
        growth?: number;
        aov?: number;
        cash: number;
        credit: number;
        online: number;
        recent: Array<{
            id: string;
            total_amount: number;
            sales_type: "cash" | "credit" | "online";
            sale_date: string;
            customer_name: string | null;
        }>;
        daily_trend: Array<{
            sale_date: string;
            daily_total: number;
        }>;
        forecast: Array<{
            date: string;
            predicted_sales: number;
        }>;
        top_products: Array<{
            product_id: string;
            product_name: string;
            total_quantity: number;
        }>;
    };
    inventory: {
        total_products: number;
        total_value: number;
        low_stock: number;
        stock_by_category: Array<{
            category_name: string;
            product_count: number;
        }>;
        revenue_by_category?: Array<{
            category_name: string;
            total_revenue: number;
        }>;
    };
    debts: {
        total_outstanding: number;
        total_debtors: number;
        top_debtors: Array<{
            customer_name: string;
            customer_phone: string;
            total_debt: number;
            last_transaction: string;
        }>;
    };
    profit: {
        total_revenue: number;
        total_cost: number;
        gross_profit: number;
    };
    insights: Insight[];
    dead_stock: DeadStock;
    velocity: VelocityItem[];
    basket_pairs: BasketPair[];
    traffic_heatmap: HeatmapCell[];
    date_range: {
        start: string;
        end: string;
    };
}

export const getReportStats = async (range: string = "today"): Promise<ReportStats> => {
    const response = await api.get(`/reports/stats?range=${range}`);
    return response.data.data;
};

export const exportReportCSV = async (range: string = "today") => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reports/export/csv?range=${range}&token=${token}`;
    window.open(url, '_blank');
};

export const exportReportPDF = async (range: string = "today") => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reports/export/pdf?range=${range}&token=${token}`;
    window.open(url, '_blank');
};
