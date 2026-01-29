import api from "./api";

export interface ReportStats {
    sales: {
        total: number;
        count: number;
        growth?: number; // Added optional growth percentage
        aov?: number;    // Added optional AOV
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
        forecast: Array<{ // Added forecast
            date: string;
            predicted_sales: number;
        }>;
        top_products: Array<{
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
    insights: Array<{
        type: "success" | "warning" | "info";
        message: string;
        details?: string[]; // Added optional details for specific items (e.g. product names)
    }>;
    date_range: {
        start: string;
        end: string;
    };
}

export const getReportStats = async (range: string = "today"): Promise<ReportStats> => {
    const response = await api.get(`/reports/stats?range=${range}`);
    return response.data.data; // Assuming backend returns { message: "...", data: { ... } }
};
