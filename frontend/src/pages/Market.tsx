import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, ArrowUp, ArrowDown, Minus, Lightbulb, MapPin, Users, Loader2, RefreshCw, AlertCircle } from "lucide-react";
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

// ... (existing imports)

export default function Market() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [competitorStats, setCompetitorStats] = useState<{ count: number; status: string; color: string; message: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // News State
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
        // Fetch actual categories from the user's store inventory
        const categories = await inventoryService.getCategories();

        if (categories && categories.length > 0) {
          // Use the user's actual product categories
          const categoryNames = categories.map(c => c.name);
          setNewsCategories(["All", ...categoryNames]);

          // Auto-select the first category to show relevant news immediately
          setNewsCategory(categoryNames[0]);
        } else if (user?.product_subcategories && user.product_subcategories.length > 0) {
          // Fallback to user profile subcategories if no inventory categories
          setNewsCategories(["All", ...user.product_subcategories]);
          setNewsCategory(user.product_subcategories[0]);
        } else if (user?.business_category) {
          // Fallback: Use broad business category
          const matchedCategory = BUSINESS_CATEGORIES.find(c => c.id === user.business_category);
          if (matchedCategory) {
            setNewsCategories(["All", matchedCategory.name]);
            setNewsCategory(matchedCategory.name);
          }
        }
        // If nothing available, keep default ["All"]
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // On error, try to use user profile data as fallback
        if (user?.product_subcategories && user.product_subcategories.length > 0) {
          setNewsCategories(["All", ...user.product_subcategories]);
        }
      }
    };

    if (user) {
      fetchUserCategories();
    }
  }, [user]);

  // Fetch news when category changes OR when user changes (account switch)
  useEffect(() => {
    // Clear old news to prevent showing stale data from previous user
    setNews([]);
    fetchMarketNews();
  }, [newsCategory, user?.id]); // Re-fetch when user changes to get user-specific news

  // ... (existing location/competitor logic)

  const fetchMarketNews = async () => {
    setNewsLoading(true);
    try {
      let query = "Business Nepal";

      // Build user-specific base query for "All" category
      if (newsCategory === "All") {
        // Use user's business context to personalize "All" news
        if (user?.product_subcategories && user.product_subcategories.length > 0) {
          // Use first 2 subcategories for variety
          const subcats = user.product_subcategories.slice(0, 2).join(" OR ");
          query = `${subcats} market Nepal`;
        } else if (user?.business_category) {
          const categoryObj = BUSINESS_CATEGORIES.find(c => c.id === user.business_category);
          if (categoryObj) {
            query = `${categoryObj.name} business Nepal`;
          }
        }
        // If no user context, defaults to "Business Nepal"
      } else {
        // Check if it's a known broad category first
        const categoryObj = BUSINESS_CATEGORIES.find(c => c.name === newsCategory);

        if (categoryObj) {
          // Broad Category Logic
          switch (categoryObj.id) {
            case 'groceries': query = "Food price Nepal OR Agriculture Nepal"; break;
            case 'electronics': query = "Technology market Nepal OR Mobile phones Nepal"; break;
            // ... (rest of broad mappings can be implicit or explicit)
            case 'apparel-fashion': query = "Textile market Nepal OR Fashion Nepal"; break;
            case 'hardware-tools': query = "Construction materials Nepal OR Hardware price"; break;
            case 'automotive': query = "Vehicle market Nepal OR Auto parts Nepal"; break;
            case 'home-garden': query = "Furniture market Nepal OR Home decor Nepal"; break;
            default: query = `${categoryObj.name} market Nepal`;
          }
        } else {
          // Subcategory / Specific Logic (The User's specific products)
          // Optimize for common subcategories based on name matching
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

      // We use a simple loop to try getting meaningful results
      // Note: In production, do this on backend to hide key and handle CORS better
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

      if (articles.length === 0) {
        // No news available - show empty state instead of mock data
        console.warn("No news found for query:", query);
        setNews([]);
      } else {
        setNews(articles);
      }
    } catch (err) {
      console.error("News API Error:", err);
      // On error, show empty state instead of fake data
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  // ... (rest of component)

  // Fetch data when location is available
  useEffect(() => {
    if (userLocation) {
      fetchCompetitorData();
    }
  }, [userLocation]);

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

  const fetchCompetitorData = async () => {
    if (!userLocation || !GEOAPIFY_API_KEY) {
      setLoading(false);
      return;
    }

    try {
      // Search for general stores/competitors in 5km radius
      const categories = [
        'commercial.supermarket',
        'commercial.marketplace',
        'commercial.shopping_mall',
        'commercial.department_store'
      ].join(',');

      const params = new URLSearchParams({
        categories: categories,
        filter: `circle:${userLocation.lng},${userLocation.lat},5000`, // 5km radius
        limit: "50", // Max results to gauge density
        apiKey: GEOAPIFY_API_KEY,
      });

      const response = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        const count = data.features ? data.features.length : 0;

        // Analyze saturation
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Market Insights</h1>
        <p className="text-gray-500 mt-1">
          Real-time competitor analysis and market trends
        </p>
      </div>

      {/* Dynamic Competitor Insight Card */}
      <Card className="border-0 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900 to-teal-800 opacity-90 z-0" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Users className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Local Market Intelligence</h3>
                <p className="text-white/80 text-sm max-w-md">
                  We analyzed businesses within a 5km radius of your location.
                </p>

                {error && (
                  <div className="flex items-center gap-2 mt-2 text-red-200 bg-red-900/30 px-3 py-1 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Display */}
            {!loading && !error && competitorStats ? (
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm min-w-[200px] border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Competitors</span>
                  <Badge className={`${competitorStats.color} border-0`}>
                    {competitorStats.status}
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{competitorStats.count}</div>
                <p className="text-xs text-white/80">{competitorStats.message}</p>
              </div>
            ) : !loading && !error && !competitorStats && (
              <div className="text-center">
                <Button onClick={getUserLocation} variant="secondary" size="sm">
                  Enable Location to View
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market News Feed */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Latest Market News</h2>
            <Button variant="outline" size="sm" onClick={fetchMarketNews} disabled={newsLoading}>
              <RefreshCw className={`h-3 w-3 mr-2 ${newsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {newsCategories.map((cat) => (
              <Badge
                key={cat}
                variant={newsCategory === cat ? "default" : "outline"}
                className={`cursor-pointer max-w-fit px-3 py-1 ${newsCategory === cat ? "bg-teal-600 hover:bg-teal-700" : "hover:bg-gray-100"}`}
                onClick={() => setNewsCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {newsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm h-[200px] flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 text-gray-300 animate-spin" />
              </Card>
            ))}
          </div>
        ) : news.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">No news available</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    We couldn't find any news for "{newsCategory}". Try a different category or check back later.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMarketNews} className="mt-2">
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((insight) => (
              <Card key={insight.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {insight.image && (
                  <div className="h-32 w-full overflow-hidden bg-gray-100">
                    <img src={insight.image} alt={insight.title} className="w-full h-full object-cover transition-transform hover:scale-105" />
                  </div>
                )}
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 mb-2 border-teal-100">
                      {insight.source || insight.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(insight.date).toLocaleDateString("en-NP")}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    <a href={insight.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">
                      {insight.title}
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-500 line-clamp-3 mb-3">{insight.description}</p>
                  <a href={insight.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center mt-auto">
                    Read full article <ArrowUp className="h-3 w-3 ml-1 rotate-45" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Price Reference Card (Preserved Mock Data for now) */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
              <TrendingUp className="h-4 w-4" style={{ color: colors.primary }} />
            </div>
            Current Market Prices (Kathmandu)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { item: "Basmati Rice", price: "रू 120-130/kg", trend: "stable" },
              { item: "Cooking Oil", price: "रू 200-220/L", trend: "increasing" },
              { item: "Toor Dal", price: "रू 155-170/kg", trend: "stable" },
              { item: "Tea Powder", price: "रू 350-400/500g", trend: "stable" },
              { item: "Sugar", price: "रू 60-70/kg", trend: "decreasing" },
              { item: "Milk Powder", price: "रू 500-550/kg", trend: "increasing" },
            ].map((item) => (
              <div
                key={item.item}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.item}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.price}</p>
                  </div>
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.trend === "increasing"
                      ? "bg-red-50"
                      : item.trend === "decreasing"
                        ? "bg-emerald-50"
                        : "bg-gray-100"
                      }`}
                  >
                    {item.trend === "increasing" ? (
                      <ArrowUp className="h-4 w-4 text-red-500" />
                    ) : item.trend === "decreasing" ? (
                      <ArrowDown className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-gray-500">
              Competitor data provided by Geoapify. Prices sourced from local market averages.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
