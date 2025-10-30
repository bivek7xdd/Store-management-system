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
import { Download, FileText } from "lucide-react";
import { mockProducts, mockDebtors, mockSales } from "@/lib/mockData";
import { toast } from "sonner";

export default function Reports() {
  const [dateRange, setDateRange] = useState("today");

  const handleExportPDF = () => {
    toast.success("Exporting report as PDF...");
  };

  const handleExportCSV = () => {
    toast.success("Exporting report as CSV...");
  };

  // Calculate metrics
  const totalSales = mockSales.reduce((sum, s) => sum + s.total, 0);
  const cashSales = mockSales.filter((s) => s.paymentType === "cash").reduce((sum, s) => sum + s.total, 0);
  const creditSales = mockSales.filter((s) => s.paymentType === "credit").reduce((sum, s) => sum + s.total, 0);
  const totalInventoryValue = mockProducts.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalOutstanding = mockDebtors.reduce((sum, d) => sum + d.outstandingAmount, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">View business insights and export data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Date Range:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="debtors">Debtors</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">रू {totalSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{mockSales.length} transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cash Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">रू {cashSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((cashSales / totalSales) * 100)}% of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Credit Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">रू {creditSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((creditSales / totalSales) * 100)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Sales trend visualization</p>
                  <p className="text-sm text-muted-foreground">
                    Chart will display daily/weekly sales data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {sale.items.map((i) => i.productName).join(", ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.date).toLocaleString("en-NP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">रू {sale.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{sale.paymentType}</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{mockProducts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">In inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">रू {totalInventoryValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total cost price</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">
                  {mockProducts.filter((p) => p.stock < p.lowStockThreshold).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Need restock</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Product Stock Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{product.stock} units</p>
                      <p className="text-xs text-muted-foreground">रू {product.costPrice * product.stock}</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">रू {totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">To be collected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Debtors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{mockDebtors.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  रू {Math.round(totalOutstanding / mockDebtors.length).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Debtors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Debtors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDebtors
                  .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
                  .map((debtor) => (
                    <div
                      key={debtor.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{debtor.name}</p>
                        <p className="text-sm text-muted-foreground">{debtor.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          रू {debtor.outstandingAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
