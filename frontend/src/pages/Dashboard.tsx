import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
  Plus,
  ShoppingCart,
  Package,
  FileText,
} from "lucide-react";
import { mockProducts, mockDebtors, mockMarketInsights } from "@/lib/mockData";

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-NP");
  
  // Calculate metrics
  const lowStockItems = mockProducts.filter(p => p.stock < p.lowStockThreshold);
  const nearExpiryItems = mockProducts.filter(p => {
    if (!p.expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });
  const totalOutstanding = mockDebtors.reduce((sum, d) => sum + d.outstandingAmount, 0);
  const todaysSales = 4250; // Mock value

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your store overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">रू {todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Debtors
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">रू {totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{mockDebtors.length} customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Near Expiry
            </CardTitle>
            <Calendar className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{nearExpiryItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="w-full">
              <Link to="/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New Sale
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/inventory">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/debtors">
                <Users className="mr-2 h-4 w-4" />
                View Debtors
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/reports">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.stock} units
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                      Low
                    </Badge>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <Button asChild variant="link" className="w-full">
                    <Link to="/inventory">View all {lowStockItems.length} items</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Near Expiry Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-destructive" />
              Near Expiry Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearExpiryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products expiring soon</p>
            ) : (
              <div className="space-y-3">
                {nearExpiryItems.slice(0, 3).map((product) => {
                  const daysUntilExpiry = Math.floor(
                    (new Date(product.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(product.expiryDate!).toLocaleDateString("en-NP")}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                        {daysUntilExpiry}d
                      </Badge>
                    </div>
                  );
                })}
                {nearExpiryItems.length > 3 && (
                  <Button asChild variant="link" className="w-full">
                    <Link to="/inventory">View all {nearExpiryItems.length} items</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMarketInsights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(insight.date).toLocaleDateString("en-NP")}
                </p>
              </div>
            ))}
            <Button asChild variant="link" className="w-full">
              <Link to="/market">View all market insights →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
