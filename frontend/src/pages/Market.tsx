import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, ArrowUp, Lightbulb, Users, Loader2, RefreshCw, AlertCircle, ExternalLink, Package } from "lucide-react";
import { toast } from "sonner";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

import { useAuth } from "@/contexts/AuthContext";
import { BUSINESS_CATEGORIES } from "@/data/businessCategories";
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

  // News State
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCategory, setNewsCategory] = useState("All");

  // Determine available categories based on user profile
  const [newsCategories, setNewsCategories] = useState<string[]>(["All"]);

  // Initialize Category based on user's actual product categories from their store
  useEffect(() => {
    getUserLocation();

    const fetchUserCategories = async () => {
      try {
        const categories = await inventoryService.getCategories();

        if (categories && categories.length > 0) {
          const categoryNames = categories.map(c => c.name);
          setNewsCategories(["All", ...categoryNames]);
          setNewsCategory(categoryNames[0]);
        } else if (user?.product_subcategories && user.product_subcategories.length > 0) {
          setNewsCategories(["All", ...user.product_subcategories]);
          setNewsCategory(user.product_subcategories[0]);
        } else if (user?.business_category) {
          const matchedCategory = BUSINESS_CATEGORIES.find(c => c.id === user.business_category);
          if (matchedCategory) {
            setNewsCategories(["All", matchedCategory.name]);
            setNewsCategory(matchedCategory.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        if (user?.product_subcategories && user.product_subcategories.length > 0) {
          setNewsCategories(["All", ...user.product_subcategories]);
        }
      }
    };

    if (user) {
      fetchUserCategories();
    }
  }, [user]);

  // Fetch news when category changes
  useEffect(() => {
    setNews([]);
    fetchMarketNews();
  }, [newsCategory, user?.id]);

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

  const fetchMarketNews = async () => {
    setNewsLoading(true);
    try {
      let query = "Business Nepal";

      if (newsCategory === "All") {
        if (user?.product_subcategories && user.product_subcategories.length > 0) {
          const subcats = user.product_subcategories.slice(0, 2).join(" OR ");
          query = `${subcats} market Nepal`;
        } else if (user?.business_category) {
          const categoryObj = BUSINESS_CATEGORIES.find(c => c.id === user.business_category);
          if (categoryObj) {
            query = `${categoryObj.name} business Nepal`;
          }
        }
      } else {
        const categoryObj = BUSINESS_CATEGORIES.find(c => c.name === newsCategory);
        if (categoryObj) {
          switch (categoryObj.id) {
            case 'groceries': query = "Food price Nepal OR Agriculture Nepal"; break;
            case 'electronics': query = "Technology market Nepal OR Mobile phones Nepal"; break;
            case 'apparel-fashion': query = "Textile market Nepal OR Fashion Nepal"; break;
            case 'hardware-tools': query = "Construction materials Nepal OR Hardware price"; break;
            case 'automotive': query = "Vehicle market Nepal OR Auto parts Nepal"; break;
            case 'home-garden': query = "Furniture market Nepal OR Home decor Nepal"; break;
            default: query = `${categoryObj.name} market Nepal`;
          }
        } else {
          const catLower = newsCategory.toLowerCase();
          if (catLower.includes("dairy")) query = "Milk price Nepal OR Dairy industry Nepal";
          else if (catLower.includes("produce") || catLower.includes("vegetable") || catLower.includes("fruit")) query = "Vegetable price Kalimati Nepal OR Fruit market Nepal";
          else if (catLower.includes("meat") || catLower.includes("poultry") || catLower.includes("chicken")) query = "Chicken price Nepal OR Meat market Nepal";
          else if (catLower.includes("beverage") || catLower.includes("drink")) query = "Beverage industry Nepal OR Liquor market Nepal";
          else if (catLower.includes("bakery") || catLower.includes("bread")) query = "Bakery business Nepal OR Wheat price Nepal";
          else if (catLower.includes("mobile") || catLower.includes("phone")) query = "Mobile phone tax Nepal OR Smartphone market Nepal";
          else if (catLower.includes("computer") || catLower.includes("laptop")) query = "Computer market Nepal OR IT hardware Nepal";
          else if (catLower.includes("furniture")) query = "Furniture price Nepal OR Timber market";
          else query = `${newsCategory} market Nepal`;
        }
      }

      const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`);

      let articles: any[] = [];
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          articles = data.articles.slice(0, 6).map((article: any, index: number) => ({
            id: index,
            title: article.title,
            description: article.description || article.content,
            date: article.publishedAt,
            category: newsCategory === "All" ? "Business" : newsCategory,
            source: article.source.name,
            url: article.url,
            image: article.urlToImage
          }));
        }
      }

      setNews(articles);
    } catch (err) {
      console.error("News API Error:", err);
      setNews([]);
    } finally {
      setNewsLoading(false);
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
    <div className="space-y-6 pb-20 lg:pb-6">
      <div data-tour="market-header">
        <h1 className="text-3xl font-bold text-gray-900">Market Insights</h1>
        <p className="text-gray-500 mt-1">Real-time competitor analysis and market trends</p>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden relative" data-tour="market-competitors">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-teal-800 opacity-90 z-0" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Users className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Local Market Intelligence</h3>
                <p className="text-white/80 text-sm max-w-md">Analyzed businesses within 5km radius of your location.</p>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-red-200 bg-red-900/30 px-3 py-1 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}
              </div>
            </div>

            {!loading && !error && competitorStats ? (
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm min-w-[200px] border border-white/20">
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
            <div className="p-2 rounded-lg bg-teal-50">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900" data-tour="market-prices">Tracked Online Prices</h2>
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
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">No tracked products</h3>
                  <p className="text-sm text-gray-500 mt-1">Select up to 6 products from your inventory to track prices here.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 text-teal-600 border-teal-200 hover:bg-teal-50" asChild>
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
                <Card key={product.id} className="border-0 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gray-50/50 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-gray-900">{product.name}</CardTitle>
                          <p className="text-xs text-gray-500">Your Price: रू {storePrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-white text-teal-700 border-teal-100 text-[10px]">Tracking Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                        <span className="ml-2 text-sm text-gray-500">Fetching latest prices...</span>
                      </div>
                    ) : prices.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-400">No online matches found.</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-teal-600 text-[10px]" onClick={() => fetchPricesForProduct(product)}>Retry</Button>
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
                            <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-white hover:border-teal-100 transition-colors">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-[11px] font-semibold text-gray-900 line-clamp-2 flex-1">{item.title}</p>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 whitespace-nowrap bg-teal-50 text-teal-700 border-teal-100">{item.source}</Badge>
                              </div>
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Online Price</p>
                                  <p className="text-sm font-bold text-teal-700">{item.price}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Gap</p>
                                  {marketNum > 0 ? (
                                    <p className={`text-xs font-bold ${diff > 0 ? 'text-rose-500' : 'text-green-600'}`}>
                                      {diff > 0 ? '+' : ''}रू {Math.abs(diff).toLocaleString()}
                                    </p>
                                  ) : (
                                    <p className="text-xs font-bold text-gray-300">N/A</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 hover:underline flex items-center">
                                  View Item <ExternalLink className="ml-1 h-2 w-2" />
                                </a>
                                {marketNum > 0 && diff < 0 && (
                                  <Badge className="bg-green-50 text-green-700 border-green-100 text-[9px] px-1.5">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Latest Market News</h2>
          <Button variant="outline" size="sm" onClick={fetchMarketNews} disabled={newsLoading}>
            <RefreshCw className={`h-3 w-3 mr-2 ${newsLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {newsCategories.map((cat) => (
            <Badge key={cat} variant={newsCategory === cat ? "default" : "outline"} className={`cursor-pointer max-w-fit px-3 py-1 ${newsCategory === cat ? "bg-teal-600 hover:bg-teal-700" : "hover:bg-gray-100"}`} onClick={() => setNewsCategory(cat)}>{cat}</Badge>
          ))}
        </div>
        {newsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm h-[200px] flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 text-gray-300 animate-spin" /></Card>
            ))}
          </div>
        ) : news.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center"><AlertCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" /><h3 className="font-medium text-gray-900">No news found</h3><Button variant="outline" size="sm" onClick={fetchMarketNews} className="mt-2">Try Again</Button></CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((insight) => (
              <Card key={insight.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {insight.image && <div className="h-32 w-full overflow-hidden bg-gray-100"><img src={insight.image} alt="" className="w-full h-full object-cover" /></div>}
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between"><Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100">{insight.source}</Badge><div className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />{new Date(insight.date).toLocaleDateString()}</div></div>
                  <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mt-2"><a href={insight.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600">{insight.title}</a></CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between"><p className="text-xs text-gray-500 line-clamp-3 mb-3">{insight.description}</p><a href={insight.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-600 flex items-center mt-auto">Read full article <ArrowUp className="h-3 w-3 ml-1 rotate-45" /></a></CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-gray-500">Sources: Daraz, Hamrobazar, OkDam. Competition data from Geoapify.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
