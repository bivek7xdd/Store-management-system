import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Calendar,
  Plus,
  ShoppingCart,
  FileText,
  ArrowRight,
  RefreshCw,
  Package,
  DollarSign,
  CheckCircle,
  Info,
  BarChart3,
  Receipt,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getReportStats, ReportStats } from "@/services/reportService";
import { inventoryService } from "@/services/inventory";
import { Product } from "@/types";
import { CountUp } from "@/components/CountUp";
import { PremiumEmptyState } from "@/components/PremiumEmptyState";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
  primaryLight: "#14b8a6",
};

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

function StatSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-NP");
  const [range, setRange] = useState("today");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [reportStats, allProducts] = await Promise.all([
          getReportStats(range),
          inventoryService.getProducts(200, 0),
        ]);
        setStats(reportStats);
        setProducts(allProducts);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived product alerts from real products
  const lowStockItems = products.filter((p) => {
    const threshold =
      typeof p.low_stock_threshold === "number"
        ? p.low_stock_threshold
        : ((p.low_stock_threshold as { Int32: number; Valid: boolean })
            ?.Int32 ?? 0);
    return p.stock_quantity <= threshold && threshold > 0;
  });

  const nearExpiryItems = products.filter((p) => {
    const expiresAt = p.expires_at;
    if (!expiresAt || !expiresAt.Valid) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiresAt.Time).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const rangeLabel =
    RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Today";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.4,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-20 lg:pb-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's your store overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  range === opt.value
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  range === opt.value ? { background: colors.primary } : {}
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              background: `${colors.primary}10`,
              color: colors.primaryDark,
            }}
          >
            <span className="font-medium">{today}</span>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-100"
            onClick={() => fetchData()}
          >
            Retry
          </Button>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-tour="dashboard-cards"
      >
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            {/* Sales Card */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {rangeLabel} Sales
                </CardTitle>
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: `${colors.primary}15` }}
                >
                  <TrendingUp
                    className="h-5 w-5"
                    style={{ color: colors.primary }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  रू <CountUp to={stats?.sales?.total ?? 0} />
                </div>
                {stats?.sales?.growth !== undefined ? (
                  <p
                    className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                      stats.sales.growth >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {stats.sales.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stats.sales.growth >= 0 ? "+" : ""}
                    {stats.sales.growth.toFixed(1)}% vs previous period
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    <CountUp to={stats?.sales?.count ?? 0} /> transactions
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total Debtors */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Outstanding Debts
                </CardTitle>
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: `${colors.primary}15` }}
                >
                  <Users
                    className="h-5 w-5"
                    style={{ color: colors.primary }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  रू <CountUp to={stats?.debts?.total_outstanding ?? 0} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <CountUp to={stats?.debts?.total_debtors ?? 0} /> customers
                </p>
              </CardContent>
            </Card>

            {/* Low Stock */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/[0.02] transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Low Stock Items
                </CardTitle>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-amber-50 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  <CountUp to={stats?.inventory?.low_stock ?? lowStockItems.length} />
                </div>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Require attention
                </p>
              </CardContent>
            </Card>

            {/* Near Expiry */}
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/[0.02] transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Near Expiry
                </CardTitle>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-red-50 group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  <CountUp to={nearExpiryItems.length} />
                </div>
                <p className="text-xs text-red-600 font-medium mt-1">
                  Within 30 days
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm" data-tour="quick-actions">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
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
              <Button
                asChild
                variant="outline"
                className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50"
              >
                <Link to="/inventory">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Product
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50"
              >
                <Link to="/debtors">
                  <Users className="mr-2 h-5 w-5" />
                  View Debtors
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-12 rounded-xl font-medium border-gray-200 hover:bg-gray-50"
              >
                <Link to="/reports">
                  <FileText className="mr-2 h-5 w-5" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Insights */}
      <AnimatePresence mode="wait">
        {loading || (stats?.insights && stats.insights.length > 0) ? (
          <motion.div
            key="insights"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats!.insights.map((insight, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                          insight.type === "success"
                            ? "border-emerald-100 bg-emerald-50 hover:bg-emerald-100/50"
                            : insight.type === "warning"
                              ? "border-amber-100 bg-amber-50 hover:bg-amber-100/50"
                              : "border-blue-100 bg-blue-50 hover:bg-blue-100/50"
                        }`}
                      >
                        <div className="mt-0.5">
                          {insight.type === "success" ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : insight.type === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Info className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              insight.type === "success"
                                ? "text-emerald-800"
                                : insight.type === "warning"
                                  ? "text-amber-800"
                                  : "text-blue-800"
                            }`}
                          >
                            {insight.message}
                          </p>
                          {insight.details && insight.details.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {insight.details.slice(0, 3).join(", ")}
                              {insight.details.length > 3
                                ? ` +${insight.details.length - 3} more`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          !loading &&
          stats?.sales?.total === 0 && (
            <motion.div
              key="empty"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-0 shadow-sm border-dashed border-2">
                <CardContent className="pt-6 text-center">
                  <PremiumEmptyState
                    icon={LayoutDashboard}
                    title="No insights yet"
                    description="When you start making sales and tracking inventory, smart insights will appear here to help you grow."
                    action={
                      <Button asChild style={{ background: colors.primaryDark }}>
                        <Link to="/sales">Create your first sale</Link>
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Payment Breakdown + Profit */}
      <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-50">
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    label: "Cash",
                    value: stats?.sales?.cash ?? 0,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Credit",
                    value: stats?.sales?.credit ?? 0,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Online",
                    value: stats?.sales?.online ?? 0,
                    color: "bg-blue-500",
                  },
                ].map(({ label, value, color }) => {
                  const total = stats?.sales?.total ?? 1;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {label}
                        </span>
                        <span className="text-sm text-gray-500">
                          रू{" "}
                          {value.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-50">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              Profit Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    label: "Total Revenue",
                    value: stats?.profit?.total_revenue ?? 0,
                    cls: "text-gray-900",
                  },
                  {
                    label: "Total Cost",
                    value: stats?.profit?.total_cost ?? 0,
                    cls: "text-red-500",
                  },
                  {
                    label: "Gross Profit",
                    value: stats?.profit?.gross_profit ?? 0,
                    cls: "text-emerald-600 font-bold",
                  },
                ].map(({ label, value, cls }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                  >
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm ${cls}`}>
                      रू{" "}
                      {value.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts Section */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 lg:grid-cols-2"
        data-tour="dashboard-alerts"
      >
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
            {loading ? (
              <ListSkeleton />
            ) : lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">
                All items are well stocked!
              </p>
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
                        Stock: {product.stock_quantity} units
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-600 border-amber-200"
                    >
                      Low
                    </Badge>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-sm"
                    style={{ color: colors.primary }}
                  >
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
            {loading ? (
              <ListSkeleton />
            ) : nearExpiryItems.length === 0 ? (
              <p className="text-sm text-gray-500">No products expiring soon</p>
            ) : (
              <div className="space-y-3">
                {nearExpiryItems.slice(0, 3).map((product) => {
                  const expiresAt = product.expires_at!;
                  const daysUntilExpiry = Math.floor(
                    (new Date(expiresAt.Time).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          Expires:{" "}
                          {new Date(expiresAt.Time).toLocaleDateString("en-NP")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-600 border-red-200"
                      >
                        {daysUntilExpiry}d
                      </Badge>
                    </div>
                  );
                })}
                {nearExpiryItems.length > 3 && (
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-sm"
                    style={{ color: colors.primary }}
                  >
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
      </motion.div>

      {/* Top Selling Products + Top Debtors */}
      <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `${colors.primary}15` }}
              >
                <Package className="h-4 w-4" style={{ color: colors.primary }} />
              </div>
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : !stats?.sales?.top_products?.length ? (
              <p className="text-sm text-gray-500">
                No sales data for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.sales.top_products.slice(0, 5).map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: colors.primary }}
                      >
                        {i + 1}
                      </span>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.product_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">
                      {product.total_quantity} sold
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-50">
                <Users className="h-4 w-4 text-red-500" />
              </div>
              Top Debtors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : !stats?.debts?.top_debtors?.length ? (
              <p className="text-sm text-gray-500">No outstanding debts.</p>
            ) : (
              <div className="space-y-3">
                {stats.debts.top_debtors.slice(0, 5).map((debtor, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {debtor.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {debtor.customer_phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">
                        रू {debtor.total_debt.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400">awaiting pay</p>
                    </div>
                  </div>
                ))}
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-sm"
                  style={{ color: colors.primary }}
                >
                  <Link to="/debtors" className="flex items-center gap-1">
                    View all debtors
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `${colors.primary}15` }}
              >
                <Receipt className="h-4 w-4" style={{ color: colors.primary }} />
              </div>
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton rows={5} />
            ) : !stats?.sales?.recent?.length ? (
              <p className="text-sm text-gray-500">No recent transactions.</p>
            ) : (
              <div className="space-y-3">
                {stats.sales.recent.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          sale.sales_type === "cash"
                            ? "bg-emerald-50"
                            : sale.sales_type === "credit"
                              ? "bg-amber-50"
                              : "bg-blue-50"
                        }`}
                      >
                        <ShoppingCart
                          className={`h-4 w-4 ${
                            sale.sales_type === "cash"
                              ? "text-emerald-600"
                              : sale.sales_type === "credit"
                                ? "text-amber-600"
                                : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {sale.customer_name || "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.sale_date).toLocaleString("en-NP", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        रू{" "}
                        {sale.total_amount.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          sale.sales_type === "cash"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : sale.sales_type === "credit"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        {sale.sales_type}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-sm"
                  style={{ color: colors.primary }}
                >
                  <Link to="/reports" className="flex items-center gap-1">
                    View all transactions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
