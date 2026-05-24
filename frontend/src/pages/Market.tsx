import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lightbulb, Users, Loader2, RefreshCw, AlertCircle, ExternalLink, Package } from "lucide-react";
import { toast } from "sonner";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

import { useAuth } from "@/contexts/AuthContext";
import { inventoryService } from "@/services/inventory";
import { marketService, MarketPriceItem } from "@/services/marketService";
import { Product } from "@/types";

export default function Market() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [competitorStats, setCompetitorStats] = useState<{ count: number; status: string; color: string; message: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Market Price State
  const [trackedProducts, setTrackedProducts] = useState<Product[]>([]);
  const [marketPricesMap, setMarketPricesMap] = useState<Record<string, MarketPriceItem[]>>({});
  const [pricesLoading, setPricesLoading] = useState<Record<string, boolean>>({});

  // Initialize data based on user profile
  useEffect(() => {
    getUserLocation();
  }, [user]);

  // Initial fetch for tracked products and prices
  useEffect(() => {
    const initTracker = async () => {
      try {
        const tracked = await inventoryService.getTrackedProducts();
        setTrackedProducts(tracked);

        // Fetch prices for each tracked product
        tracked.forEach(product => {
          fetchPricesForProduct(product);
        });
      } catch (err) {
        console.error("Failed to fetch tracked products:", err);
      }
    };

    initTracker();
  }, []);

  const fetchPricesForProduct = async (product: Product) => {
    setPricesLoading(prev => ({ ...prev, [product.id]: true }));
    try {
      const results = await marketService.getMarketPrices(product.name);
      setMarketPricesMap(prev => ({ ...prev, [product.id]: results }));
    } catch (err) {
      console.error(`Failed to fetch prices for ${product.name}:`, err);
    } finally {
      setPricesLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };


  const getUserLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        console.error("Location error:", err);
        setError("Could not access location. Please enable permissions to see local insights.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    if (userLocation) {
      fetchCompetitorData();
    }
  }, [userLocation]);

  const fetchCompetitorData = async () => {
    if (!userLocation || !GEOAPIFY_API_KEY) {
      setLoading(false);
      return;
    }

    try {
      const categories = [
        'commercial.supermarket',
        'commercial.marketplace',
        'commercial.shopping_mall',
        'commercial.department_store'
      ].join(',');

      const params = new URLSearchParams({
        categories: categories,
        filter: `circle:${userLocation.lng},${userLocation.lat},5000`,
        limit: "50",
        apiKey: GEOAPIFY_API_KEY,
      });

      const response = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        const count = data.features ? data.features.length : 0;

        let status = "Moderate";
        let color = "bg-yellow-500";
        let message = "Competition is balanced. Focus on unique value.";

        if (count < 5) {
          status = "Low Competition";
          color = "bg-green-500";
          message = "Great Opportunity! There are very few competitors nearby.";
        } else if (count > 20) {
          status = "High Saturation";
          color = "bg-red-500";
          message = "Market is crowded. Competitive pricing is key.";
        }

        setCompetitorStats({ count, status, color, message });
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Failed to load competitor data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div data-tour="market-header">
        <h1 className="text-[24px] font-bold text-white tracking-tight">Market Insights</h1>
        <p className="text-[#888888] text-sm mt-1">Real-time competitor analysis and market trends</p>
      </div>

      <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] overflow-hidden relative" data-tour="market-competitors">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B1A1A] to-[#DA291C] opacity-90 z-0" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-[2px] bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Users className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Local Market Intelligence</h3>
                <p className="text-white/80 text-sm max-w-md">Analyzed businesses within 5km radius of your location.</p>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-red-200 bg-red-900/30 px-3 py-1 rounded-[2px] text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}
              </div>
            </div>

            {!loading && !error && competitorStats ? (
              <div className="bg-white/10 rounded-[2px] p-4 backdrop-blur-sm min-w-[200px] border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Competitors</span>
                  <Badge className={`${competitorStats.color} border-0`}>{competitorStats.status}</Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{competitorStats.count}</div>
                <p className="text-xs text-white/80">{competitorStats.message}</p>
              </div>
            ) : !loading && !error && !competitorStats && (
              <Button onClick={getUserLocation} variant="secondary" size="sm">Enable Location</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracked Online Prices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[2px] bg-[#DA291C]/10">
              <TrendingUp className="h-5 w-5 text-[#DA291C]" />
            </div>
            <h2 className="text-[16px] font-bold text-white" data-tour="market-prices">Tracked Online Prices</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              trackedProducts.forEach(p => fetchPricesForProduct(p));
              toast.success("Refreshing market prices...");
            }}
          >
            <RefreshCw className="h-3 w-3 mr-2" /> Refresh All
          </Button>
        </div>

        {trackedProducts.length === 0 ? (
          <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#DA291C]" />
                </div>
                <div>
                  <h3 className="font-medium text-white">No tracked products</h3>
                  <p className="text-sm text-[#888888] mt-1">Select up to 6 products from your inventory to track prices here.</p>
                </div>
                <Button variant="subtle" size="sm" className="mt-2 text-[#DA291C]" asChild>
                  <a href="/inventory">Go to Inventory</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {trackedProducts.slice(0, 6).map((product) => {
              const prices = marketPricesMap[product.id] || [];
              const isLoading = pricesLoading[product.id];
              const storePrice = typeof product.price === 'number' ? product.price : 0;

              return (
                <Card key={product.id} className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] overflow-hidden">
                  <CardHeader className="bg-[#0A0A0A] pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[2px] bg-[#111111] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-[#DA291C]" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-white">{product.name}</CardTitle>
                          <p className="text-xs text-[#888888]">Your Price: रू {storePrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-[#DA291C]/10 text-[#DA291C] border-[#DA291C]/20 text-[10px]">Tracking Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#DA291C]" />
                        <span className="ml-2 text-sm text-[#888888]">Fetching latest prices...</span>
                      </div>
                    ) : prices.length === 0 ? (
                      <div className="text-center py-8 bg-[#0A0A0A] rounded-[2px]">
                        <p className="text-sm text-[#666666]">No online matches found.</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-[#DA291C] text-[10px]" onClick={() => fetchPricesForProduct(product)}>Retry</Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                        {prices.slice(0, 2).map((item, idx) => {
                          // Remove currency text first to avoid keeping the dot in "Rs."
                          // Then remove non-digits (keeping decimal point for cents if any)
                          const cleanPrice = item.price.replace(/Rs\.?|NPR\.?|रू|₨/gi, '').replace(/[^\d.]/g, '');
                          const marketNum = parseFloat(cleanPrice) || 0;
                          const diff = storePrice - marketNum;

                          return (
                            <div key={idx} className="p-3 rounded-[2px] border border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#DA291C]/30 transition-colors">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-[11px] font-semibold text-white line-clamp-2 flex-1">{item.title}</p>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 whitespace-nowrap bg-[#DA291C]/10 text-[#DA291C] border-[#DA291C]/20">{item.source}</Badge>
                              </div>
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-0.5">Online Price</p>
                                  <p className="text-sm font-bold text-[#DA291C]">{item.price}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-0.5">Gap</p>
                                  {marketNum > 0 ? (
                                    <p className={`text-xs font-bold ${diff > 0 ? 'text-[#DA291C]' : 'text-[#22C55E]'}`}>
                                      {diff > 0 ? '+' : ''}रू {Math.abs(diff).toLocaleString()}
                                    </p>
                                  ) : (
                                    <p className="text-xs font-bold text-[#555555]">N/A</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#DA291C] hover:underline flex items-center">
                                  View Item <ExternalLink className="ml-1 h-2 w-2" />
                                </a>
                                {marketNum > 0 && diff < 0 && (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-1.5">
                                    Higher Profit
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>


      <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-[#888888]">Sources: Daraz, Hamrobazar, OkDam. Competition data from Geoapify.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
