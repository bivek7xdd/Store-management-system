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
import { Download, FileText, TrendingUp, Package, Users, BarChart3, Calendar } from "lucide-react";
import { mockProducts, mockDebtors, mockSales } from "@/lib/mockData";
import { toast } from "sonner";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("today");

  const handleExportPDF = () => {
    toast.success("Exporting report as PDF...");
  };

  const handleExportCSV = () => {
    toast.success("Exporting report as CSV...");
  };

  const totalSales = mockSales.reduce((sum, s) => sum + s.total, 0);
  const cashSales = mockSales.filter((s) => s.paymentType === "cash").reduce((sum, s) => sum + s.total, 0);
  const creditSales = mockSales.filter((s) => s.paymentType === "credit").reduce((sum, s) => sum + s.total, 0);
  const totalInventoryValue = mockProducts.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalOutstanding = mockDebtors.reduce((sum, d) => sum + d.outstandingAmount, 0);

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
                <p className="text-2xl font-bold text-gray-900">रू {totalSales.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{mockSales.length} transactions</p>
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

          {/* Sales Chart Placeholder */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-1">Sales trend visualization</p>
                  <p className="text-sm text-gray-400">
                    Chart will display daily/weekly sales data
                  </p>
                </div>
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
                {mockSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {sale.items.map((i) => i.productName).join(", ")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.date).toLocaleString("en-NP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">रू {sale.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{sale.paymentType}</p>
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
                <p className="text-2xl font-bold text-gray-900">{mockProducts.length}</p>
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
                  {mockProducts.filter((p) => p.stock < p.lowStockThreshold).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need restock</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Product Stock Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{product.stock} units</p>
                      <p className="text-xs text-gray-500">रू {product.costPrice * product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <p className="text-2xl font-bold text-gray-900">{mockDebtors.length}</p>
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
                  रू {Math.round(totalOutstanding / mockDebtors.length).toLocaleString()}
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
                {mockDebtors
                  .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
                  .map((debtor) => (
                    <div
                      key={debtor.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ background: colors.primary }}
                        >
                          {debtor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{debtor.name}</p>
                          <p className="text-sm text-gray-500">{debtor.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          रू {debtor.outstandingAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last: {new Date(debtor.lastTransaction).toLocaleDateString("en-NP")}
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
