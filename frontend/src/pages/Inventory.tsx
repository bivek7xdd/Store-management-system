import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, AlertTriangle, Calendar, Download, Upload, Package } from "lucide-react";
import { mockProducts } from "@/lib/mockData";
import { toast } from "sonner";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const categories = Array.from(new Set(mockProducts.map((p) => p.category)));

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm);
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock < product.lowStockThreshold) ||
      (stockFilter === "expiring" &&
        product.expiryDate &&
        Math.floor((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleImport = () => {
    toast.success("CSV import feature ready (connect to backend to enable)");
  };

  const handleExport = () => {
    toast.success("Exporting inventory data...");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport} className="rounded-lg border-gray-200">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-lg border-gray-200">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg" style={{ background: colors.primaryDark }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Add New Product</DialogTitle>
                <DialogDescription>
                  Enter product details to add to your inventory
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Product added successfully!");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Product Name*</Label>
                  <Input id="name" placeholder="e.g., Basmati Rice" required className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category*</Label>
                  <Select required>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-medium">Barcode (optional)</Label>
                  <Input id="barcode" placeholder="8901234567890" className="rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-sm font-medium">Cost Price (रू)*</Label>
                    <Input id="costPrice" type="number" placeholder="100" required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (रू)*</Label>
                    <Input id="sellingPrice" type="number" placeholder="120" required className="rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-medium">Stock Quantity*</Label>
                    <Input id="stock" type="number" placeholder="50" required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold" className="text-sm font-medium">Low Stock Alert</Label>
                    <Input id="threshold" type="number" placeholder="10" className="rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date (optional)</Label>
                  <Input id="expiryDate" type="date" className="rounded-lg" />
                </div>
                <Button type="submit" className="w-full rounded-xl h-11 font-semibold" style={{ background: colors.primaryDark }}>
                  Add Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg border-gray-200"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-lg border-gray-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="rounded-lg border-gray-200">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock < product.lowStockThreshold;
          const daysUntilExpiry = product.expiryDate
            ? Math.floor((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

          return (
            <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${colors.primary}10` }}
                    >
                      <Package className="h-5 w-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">{product.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {isLowStock && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low
                      </Badge>
                    )}
                    {isExpiringSoon && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysUntilExpiry}d
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Stock</span>
                    <span className="font-semibold text-gray-900">{product.stock} units</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cost Price</span>
                    <span className="font-medium text-gray-700">रू {product.costPrice}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Selling Price</span>
                    <span className="font-semibold" style={{ color: colors.primary }}>रू {product.sellingPrice}</span>
                  </div>
                  {product.expiryDate && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Expiry</span>
                      <span className="font-medium text-gray-700">
                        {new Date(product.expiryDate).toLocaleDateString("en-NP")}
                      </span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Barcode</span>
                      <span className="font-mono text-xs text-gray-600">{product.barcode}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4 rounded-lg border-gray-200 hover:bg-gray-50">
                  Edit Product
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
