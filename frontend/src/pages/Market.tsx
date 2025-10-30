import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar } from "lucide-react";
import { mockMarketInsights } from "@/lib/mockData";

export default function Market() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Market Insights</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with local market trends and pricing information
        </p>
      </div>

      {/* Featured Insight */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-8 w-8 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">Market Update</h3>
              <p className="text-sm opacity-90">
                Stay informed about price changes in Kathmandu markets to optimize your inventory and pricing strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Feed */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockMarketInsights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="mb-2">
                  {insight.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(insight.date).toLocaleDateString("en-NP")}
                </div>
              </div>
              <CardTitle className="text-lg">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Market Prices (Kathmandu)</CardTitle>
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
                className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.item}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.price}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.trend === "increasing"
                        ? "bg-destructive/10 text-destructive border-destructive"
                        : item.trend === "decreasing"
                        ? "bg-success/10 text-success border-success"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {item.trend === "increasing" ? "↑" : item.trend === "decreasing" ? "↓" : "→"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Market data is updated regularly from local wholesale markets in Kathmandu valley.
            Prices may vary based on quality and supplier.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
