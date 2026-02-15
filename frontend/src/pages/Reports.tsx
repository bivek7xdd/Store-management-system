import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Calendar,
  Loader2,
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getReportStats } from "@/services/reportService";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from "recharts";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

const COLORS = ["#0d9488", "#059669", "#047857", "#115e59", "#134e4a"];

export default function Reports() {
  const [dateRange, setDateRange] = useState("today");

  const handleExportPDF = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportPDF(dateRange);
      toast.success("Downloading PDF report...");
    });
  };

  const handleExportCSV = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportCSV(dateRange);
      toast.success("Downloading CSV report...");
    });
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ["reportStats", dateRange],
    queryFn: () => getReportStats(dateRange),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null; // Should handle error state too

  const totalSales = stats.sales.total;
  const cashSales = stats.sales.cash;
  const creditSales = stats.sales.credit;
  const totalInventoryValue = stats.inventory.total_value;
  const totalOutstanding = stats.debts.total_outstanding;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">View business insights and export data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="rounded-lg border-gray-200">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-lg border-gray-200">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights Panel */}
      {stats.insights && stats.insights.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-600" />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                  {insight.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />}
                  {insight.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />}
                  {insight.type === "info" && <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-gray-700 text-sm font-medium">{insight.message}</p>
                    {insight.details && insight.details.length > 0 && (
                      <div className="mt-2 pl-1">
                        <p className="text-xs text-gray-500 mb-1">Products:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                          {insight.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="sales" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="debtors" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Debtors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <BarChart3 className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">रू {totalSales.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.sales.count} transactions</p>
                  </div>
                  {(stats.sales.growth !== undefined && stats.sales.growth !== 0) && (
                    <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${stats.sales.growth > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {stats.sales.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
                      {Math.abs(stats.sales.growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-purple-50">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                  Avg. Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">रू {stats.sales.aov ? Math.round(stats.sales.aov).toLocaleString() : 0}</p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-50">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  Cash Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">रू {cashSales.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((cashSales / totalSales) * 100)}% of total
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-50">
                    <Users className="h-4 w-4 text-amber-500" />
                  </div>
                  Credit Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">रू {creditSales.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((creditSales / totalSales) * 100)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-500 to-teal-700 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Estimated Gross Profit</p>
                    <p className="text-3xl font-bold mt-1">रू {stats.profit.gross_profit.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                        {Math.round((stats.profit.gross_profit / stats.profit.total_revenue) * 100)}% Margin
                      </div>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Revenue</p>
                      <p className="text-lg font-bold text-gray-900">रू {stats.profit.total_revenue.toLocaleString()}</p>
                    </div>
                    <div className="h-1 bg-teal-100 w-24 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Cost</p>
                      <p className="text-lg font-bold text-gray-900">रू {stats.profit.total_cost.toLocaleString()}</p>
                    </div>
                    <div className="h-1 bg-amber-100 w-24 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (stats.profit.total_cost / stats.profit.total_revenue) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.sales.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="sale_date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      tickFormatter={(value) => {
                        try {
                          if (!value) return "";
                          const date = new Date(value);
                          if (isNaN(date.getTime())) return value;
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        } catch (e) {
                          return value;
                        }
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      tickFormatter={(value) => `रू ${value}`} // Simplify large numbers if needed
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `रू ${value.toLocaleString()}`,
                        name === "predicted_sales" ? "Forecast" : "Sales"
                      ]}
                      labelFormatter={(label) => {
                        try {
                          if (!label) return "";
                          const date = new Date(label);
                          if (isNaN(date.getTime())) return label;
                          return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                        } catch (e) {
                          return label;
                        }
                      }}
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="daily_total" fill={`${colors.primary}40`} radius={[4, 4, 0, 0]} barSize={40} />
                    <Line type="monotone" dataKey="daily_total" stroke={colors.primary} strokeWidth={2} dot={{ r: 4, fill: colors.primary, strokeWidth: 0 }} />
                    <Line
                      type="monotone"
                      data={stats.sales.forecast}
                      dataKey="predicted_sales"
                      stroke={colors.primary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="predicted_sales"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.sales.recent.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {sale.customer_name || "Walk-in Customer"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.sale_date).toLocaleString("en-NP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">रू {sale.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{sale.sales_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {/* Inventory Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <Package className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{stats.inventory.total_products}</p>
                <p className="text-xs text-gray-500 mt-1">In inventory</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-50">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </div>
                  Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">रू {totalInventoryValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total cost price</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-50">
                    <Package className="h-4 w-4 text-amber-500" />
                  </div>
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.inventory.low_stock}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need restock</p>
              </CardContent>
            </Card>
          </div>

          {/* Product Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.inventory.stock_by_category}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="product_count"
                      >
                        {stats.inventory.stock_by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} Products`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                  {stats.inventory.stock_by_category.map((entry, index) => (
                    <div key={entry.category_name} className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.category_name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stats.sales.top_products}
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="product_name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="total_quantity" fill={colors.primary} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue By Category */}
          <div className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.inventory.revenue_by_category}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="category_name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} tickFormatter={(value) => `रू ${value}`} />
                      <Tooltip formatter={(value: number) => [`रू ${value.toLocaleString()}`, "Revenue"]} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="total_revenue" radius={[4, 4, 0, 0]} barSize={50}>
                        {stats.inventory.revenue_by_category?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="debtors" className="space-y-4">
          {/* Debtor Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-50">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  </div>
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">रू {totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">To be collected</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <Users className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  Total Debtors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{stats.debts.total_debtors}</p>
                <p className="text-xs text-gray-500 mt-1">Active customers</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-50">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </div>
                  Average Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">
                  रू {stats.debts.total_debtors > 0 ? Math.round(totalOutstanding / stats.debts.total_debtors).toLocaleString() : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Debtors */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Top Debtors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.debts.top_debtors.map((debtor) => (
                  <div
                    key={debtor.customer_phone}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: colors.primary }}
                      >
                        {debtor.customer_name ? debtor.customer_name.charAt(0) : "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{debtor.customer_name}</p>
                        <p className="text-sm text-gray-500">{debtor.customer_phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        रू {debtor.total_debt.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last: {new Date(debtor.last_transaction).toLocaleDateString("en-NP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
