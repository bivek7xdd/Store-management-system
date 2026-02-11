import api from "./api";

export interface MarketPriceItem {
    title: string;
    link: string;
    price: string;
    source: string;
    image: string;
    snippet: string;
}

export const marketService = {
    getMarketPrices: async (query: string): Promise<MarketPriceItem[]> => {
        try {
            const response = await api.get(`/market/prices?q=${encodeURIComponent(query)}`);
            if (response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch market prices:", error);
            return [];
        }
    }
};
