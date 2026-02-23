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
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { mockProducts, mockDebtors, mockMarketInsights } from "@/lib/mockData";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
  primaryLight: "#14b8a6",
};

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-NP");

  const lowStockItems = mockProducts.filter(p => p.stock < p.lowStockThreshold);
  const nearExpiryItems = mockProducts.filter(p => {
    if (!p.expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });
  const totalOutstanding = mockDebtors.reduce((sum, d) => sum + d.outstandingAmount, 0);
  const todaysSales = 4250;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your store overview</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: `${colors.primary}10`, color: colors.primaryDark }}
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{today}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-cards">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Today's Sales
            </CardTitle>
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: `${colors.primary}15` }}
            >
              <TrendingUp className="h-5 w-5" style={{ color: colors.primary }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">रू {todaysSales.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Debtors
            </CardTitle>
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: `${colors.primary}15` }}
            >
              <Users className="h-5 w-5" style={{ color: colors.primary }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">रू {totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{mockDebtors.length} customers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Low Stock Items
            </CardTitle>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{lowStockItems.length}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Near Expiry
            </CardTitle>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-red-50">
              <Calendar className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{nearExpiryItems.length}</div>
            <p className="text-xs text-red-600 font-medium mt-1">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm" data-tour="quick-actions">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              asChild
              className="w-full h-12 rounded-xl font-semibold shadow-sm"
              style={{ background: colors.primaryDark }}
            >
              <Link to="/sales">
                <ShoppingCart className="mr-2 h-5 w-5" />
                New Sale
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50">
              <Link to="/inventory">
                <Plus className="mr-2 h-5 w-5" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50">
              <Link to="/debtors">
                <Users className="mr-2 h-5 w-5" />
                View Debtors
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50">
              <Link to="/reports">
                <FileText className="mr-2 h-5 w-5" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="grid gap-4 lg:grid-cols-2" data-tour="dashboard-alerts">
        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">All items are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.stock} units
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                      Low
                    </Badge>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <Button asChild variant="ghost" className="w-full text-sm" style={{ color: colors.primary }}>
                    <Link to="/inventory" className="flex items-center gap-1">
                      View all {lowStockItems.length} items
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Near Expiry Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-50">
                <Calendar className="h-4 w-4 text-red-500" />
              </div>
              Near Expiry Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearExpiryItems.length === 0 ? (
              <p className="text-sm text-gray-500">No products expiring soon</p>
            ) : (
              <div className="space-y-3">
                {nearExpiryItems.slice(0, 3).map((product) => {
                  const daysUntilExpiry = Math.floor(
                    (new Date(product.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          Expires: {new Date(product.expiryDate!).toLocaleDateString("en-NP")}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        {daysUntilExpiry}d
                      </Badge>
                    </div>
                  );
                })}
                {nearExpiryItems.length > 3 && (
                  <Button asChild variant="ghost" className="w-full text-sm" style={{ color: colors.primary }}>
                    <Link to="/inventory" className="flex items-center gap-1">
                      View all {nearExpiryItems.length} items
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card className="border-0 shadow-sm" data-tour="market-insights">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: `${colors.primary}15` }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: colors.primary }} />
            </div>
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMarketInsights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{insight.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(insight.date).toLocaleDateString("en-NP")}
                </p>
              </div>
            ))}
            <Button asChild variant="ghost" className="w-full text-sm" style={{ color: colors.primary }}>
              <Link to="/market" className="flex items-center gap-1">
                View all market insights
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
