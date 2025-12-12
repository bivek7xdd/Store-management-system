import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, ArrowUp, ArrowDown, Minus, Lightbulb } from "lucide-react";
import { mockMarketInsights } from "@/lib/mockData";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Market() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Market Insights</h1>
        <p className="text-gray-500 mt-1">
          Stay updated with local market trends and pricing information
        </p>
      </div>

      {/* Featured Insight */}
      <Card className="border-0 shadow-sm" style={{ background: colors.primaryDark }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 text-white">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Market Update</h3>
              <p className="text-sm text-white/80">
                Stay informed about price changes in Kathmandu markets to optimize your inventory and pricing strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Feed */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockMarketInsights.map((insight) => (
          <Card key={insight.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 mb-2">
                  {insight.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(insight.date).toLocaleDateString("en-NP")}
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Reference Card */}
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
              Market data is updated regularly from local wholesale markets in Kathmandu valley.
              Prices may vary based on quality and supplier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
