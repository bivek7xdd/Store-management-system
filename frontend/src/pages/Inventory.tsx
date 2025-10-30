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
import { Search, Plus, AlertTriangle, Calendar, Download, Upload } from "lucide-react";
import { mockProducts } from "@/lib/mockData";
import { toast } from "sonner";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
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
                  <Label htmlFor="name">Product Name*</Label>
                  <Input id="name" placeholder="e.g., Basmati Rice" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select required>
                    <SelectTrigger>
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
                  <Label htmlFor="barcode">Barcode (optional)</Label>
                  <Input id="barcode" placeholder="8901234567890" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (रू)*</Label>
                    <Input id="costPrice" type="number" placeholder="100" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price (रू)*</Label>
                    <Input id="sellingPrice" type="number" placeholder="120" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity*</Label>
                    <Input id="stock" type="number" placeholder="50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Stock Alert</Label>
                    <Input id="threshold" type="number" placeholder="10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                  <Input id="expiryDate" type="date" />
                </div>
                <Button type="submit" className="w-full">
                  Add Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
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
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {isLowStock && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low
                      </Badge>
                    )}
                    {isExpiringSoon && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysUntilExpiry}d
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{product.stock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Price:</span>
                    <span className="font-medium">रू {product.costPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selling Price:</span>
                    <span className="font-medium text-success">रू {product.sellingPrice}</span>
                  </div>
                  {product.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expiry:</span>
                      <span className="font-medium">
                        {new Date(product.expiryDate).toLocaleDateString("en-NP")}
                      </span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Barcode:</span>
                      <span className="font-mono text-xs">{product.barcode}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Edit Product
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No products found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
