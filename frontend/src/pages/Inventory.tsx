import { useState, useRef } from "react";
import * as XLSX from "xlsx";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, AlertTriangle, Calendar, Download, Upload, Package, Loader2, Pencil, Trash2, Scan } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, CreateProductData, UpdateProductData } from "@/services/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Product, Category } from "@/types";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { PremiumEmptyState } from "@/components/PremiumEmptyState";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

// Helper function to extract numeric value from pgtype.Numeric
const getNumericValue = (value: { Int64?: number; Valid?: boolean } | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'Int64' in value) return value.Int64 || 0;
  return 0;
};

// Helper function to extract int32 value
const getInt32Value = (value: { Int32?: number; Valid?: boolean } | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'Int32' in value) return value.Int32 || 0;
  return 0;
};

// Helper function to extract string from pgtype.Text
const getTextValue = (value: { String?: string; Valid?: boolean } | string | undefined): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'Valid' in value && value.Valid) return value.String || '';
  return '';
};

// Helper function to extract date from pgtype.Timestamptz
const getDateValue = (value: { Time?: string; Valid?: boolean } | string | undefined): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && value.Valid && value.Time) {
    return value.Time;
  }
  return null;
};

// Helper to format date for input value (YYYY-MM-DD)
const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchScannerOpen, setSearchScannerOpen] = useState(false);
  const [formScannerOpen, setFormScannerOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => inventoryService.getProducts(),
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: inventoryService.getCategories,
    enabled: isAuthenticated && !authLoading,
  });

  // Create product mutation with optimistic updates
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductData) => {
      console.log('[Component] createProductMutation starting...');
      return inventoryService.createProduct(data);
    },
    onMutate: async (newProduct) => {
      console.log('[Component] createProduct onMutate - doing optimistic update');

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically update to the new value
      const optimisticProduct = {
        id: `temp-${Date.now()}`,
        ...newProduct,
        store_id: 'temp',
        stock_quantity: newProduct.stock_quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Product;

      queryClient.setQueryData(["products"], (old: Product[] = []) => {
        return [...old, optimisticProduct];
      });

      return { previousProducts };
    },
    onError: (error, newProduct, context) => {
      console.error('[Component] createProduct onError:', error);

      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }

      // Reset UI state
      setAddDialogOpen(false);

      toast.error("Failed to add product");
    },
    onSuccess: (data) => {
      console.log('[Component] createProduct onSuccess');
      toast.success("Product added successfully!");
      setAddDialogOpen(false);
    },
    onSettled: () => {
      console.log('[Component] createProduct onSettled - refetching');
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const trackProductMutation = useMutation({
    mutationFn: ({ id, is_tracked }: { id: string; is_tracked: boolean }) =>
      inventoryService.updateProduct(id, { is_tracked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Tracking status updated");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to update tracking status";
      toast.error(message);
    },
  });

  const handleTrackToggle = (id: string, is_tracked: boolean) => {
    trackProductMutation.mutate({ id, is_tracked });
  };

  // Update product mutation with optimistic updates
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => {
      console.log('[Component] updateProductMutation starting...');
      return inventoryService.updateProduct(id, data);
    },
    onMutate: async ({ id, data }) => {
      console.log('[Mutation] updateProduct onMutate - doing optimistic update');

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically update
      queryClient.setQueryData(["products"], (old: Product[] = []) => {
        return old.map(product =>
          product.id === id
            ? ({ ...product, ...data, updated_at: new Date().toISOString() } as unknown as Product)
            : product
        );
      });

      return { previousProducts };
    },
    onError: (error, variables, context) => {
      console.error('[Mutation] updateProduct onError:', error);

      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }

      // Reset UI state
      setAddDialogOpen(false);
      setEditingProduct(null);

      toast.error("Failed to update product");
    },
    onSuccess: () => {
      console.log('[Mutation] updateProduct onSuccess');
      toast.success("Product updated successfully!");
      setAddDialogOpen(false);
      setEditingProduct(null);
    },
    onSettled: () => {
      console.log('[Mutation] updateProduct onSettled');
      // Refetch to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Delete product mutation with optimistic updates
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('[Component] deleteProductMutation starting...');
      return inventoryService.deleteProduct(id);
    },
    onMutate: async (id) => {
      console.log('[Mutation] deleteProduct onMutate - doing optimistic update');

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically remove from list
      queryClient.setQueryData(["products"], (old: Product[] = []) => {
        return old.filter(product => product.id !== id);
      });

      return { previousProducts };
    },
    onError: (error, id, context) => {
      console.error('[Mutation] deleteProduct onError:', error);

      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }

      toast.error("Failed to delete product");
    },
    onSuccess: () => {
      console.log('[Mutation] deleteProduct onSuccess');
      toast.success("Product deleted successfully!");
    },
    onSettled: () => {
      console.log('[Mutation] deleteProduct onSettled');
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Get unique categories from products for filter (fallback to categories list)
  const categoryNames = (categories || []).map((c: Category) => c.name);

  // Filter products (ensure products is always an array)
  const productsList = products || [];
  const filteredProducts = productsList.filter((product: Product) => {
    const status = product.status?.product_status || 'active';
    if (status === 'discontinued') return false;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTextValue(product.barcode).includes(searchTerm);

    // For category filter, we'd need to match category_id with category name
    // For now, just skip category filter if categories not loaded
    const matchesCategory = categoryFilter === "all";

    const stockQuantity = product.stock_quantity;
    const lowThreshold = getInt32Value(product.low_stock_threshold);
    const expiryDate = getDateValue(product.expires_at);

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && stockQuantity < lowThreshold) ||
      (stockFilter === "expiring" &&
        expiryDate &&
        Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setBarcodeValue(getTextValue(product.barcode));
    setAddDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleSearchScanSuccess = (barcode: string) => {
    setSearchTerm(barcode);
    toast.success(`Searching for barcode: ${barcode}`);
  };

  const handleFormScanSuccess = (barcode: string) => {
    setBarcodeValue(barcode);
    toast.success(`Barcode scanned: ${barcode}`);
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
      setBarcodeValue("");
      setFormErrors({});
    } else if (editingProduct) {
      setBarcodeValue(getTextValue(editingProduct.barcode));
    }
  };

  const INT32_MAX = 2_147_483_647;

  const validateProductForm = (data: CreateProductData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (data.price < 0) errors.price = "Price cannot be negative";
    if (data.cost_price < 0) errors.cost_price = "Cost price cannot be negative";
    if (data.market_price !== undefined && data.market_price < 0) errors.market_price = "Market price cannot be negative";
    if (data.stock_quantity < 0) errors.stock_quantity = "Stock quantity cannot be negative";
    if (data.stock_quantity > INT32_MAX) errors.stock_quantity = `Stock quantity cannot exceed ${INT32_MAX.toLocaleString()}`;
    if (data.low_stock_threshold !== undefined && data.low_stock_threshold < 0) errors.low_stock_threshold = "Low stock alert cannot be negative";
    if (data.low_stock_threshold !== undefined && data.low_stock_threshold > INT32_MAX) errors.low_stock_threshold = `Low stock alert cannot exceed ${INT32_MAX.toLocaleString()}`;
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateProductData = {
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string || undefined,
      price: parseFloat(formData.get("price") as string),
      cost_price: formData.get("cost_price") ? parseFloat(formData.get("cost_price") as string) : 0,
      stock_quantity: parseInt(formData.get("stock_quantity") as string),
      low_stock_threshold: formData.get("low_stock_threshold") ? parseInt(formData.get("low_stock_threshold") as string) : 10,
      expires_at: formData.get("expires_at") ? new Date(formData.get("expires_at") as string).toISOString() : undefined,
      category_id: formData.get("category_id") as string,
    };

    const errors = validateProductForm(data);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data });
      } else {
        await createProductMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is already handled in onError
      console.log('[Component] Mutation error caught:', error);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as string;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers mapped properly
        const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (rawData.length === 0) {
          toast.error("No valid products found in file");
          return;
        }

        const newProducts: CreateProductData[] = [];
        const categoryLookup = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

        for (const row of rawData) {
          const product: any = {};
          
          // Case-insensitive mapping for columns
          Object.entries(row).forEach(([key, val]) => {
            const normalizedKey = key.trim().toLowerCase();
            const value = val as any;
            
            if (value === undefined || value === null) return;

            switch (normalizedKey) {
              case 'name': product.name = String(value); break;
              case 'barcode': product.barcode = String(value); break;
              case 'price': product.price = parseFloat(String(value)); break;
              case 'cost_price': product.cost_price = parseFloat(String(value)); break;
              case 'stock_quantity': product.stock_quantity = parseInt(String(value)); break;
              case 'category_name': 
                product.category_id = categoryLookup.get(String(value).toLowerCase());
                break;
              case 'low_stock_threshold': product.low_stock_threshold = parseInt(String(value)); break;
              case 'expires_at': 
                try {
                  // Handle potential date serial numbers from Excel
                  if (typeof value === 'number') {
                    product.expires_at = new Date((value - (25567 + 2)) * 86400 * 1000).toISOString();
                  } else {
                    product.expires_at = new Date(String(value)).toISOString();
                  }
                } catch (e) {
                  console.error("Invalid date value:", value);
                }
                break;
            }
          });

          if (product.name && product.price !== undefined && product.category_id) {
            newProducts.push(product);
          }
        }

        if (newProducts.length === 0) {
          toast.error("No valid products found check columns headers: name, price, category_name");
          return;
        }

        toast.info(`Importing ${newProducts.length} products...`);
        let successCount = 0;
        for (const pData of newProducts) {
          try {
            await createProductMutation.mutateAsync(pData);
            successCount++;
          } catch (err) {
            console.error(`Failed to import ${pData.name}:`, err);
          }
        }

        toast.success(`Successfully imported ${successCount} products!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportDialogOpen(false);
      } catch (err) {
        console.error("File parsing error:", err);
        toast.error("Failed to parse file. Please use a valid CSV or Excel file.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = ["name", "barcode", "price", "cost_price", "stock_quantity", "category_name", "low_stock_threshold", "expires_at"];
    const csvRows = [headers.join(",")];

    products.forEach((p: Product) => {
      const category = categories.find(c => c.id === p.category_id)?.name || "";
      const row = [
        `"${p.name}"`,
        `"${getTextValue(p.barcode)}"`,
        getNumericValue(p.price),
        getNumericValue(p.cost_price as any),
        p.stock_quantity,
        `"${category}"`,
        getInt32Value(p.low_stock_threshold),
        `"${getDateValue(p.expires_at) || ""}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory exported successfully!");
  };

  const downloadTemplate = () => {
    const headers = "name,barcode,price,cost_price,stock_quantity,category_name,low_stock_threshold,expires_at";
    const dummyRow = "Sample Product,8901234567890,150.00,120.00,50,Beverages,10,2026-12-31";
    const blob = new Blob([headers + "\n" + dummyRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (productsLoading || authLoading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        {/* Header Mockup */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
          </div>
          <div className="flex gap-2">
            {/* No need to mock buttons exactly, just keeping layout consistent */}
          </div>
        </div>

        {/* Filters Mockup */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load products</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="inventory-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv, .xlsx, .xls"
            onChange={handleImport}
          />
          <Button variant="outline" size="sm" onClick={handleImportClick} className="rounded-lg border-gray-200">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-lg border-gray-200">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg" style={{ background: colors.primaryDark }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update product details" : "Enter product details to add to your inventory"}
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Product Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingProduct?.name}
                    placeholder="e.g., Basmati Rice"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-sm font-medium">Category*</Label>
                  <Select name="category_id" required defaultValue={editingProduct?.category_id}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-medium">Barcode (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      name="barcode"
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      placeholder="8901234567890"
                      className="rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-lg"
                      onClick={() => setFormScannerOpen(true)}
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price (रू)*</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct ? getNumericValue(editingProduct.price) : undefined}
                      placeholder="100"
                      required
                      className={`rounded-lg ${formErrors.price ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      onChange={() => setFormErrors(prev => ({ ...prev, price: "" }))}
                    />
                    {formErrors.price && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <span>⚠</span> {formErrors.price}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost_price" className="text-sm font-medium">Cost Price (रू)</Label>
                    <Input
                      id="cost_price"
                      name="cost_price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct ? getNumericValue(editingProduct.cost_price as any) : undefined}
                      placeholder="80"
                      className={`rounded-lg ${formErrors.cost_price ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      onChange={() => setFormErrors(prev => ({ ...prev, cost_price: "" }))}
                    />
                    {formErrors.cost_price && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <span>⚠</span> {formErrors.cost_price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity*</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      min={0}
                      max={2147483647}
                      defaultValue={editingProduct?.stock_quantity}
                      placeholder="50"
                      required
                      className={`rounded-lg ${formErrors.stock_quantity ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      onChange={() => setFormErrors(prev => ({ ...prev, stock_quantity: "" }))}
                    />
                    {formErrors.stock_quantity && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <span>⚠</span> {formErrors.stock_quantity}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold" className="text-sm font-medium">Low Stock Alert</Label>
                    <Input
                      id="low_stock_threshold"
                      name="low_stock_threshold"
                      type="number"
                      min={0}
                      max={2147483647}
                      defaultValue={editingProduct ? getInt32Value(editingProduct.low_stock_threshold) : 10}
                      placeholder="10"
                      className={`rounded-lg ${formErrors.low_stock_threshold ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                      onChange={() => setFormErrors(prev => ({ ...prev, low_stock_threshold: "" }))}
                    />
                    {formErrors.low_stock_threshold && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <span>⚠</span> {formErrors.low_stock_threshold}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="text-sm font-medium">Expiry Date (optional)</Label>
                  <Input
                    id="expires_at"
                    name="expires_at"
                    type="date"
                    defaultValue={formatDateForInput(getDateValue(editingProduct?.expires_at))}
                    className="rounded-lg"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl h-11 font-semibold"
                  style={{ background: colors.primaryDark }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (editingProduct ? "Updating..." : "Adding...") : (editingProduct ? "Update Product" : "Add Product")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Import CSV Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Import Products from Spreadsheet
                </DialogTitle>
                <DialogDescription>
                  Supported formats: CSV, Excel (.xlsx, .xls) and Google Sheets.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 text-xs text-blue-700 flex gap-2">
                <span className="shrink-0 font-bold bg-blue-100 h-5 w-5 rounded-full flex items-center justify-center">i</span>
                <p>For <strong>Google Sheets</strong>: Go to File &gt; Download &gt; Microsoft Excel (.xlsx) and then upload that file here.</p>
              </div>

              <div className="border rounded-xl overflow-hidden my-4">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[150px] font-semibold text-xs">Spreadsheet Column</TableHead>
                      <TableHead className="font-semibold text-xs text-center border-l">Required</TableHead>
                      <TableHead className="font-semibold text-xs border-l">Sample Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { col: "name", req: "Yes", sample: "Basmati Rice" },
                      { col: "price", req: "Yes", sample: "150.00" },
                      { col: "category_name", req: "Yes", sample: "Grains" },
                      { col: "barcode", req: "No", sample: "8901234567890" },
                      { col: "cost_price", req: "No", sample: "120.00" },
                      { col: "stock_quantity", req: "No (defaults to 0)", sample: "50" },
                      { col: "low_stock_threshold", req: "No (defaults to 10)", sample: "10" },
                      { col: "expires_at", req: "No", sample: "2026-12-31" },
                    ].map((row, idx) => (
                      <TableRow key={idx} className="text-sm">
                        <TableCell className="font-medium bg-gray-50/50">{row.col}</TableCell>
                        <TableCell className="text-center border-l">
                          <Badge variant={row.req.startsWith("Yes") ? "default" : "secondary"} className="text-[10px] py-0">
                            {row.req}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground border-l font-mono text-xs italic">{row.sample}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50/50 hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">Choose your Excel or CSV file</p>
                    <p className="text-sm text-gray-500 mt-1">Make sure the first row contains the column headers</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs text-muted-foreground hover:text-primary gap-2">
                    <Download className="h-3 w-3" />
                    Download XLSX Template
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-lg" onClick={() => setImportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm" data-tour="inventory-filters">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 rounded-lg border-gray-200"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchScannerOpen(true)}
              >
                <Scan className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-lg border-gray-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryNames.map((cat: string) => (
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
      </Card >

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="inventory-grid">
        {
          filteredProducts.map((product: Product) => {
            const stockQuantity = product.stock_quantity;
            const lowThreshold = getInt32Value(product.low_stock_threshold);
            const isLowStock = stockQuantity < lowThreshold;

            const expiryDate = getDateValue(product.expires_at);
            const daysUntilExpiry = expiryDate
              ? Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

            const price = getNumericValue(product.price);
            const marketPrice = getNumericValue(product.market_price);
            const barcode = getTextValue(product.barcode);

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
                        <p className="text-sm text-gray-500 mt-0.5">
                          {product.status?.product_status || 'active'}
                        </p>
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
                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`track-${product.id}`}
                        checked={product.is_tracked || false}
                        onCheckedChange={(checked) => handleTrackToggle(product.id, checked)}
                        className="data-[state=checked]:bg-teal-600"
                      />
                      <Label htmlFor={`track-${product.id}`} className="text-xs text-gray-500 cursor-pointer">
                        Track Online Price
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Stock</span>
                      <span className="font-semibold text-gray-900">{stockQuantity} units</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Price</span>
                      <span className="font-semibold" style={{ color: colors.primary }}>रू {price}</span>
                    </div>
                    {marketPrice > 0 && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Market Price</span>
                        <span className="font-medium text-gray-700">रू {marketPrice}</span>
                      </div>
                    )}
                    {expiryDate && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Expiry</span>
                        <span className="font-medium text-gray-700">
                          {new Date(expiryDate).toLocaleDateString("en-NP")}
                        </span>
                      </div>
                    )}
                    {barcode && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Barcode</span>
                        <span className="font-mono text-xs text-gray-600">{barcode}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="group rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => handleEditClick(product)}
                    >
                      <Pencil className="h-4 w-4 mr-2 text-gray-500 group-hover:text-gray-900" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-lg border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        }
      </div >

      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-sm border-dashed border-2">
          <CardContent className="py-12">
            <PremiumEmptyState
              icon={Package}
              title={productsList.length === 0 ? "No products yet" : "No results found"}
              description={
                productsList.length === 0
                  ? "Start building your inventory by adding your first product or importing from a CSV."
                  : "We couldn't find any products matching your current filters. Try adjusting your search or filters."
              }
              action={
                productsList.length === 0 ? (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    style={{ background: colors.primaryDark }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Product
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setStockFilter("all");
                    }}
                  >
                    Clear All Filters
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Barcode Scanner for Form */}
      <BarcodeScanner
        open={formScannerOpen}
        onOpenChange={setFormScannerOpen}
        onScanSuccess={handleFormScanSuccess}
      />

      {/* Barcode Scanner for Search */}
      <BarcodeScanner
        open={searchScannerOpen}
        onOpenChange={setSearchScannerOpen}
        onScanSuccess={handleSearchScanSuccess}
      />
    </div >
  );
}