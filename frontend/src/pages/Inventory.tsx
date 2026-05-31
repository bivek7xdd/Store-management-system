import { useState, useRef, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { StockAdjustmentTable } from "@/components/inventory/StockAdjustmentTable";
import { StockMovementTable } from "@/components/inventory/StockMovementTable";
import { Search, Plus, AlertTriangle, Calendar, Download, Upload, Package, Loader2, Pencil, Trash2, Scan, WifiOff, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, CreateProductData, UpdateProductData, ProductBatch, CreateProductBatchData } from "@/services/inventory";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { Product, Category, OfflineStatus } from "@/types";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { PremiumEmptyState } from "@/components/PremiumEmptyState";
import { FeatureTooltip } from "@/components/FeatureTooltip";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VariantBuilder, VariantDimension } from "@/components/products/VariantBuilder";
import { VariantGrid, generateCartesianProduct } from "@/components/products/VariantGrid";
import { ProductVariant } from "@/types";
import { db } from "@/db/db";
import { cn } from "@/lib/utils";

const colors = {
  primary: "#DA291C",
  primaryDark: "#B01E0A",
  surface: "#111111",
  border: "#1A1A1A",
  muted: "#888888",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(syncService.getStatus());
  const [hasVariants, setHasVariants] = useState(false);
  const [dimensions, setDimensions] = useState<VariantDimension[]>([]);
  const [combinations, setCombinations] = useState<Partial<ProductVariant>[]>([]);
  const [productName, setProductName] = useState("");
  const [expandAll, setExpandAll] = useState(false);
const [activeTab, setActiveTab] = useState("products");
const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
const [adjustmentRefreshKey, setAdjustmentRefreshKey] = useState(0);
const [batchesToSave, setBatchesToSave] = useState<CreateProductBatchData[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState<CreateProductBatchData>({
    batch_number: "",
    quantity: 0,
  });
  const ITEMS_PER_PAGE = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to generate a clean SKU
  const generateSKU = (name: string, attrs: Record<string, string>) => {
    if (!name) return "";
    const nameSlug = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const attrSlug = Object.values(attrs)
      .map(v => v.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))
      .join('-');
    return attrSlug ? `${nameSlug}-${attrSlug}` : nameSlug;
  };

  useEffect(() => {
    if (hasVariants) {
       const newCombs = generateCartesianProduct(dimensions);
       // Preserve existing values for matched attributes
       setCombinations(prev => newCombs.map(nc => {
          const match = prev.find(p => JSON.stringify(p.attributes) === JSON.stringify(nc));
          if (match) return { ...match, attributes: nc };
          
          // If no match, it's a new combination - auto-generate SKU
          return { 
            attributes: nc,
            sku: generateSKU(productName || editingProduct?.name || "", nc)
          };
       }));
    }
  }, [dimensions, hasVariants, productName, editingProduct]);

  // Initialize sync service and listen for status changes
  useEffect(() => {
    const cleanup = syncService.init();
    const unsubscribe = syncService.onStatusChange((status) => {
      setOfflineStatus(status);
    });

    return () => {
      cleanup();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter]);

  useEffect(() => {
    if (editingProduct && addDialogOpen) {
      inventoryService.listProductBatches(editingProduct.id).then(setBatches);
    }
  }, [editingProduct, addDialogOpen]);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch products with search and filter awareness
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products", searchTerm, categoryFilter, stockFilter],
    queryFn: () => {
      if (searchTerm && searchTerm.length >= 2) {
        return inventoryService.searchProducts(searchTerm, 100);
      }
      return inventoryService.getProducts(200); // Fetch a larger batch for local management
    },
    enabled: isAuthenticated && !authLoading,
  });

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: inventoryService.getCategories,
    enabled: isAuthenticated && !authLoading,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductData) => {
      return inventoryService.createProduct(data);
    },
    onError: (error) => {
      toast.error("Failed to add product");
    },
    onSuccess: async (data) => {
      // Save any batches that were added during creation
      if (batchesToSave.length > 0 && data?.id) {
        for (const batch of batchesToSave) {
          try {
            await inventoryService.createProductBatch(data.id, batch);
          } catch (err) {
            console.error("Failed to save batch:", err);
          }
        }
        toast.success("Product and batches added successfully!");
      } else {
        toast.success("Product added successfully!");
      }
      setBatchesToSave([]);
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });


  // Update product mutation with optimistic updates
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => {
      return inventoryService.updateProduct(id, data);
    },
    onMutate: async ({ id, data }) => {
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
      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }

      // Reset UI state
      setAddDialogOpen(false);
      setEditingProduct(null);

      toast.error("Failed to update product");
    },
    onSuccess: (data) => {
      toast.success(navigator.onLine ? "Product updated successfully!" : "Product saved offline!");
      setAddDialogOpen(false);
      setEditingProduct(null);
    },
    onSettled: () => {
      // Refetch to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Delete product mutation with optimistic updates
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => {
      return inventoryService.deleteProduct(id);
    },
    onMutate: async (id) => {
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
      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }

      toast.error("Failed to delete product");
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Get unique categories from products for filter (fallback to categories list)

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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEditClick = async (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setBarcodeValue(getTextValue(product.barcode));

    try {
      // Use the service to get the full product with variants (handles online/offline fetch)
      const fullProduct = await inventoryService.getProduct(product.id);
      const savedVariants = fullProduct.variants || [];

      if (savedVariants.length > 0) {
        setHasVariants(true);

        // Reconstruct dimensions from saved variant attributes
        const allKeys = Array.from(
          new Set(savedVariants.flatMap(v => Object.keys(v.attributes || {})))
        ) as string[];
        const reconstructedDimensions: VariantDimension[] = allKeys.map(key => ({
          name: key,
          values: Array.from(
            new Set(savedVariants.map(v => v.attributes[key]).filter(Boolean))
          ),
        }));
        setDimensions(reconstructedDimensions);

        // Reconstruct combinations from the saved variants
        const reconstructedCombinations: Partial<ProductVariant>[] = savedVariants.map(v => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          attributes: v.attributes as Record<string, string>,
          cost_price: v.cost_price,
          selling_price: v.selling_price,
          stock_level: v.stock_level,
        }));
        setCombinations(reconstructedCombinations);
      } else {
        setHasVariants(false);
        setDimensions([]);
        setCombinations([]);
      }
    } catch (err) {
      console.warn('[Inventory] Could not load variants for edit:', err);
      setHasVariants(false);
    }

    setAddDialogOpen(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteProductMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
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
      setHasVariants(false);
      setDimensions([]);
      setCombinations([]);
      setBatchesToSave([]);
    } else if (editingProduct) {
      setBarcodeValue(getTextValue(editingProduct.barcode));
      setProductName(editingProduct.name);
    } else {
      setProductName("");
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
    if (data.warranty_days !== undefined && data.warranty_days < 0) errors.warranty_days = "Warranty days cannot be negative";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const priceRaw = parseFloat(formData.get("price") as string);
    const price = hasVariants && isNaN(priceRaw) ? combinations[0]?.selling_price || 0 : priceRaw || 0;
    
    const costPriceRaw = parseFloat(formData.get("cost_price") as string);
    const cost_price = hasVariants && isNaN(costPriceRaw) ? combinations[0]?.cost_price || 0 : costPriceRaw || 0;
    
    const stockRaw = parseInt(formData.get("stock_quantity") as string);
    const stock_quantity = hasVariants ? combinations.reduce((acc, c) => acc + (c.stock_level || 0), 0) : stockRaw || 0;

    const data: CreateProductData = {
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string || undefined,
      price: price,
      cost_price: cost_price,
      stock_quantity: stock_quantity,
      low_stock_threshold: formData.get("low_stock_threshold") ? parseInt(formData.get("low_stock_threshold") as string) : 10,
      warranty_days: (() => {
        const val = parseInt(formData.get("warranty_value") as string) || 0;
        const unit = formData.get("warranty_unit") as string;
        if (unit === "months") return val * 30;
        if (unit === "years") return val * 365;
        return val;
      })(),
      expires_at: formData.get("expires_at") ? new Date(formData.get("expires_at") as string).toISOString() : undefined,
      category_id: formData.get("category_id") as string,
    };

    if (hasVariants && combinations.length > 0) {
      data.variants = combinations.map((c) => ({
        sku: c.sku || "",
        barcode: c.barcode || undefined,
        attributes: c.attributes || {},
        cost_price: c.cost_price || cost_price,
        selling_price: c.selling_price || price,
        stock_level: c.stock_level || 0,
      }));
    }

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
      <div className="space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Warehouse</p>
            <h1 className="text-[24px] font-bold text-white tracking-tight">Inventory</h1>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[56px] bg-[#1A1A1A] rounded-[2px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[#DA291C] mb-2 font-medium">Failed to load products</p>
          <p className="text-[#888888] text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="inventory-header">
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Warehouse</p>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Inventory</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Offline Status Indicator */}
          <OfflineIndicator
            isOnline={offlineStatus.isOnline}
            pendingSales={offlineStatus.pendingSales}
            pendingProducts={offlineStatus.pendingProducts}
            pendingCategories={offlineStatus.pendingCategories}
            pendingSuppliers={offlineStatus.pendingSuppliers}
            isSyncing={offlineStatus.isSyncing}
            syncError={offlineStatus.syncError}
            lastSyncTime={offlineStatus.lastSyncTime}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv, .xlsx, .xls"
            onChange={handleImport}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportClick}
                    className="rounded-[2px] border-[#303030] bg-[#111111] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] text-[11px] uppercase tracking-[1px]"
                    disabled={!offlineStatus.isOnline}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                </span>
              </TooltipTrigger>
              {!offlineStatus.isOnline && (
                <TooltipContent>
                  <p>Import requires internet connection</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="rounded-[2px] border-[#303030] bg-[#111111] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] text-[11px] uppercase tracking-[1px]"
                    disabled={!offlineStatus.isOnline}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </span>
              </TooltipTrigger>
              {!offlineStatus.isOnline && (
                <TooltipContent>
                  <p>Export requires internet connection</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Dialog open={addDialogOpen} onOpenChange={handleDialogChange}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[11px] uppercase tracking-[1px]"
                        disabled={!offlineStatus.isOnline}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                  </span>
                </TooltipTrigger>
                {!offlineStatus.isOnline && (
                  <TooltipContent>
                    <p>Adding products requires internet connection</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-[2px] bg-[#0A0A0A] border border-[#DA291C] p-0 shadow-2xl shadow-red-500/10">
              {/* Dialog Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1A1A1A]">
                <div>
                  <p className="text-[10px] text-[#888888] uppercase tracking-[1.5px] mb-0.5">
                    {editingProduct ? "Edit" : "New"} Product
                  </p>
                  <DialogTitle className="text-[18px] font-bold text-white tracking-tight">
                    {editingProduct ? editingProduct.name : "Add Product"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {editingProduct ? "Update product details" : "Enter product details to add to your inventory"}
                  </DialogDescription>
                </div>
              </div>

              <form className="space-y-0" onSubmit={handleSubmit}>
                <div className="px-6 py-4 space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Product Name *</label>
                    <input
                      id="name" name="name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Basmati Rice"
                      required
                      className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none focus:border-[#333333] transition-colors"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Category *</label>
                    <Select name="category_id" required defaultValue={editingProduct?.category_id}>
                      <SelectTrigger className="h-10 bg-[#111111] border-[#1A1A1A] rounded-[2px] text-[13px] text-white focus:ring-0 focus:border-[#333333]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#1A1A1A] rounded-[2px]">
                        {categories?.map((cat: Category) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-[13px] text-white focus:bg-[#1A1A1A] focus:text-white">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Barcode */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        id="barcode" name="barcode"
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                        placeholder="8901234567890"
                        className="flex-1 h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none focus:border-[#333333] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setFormScannerOpen(true)}
                        className="h-10 w-10 bg-[#111111] border border-[#1A1A1A] rounded-[2px] flex items-center justify-center text-[#666666] hover:text-white hover:border-[#333333] transition-colors"
                      >
                        <Scan className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Variants toggle */}
                  <div className="flex items-center justify-between p-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div>
                      <p className="text-[13px] font-medium text-white">Product has variants</p>
                      <p className="text-[11px] text-[#888888] mt-0.5">
                        {editingProduct && hasVariants
                          ? 'Editing existing variants — toggle locked'
                          : 'E.g. Size, Color, Material'}
                      </p>
                    </div>
                    <Switch
                      checked={hasVariants}
                      onCheckedChange={editingProduct && hasVariants ? undefined : setHasVariants}
                      disabled={!!(editingProduct && hasVariants)}
                      className="data-[state=checked]:bg-[#DA291C]"
                    />
                  </div>

                  {/* Variant builder */}
                  {hasVariants && (
                    <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
                      <div className="flex items-center gap-2 p-2 bg-[#1A1A1A] rounded-[2px] border border-amber-500/20">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <p className="text-[11px] text-amber-400 font-medium leading-tight">
                          SKUs and prices can be updated. Changing dimensions will regenerate combinations.
                        </p>
                      </div>
                      <VariantBuilder dimensions={dimensions} onChange={setDimensions} />
                      <div className="w-full overflow-x-auto -mx-1 px-1">
                        <VariantGrid combinations={combinations} onChange={setCombinations} />
                      </div>
                    </div>
                  )}

                  {/* Price / Stock (hidden when variants active) */}
                  <div className={hasVariants ? "hidden" : "space-y-4"}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Price (रू) *</label>
                        <input
                          id="price" name="price" type="number" step="0.01"
                          defaultValue={editingProduct ? getNumericValue(editingProduct.price) : undefined}
                          placeholder="100"
                          required={!hasVariants}
                          onChange={() => setFormErrors(prev => ({ ...prev, price: "" }))}
                          className={`w-full h-10 px-3 bg-[#111111] border rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none transition-colors no-spinner ${formErrors.price ? "border-[#DA291C]" : "border-[#1A1A1A] focus:border-[#333333]"}`}
                        />
                        {formErrors.price && <p className="text-[11px] text-[#DA291C]">⚠ {formErrors.price}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Cost Price (रू)</label>
                        <input
                          id="cost_price" name="cost_price" type="number" step="0.01"
                          defaultValue={editingProduct ? getNumericValue(editingProduct.cost_price as any) : undefined}
                          placeholder="80"
                          onChange={() => setFormErrors(prev => ({ ...prev, cost_price: "" }))}
                          className={`w-full h-10 px-3 bg-[#111111] border rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none transition-colors no-spinner ${formErrors.cost_price ? "border-[#DA291C]" : "border-[#1A1A1A] focus:border-[#333333]"}`}
                        />
                        {formErrors.cost_price && <p className="text-[11px] text-[#DA291C]">⚠ {formErrors.cost_price}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Stock Quantity *</label>
                        <input
                          id="stock_quantity" name="stock_quantity" type="number" min={0} max={2147483647}
                          defaultValue={editingProduct?.stock_quantity}
                          placeholder="50"
                          required={!hasVariants}
                          onChange={() => setFormErrors(prev => ({ ...prev, stock_quantity: "" }))}
                          className={`w-full h-10 px-3 bg-[#111111] border rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none transition-colors no-spinner ${formErrors.stock_quantity ? "border-[#DA291C]" : "border-[#1A1A1A] focus:border-[#333333]"}`}
                        />
                        {formErrors.stock_quantity && <p className="text-[11px] text-[#DA291C]">⚠ {formErrors.stock_quantity}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Low Stock Alert</label>
                        <input
                          id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} max={2147483647}
                          defaultValue={editingProduct ? getInt32Value(editingProduct.low_stock_threshold) : 10}
                          placeholder="10"
                          onChange={() => setFormErrors(prev => ({ ...prev, low_stock_threshold: "" }))}
                          className={`w-full h-10 px-3 bg-[#111111] border rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none transition-colors no-spinner ${formErrors.low_stock_threshold ? "border-[#DA291C]" : "border-[#1A1A1A] focus:border-[#333333]"}`}
                        />
                        {formErrors.low_stock_threshold && <p className="text-[11px] text-[#DA291C]">⚠ {formErrors.low_stock_threshold}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Expiry date and Warranty */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Expiry Date</label>
                      <input
                        id="expires_at" name="expires_at" type="date"
                        defaultValue={formatDateForInput(getDateValue(editingProduct?.expires_at))}
                        className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white focus:outline-none focus:border-[#333333] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Warranty Period</label>
                      <div className="flex gap-2">
                        <input
                          id="warranty_value" name="warranty_value" type="number" min={0}
                          defaultValue={(() => {
                            const totalDays = editingProduct ? getNumericValue(editingProduct.warranty_days) : 0;
                            if (totalDays === 0) return 0;
                            if (totalDays % 365 === 0) return totalDays / 365;
                            if (totalDays % 30 === 0) return totalDays / 30;
                            return totalDays;
                          })()}
                          placeholder="1"
                          onChange={() => setFormErrors(prev => ({ ...prev, warranty_days: "" }))}
                          className={`flex-1 h-10 px-3 bg-[#111111] border rounded-[2px] text-[13px] text-white placeholder:text-[#555555] focus:outline-none transition-colors no-spinner ${formErrors.warranty_days ? "border-[#DA291C]" : "border-[#1A1A1A] focus:border-[#333333]"}`}
                        />
                        <select
                          name="warranty_unit"
                          defaultValue={(() => {
                            const totalDays = editingProduct ? getNumericValue(editingProduct.warranty_days) : 0;
                            if (totalDays === 0) return "days";
                            if (totalDays % 365 === 0) return "years";
                            if (totalDays % 30 === 0) return "months";
                            return "days";
                          })()}
                          className="w-24 h-10 px-2 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[12px] text-white focus:outline-none focus:border-[#333333] transition-colors"
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                      {formErrors.warranty_days && <p className="text-[11px] text-[#DA291C]">⚠ {formErrors.warranty_days}</p>}
                    </div>
                  </div>
                </div>

                {/* Batches Section */}
                <div className="space-y-4 pt-4 border-t border-[#1A1A1A]">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Batches (optional)</label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditingBatch(null);
                                setBatchForm({ batch_number: "", quantity: 0 });
                                setBatchDialogOpen(true);
                            }}
                            className="h-7 text-[10px] border-[#1A1A1A] text-[#888888]"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Batch
                        </Button>
                    </div>
                        
                        {(() => {
                            const displayBatches = editingProduct ? batches : batchesToSave;
                            return displayBatches.length > 0 ? (
                            <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                                            <TableHead className="text-[10px] text-[#888888] uppercase">Batch #</TableHead>
                                            <TableHead className="text-[10px] text-[#888888] uppercase">Mfg Date</TableHead>
                                            <TableHead className="text-[10px] text-[#888888] uppercase">Expiry</TableHead>
                                            <TableHead className="text-[10px] text-[#888888] uppercase text-right">Qty</TableHead>
                                            <TableHead className="text-[10px] text-[#888888] uppercase text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayBatches.map((batch: any, index: number) => (
                                            <TableRow key={batch.id || index} className="border-b border-[#1A1A1A]">
                                                <TableCell className="text-[11px] text-white">{batch.batch_number}</TableCell>
                                                <TableCell className="text-[11px] text-[#888888]">
                                                    {batch.manufacturing_date || "—"}
                                                </TableCell>
                                                <TableCell className="text-[11px] text-[#888888]">
                                                    {batch.expiry_date || "—"}
                                                </TableCell>
                                                <TableCell className="text-[11px] text-white text-right">{batch.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            setEditingBatch(batch);
                                                            setBatchForm({
                                                                batch_number: batch.batch_number,
                                                                manufacturing_date: batch.manufacturing_date,
                                                                expiry_date: batch.expiry_date,
                                                                quantity: batch.quantity,
                                                                notes: batch.notes,
                                                            });
                                                            setBatchDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-[#DA291C]"
                                                        onClick={async () => {
                                                            if (editingProduct) {
                                                                try {
                                                                    await inventoryService.deleteProductBatch(editingProduct.id, batch.id);
                                                                    setBatches(batches.filter(b => b.id !== batch.id));
                                                                    toast.success("Batch deleted successfully");
                                                                } catch (error) {
                                                                    toast.error("Failed to delete batch");
                                                                }
                                                            } else {
                                                                setBatchesToSave(batchesToSave.filter((_, i) => i !== index));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            ) : (
                                <p className="text-[11px] text-[#555555]">No batches added yet.</p>
                            );
                        })()}
                    </div>

                {/* Submit */}
                <div className="px-6 py-4 border-t border-[#1A1A1A]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[#DA291C] hover:bg-[#B01E0A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-[1px] rounded-[2px] transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {editingProduct ? "Updating..." : "Adding..."}</>
                    ) : !offlineStatus.isOnline ? (
                      editingProduct ? "Save Offline" : "Add Offline"
                    ) : (
                      editingProduct ? "Update Product" : "Add Product"
                    )}
                  </button>
                </div>
              </form>

              {/* Batch Dialog */}
              <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
                  <DialogContent className="max-w-md bg-[#0A0A0A] border border-[#1A1A1A]">
                      <DialogHeader>
                          <DialogTitle className="text-white">
                              {editingBatch ? "Edit Batch" : "Add Batch"}
                          </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <Label className="text-[#888888]">Batch Number *</Label>
                              <Input
                                  value={batchForm.batch_number}
                                  onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                                  placeholder="e.g., BATCH-001"
                                  className="bg-[#111111] border-[#1A1A1A] text-white"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                  <Label className="text-[#888888]">Mfg Date</Label>
                                  <Input
                                      type="date"
                                      value={batchForm.manufacturing_date || ""}
                                      onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })}
                                      className="bg-[#111111] border-[#1A1A1A] text-white"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-[#888888]">Expiry Date</Label>
                                  <Input
                                      type="date"
                                      value={batchForm.expiry_date || ""}
                                      onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                                      className="bg-[#111111] border-[#1A1A1A] text-white"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <Label className="text-[#888888]">Quantity *</Label>
                              <Input
                                  type="number"
                                  value={batchForm.quantity}
                                  onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) || 0 })}
                                  className="bg-[#111111] border-[#1A1A1A] text-white"
                              />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-[#888888]">Notes</Label>
                              <Input
                                  value={batchForm.notes || ""}
                                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                                  placeholder="Optional notes..."
                                  className="bg-[#111111] border-[#1A1A1A] text-white"
                              />
                          </div>
                      </div>
                      <DialogFooter>
                          <Button
                              type="button"
                              variant="outline"
                              onClick={() => setBatchDialogOpen(false)}
                              className="border-[#1A1A1A] text-[#888888]"
                          >
                              Cancel
                          </Button>
                           <Button
                               type="button"
                               onClick={async () => {
                                   if (!batchForm.batch_number) return;
                                   
                                   try {
                                       if (editingProduct) {
                                           // Editing existing product - save directly to API
                                           if (editingBatch) {
                                               await inventoryService.updateProductBatch(editingProduct.id, editingBatch.id, batchForm);
                                               toast.success("Batch updated successfully");
                                           } else {
                                               await inventoryService.createProductBatch(editingProduct.id, batchForm);
                                               toast.success("Batch added successfully");
                                           }
                                           
                                           const updatedBatches = await inventoryService.listProductBatches(editingProduct.id);
                                           setBatches(updatedBatches);
                                       } else {
                                           // Creating new product - add to batchesToSave
                                           if (editingBatch) {
                                               // Update existing batch in the list
                                               const index = batchesToSave.findIndex(b => b.batch_number === editingBatch.batch_number);
                                               if (index >= 0) {
                                                   const updated = [...batchesToSave];
                                                   updated[index] = batchForm;
                                                   setBatchesToSave(updated);
                                               }
                                           } else {
                                               // Add new batch to list
                                               setBatchesToSave([...batchesToSave, batchForm]);
                                           }
                                           toast.success("Batch added to product");
                                       }
                                       setBatchDialogOpen(false);
                                   } catch (error) {
                                       toast.error("Failed to save batch");
                                   }
                               }}
                               className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                           >
                              {editingBatch ? "Update" : "Add"} Batch
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
            </DialogContent>
          </Dialog>

          {/* Import CSV Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-[2px] bg-[#0A0A0A] border border-[#333333] p-0 shadow-2xl shadow-red-500/10">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1A1A1A]">
                <div>
                  <p className="text-[10px] text-[#888888] uppercase tracking-[1.5px] mb-0.5">Spreadsheet</p>
                  <DialogTitle className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#DA291C]" />
                    Import Products
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-[#555555] mt-1">
                    Supported formats: CSV, Excel (.xlsx, .xls) and Google Sheets.
                  </DialogDescription>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div className="bg-[#111111] border border-[#1A1A1A] p-4 rounded-[2px] text-[12px] text-[#8F8F8F] flex gap-3">
                  <div className="h-5 w-5 rounded-[2px] bg-[#DA291C]/10 text-[#DA291C] flex items-center justify-center shrink-0 font-bold text-[10px]">i</div>
                  <p>For <strong>Google Sheets</strong>: Go to File &gt; Download &gt; Microsoft Excel (.xlsx) and then upload that file here.</p>
                </div>

                <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#0A0A0A]">
                      <TableRow className="border-[#1A1A1A] hover:bg-transparent">
                        <TableHead className="w-[150px] text-[11px] font-normal text-[#555555] uppercase tracking-[1px] h-10">Spreadsheet Column</TableHead>
                        <TableHead className="text-[11px] font-normal text-[#555555] uppercase tracking-[1px] text-center border-l border-[#1A1A1A] h-10">Required</TableHead>
                        <TableHead className="text-[11px] font-normal text-[#555555] uppercase tracking-[1px] border-l border-[#1A1A1A] h-10">Sample Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { col: "name", req: "Yes", sample: "Basmati Rice" },
                        { col: "price", req: "Yes", sample: "150.00" },
                        { col: "category_name", req: "Yes", sample: "Grains" },
                        { col: "barcode", req: "No", sample: "8901234567890" },
                        { col: "cost_price", req: "No", sample: "120.00" },
                        { col: "stock_quantity", req: "No (0)", sample: "50" },
                        { col: "low_stock_threshold", req: "No (10)", sample: "10" },
                        { col: "expires_at", req: "No", sample: "2026-12-31" },
                      ].map((row, idx) => (
                        <TableRow key={idx} className="border-[#1A1A1A] hover:bg-[#111111]/50 text-[12px]">
                          <TableCell className="font-medium text-[#CCCCCC] bg-[#0A0A0A]/30 py-2.5">{row.col}</TableCell>
                          <TableCell className="text-center border-l border-[#1A1A1A] py-2.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-[2px] text-[10px] font-medium uppercase tracking-[0.5px]",
                              row.req.startsWith("Yes") ? "bg-[#DA291C]/10 text-[#DA291C]" : "bg-[#1A1A1A] text-[#555555]"
                            )}>
                              {row.req}
                            </span>
                          </TableCell>
                          <TableCell className="text-[#555555] border-l border-[#1A1A1A] font-mono text-[10px] italic py-2.5">{row.sample}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div 
                  className="border-2 border-dashed border-[#1A1A1A] rounded-[2px] p-10 flex flex-col items-center justify-center gap-4 bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#303030] transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="h-12 w-12 bg-[#0A0A0A] rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#555555] group-hover:text-white transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-white">Choose your Excel or CSV file</p>
                    <p className="text-[11px] text-[#555555] mt-1">Make sure the first row contains the column headers</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1A1A1A]">
                  <button onClick={downloadTemplate} className="text-[11px] text-[#555555] hover:text-[#DA291C] uppercase tracking-[1px] flex items-center gap-2 transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    Download Template
                  </button>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-[2px] border border-[#1A1A1A] text-[#8F8F8F] text-[11px] uppercase tracking-[1px] hover:text-white transition-colors" onClick={() => setImportDialogOpen(false)}>Cancel</button>
                    <button className="px-6 py-2 rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[11px] uppercase tracking-[1px] transition-colors" onClick={() => fileInputRef.current?.click()}>Upload File</button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Offline Mode Banner */}
      {!offlineStatus.isOnline && (
        <div className="bg-[#1A1A1A] border border-[#303030] rounded-[2px] p-4 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white uppercase tracking-[0.5px]">Working Offline</p>
            <p className="text-xs text-[#888888]">
              Product changes will be saved locally and synced when connection is restored.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-4" data-tour="inventory-filters">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              placeholder="Search products or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-10 bg-transparent border border-[#303030] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#555555] transition-colors"
            />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchScannerOpen(true)}
                data-tour="inventory-scanner"
              >
                <Scan className="h-4 w-4 text-[#666666] hover:text-[#888888]" />
              </button>
            </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 bg-[#0A0A0A] border border-[#303030] rounded-[2px] text-[12px] text-[#CCCCCC] focus:outline-none focus:border-[#555555] transition-colors"
          >
            <option value="all">All Categories</option>
            {categories?.map((cat: Category) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-10 px-3 bg-[#0A0A0A] border border-[#303030] rounded-[2px] text-[12px] text-[#CCCCCC] focus:outline-none focus:border-[#555555] transition-colors"
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="expiring">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#111111] border border-[#1A1A1A] p-1">
          <TabsTrigger value="products" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Products
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">
            Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden" data-tour="inventory-grid">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                    <TableHead className="w-[40px] text-[#666666]">
                      <button
                        className="h-6 w-6 flex items-center justify-center text-[#666666] hover:text-white"
                        onClick={() => setExpandAll(!expandAll)}
                        title={expandAll ? "Collapse All" : "Expand All"}
                      >
                        {expandAll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Product</TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Status</TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Stock</TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Price</TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold">Barcode</TableHead>
                    <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product: Product) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      handleEditClick={handleEditClick}
                      handleDeleteClick={handleDeleteClick}
                      offlineStatus={offlineStatus}
                      forceExpand={expandAll}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-[2px] border border-[#1A1A1A] text-[11px] text-[#888888] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase tracking-[1px]"
                >Prev</button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-[2px] border border-[#1A1A1A] text-[11px] text-[#888888] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase tracking-[1px]"
                >Next</button>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#1A1A1A] rounded-[2px]">
              <Package className="h-8 w-8 text-[#303030] mb-4" />
              <p className="text-[14px] font-medium text-white mb-1">
                {productsList.length === 0 ? "No products yet" : "No results found"}
              </p>
              <p className="text-[12px] text-[#888888] text-center max-w-xs">
                {productsList.length === 0
                  ? "Start building your inventory by adding your first product."
                  : "No products match your current filters."}
              </p>
              {(searchTerm || categoryFilter !== "all" || stockFilter !== "all") && (
                <button
                  onClick={() => { setSearchTerm(""); setCategoryFilter("all"); setStockFilter("all"); }}
                  className="mt-4 text-[11px] text-[#DA291C] uppercase tracking-[1px] hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setAdjustmentDialogOpen(true)}
              className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Adjustment
            </Button>
          </div>
          <StockAdjustmentTable refreshKey={adjustmentRefreshKey} />
        </TabsContent>

        <TabsContent value="movements">
          <StockMovementTable />
        </TabsContent>
      </Tabs>

      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        products={productsList}
      />

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">&quot;{deleteTarget?.name}&quot;</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#DA291C] text-white text-[10px] uppercase font-black tracking-widest h-10 px-6 rounded-[2px] hover:bg-[#B01E0A] transition-colors"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  handleEditClick: (product: Product) => void;
  handleDeleteClick: (product: Product) => void;
  offlineStatus: OfflineStatus;
  forceExpand?: boolean;
}

function ProductTableRow({ product, handleEditClick, handleDeleteClick, offlineStatus, forceExpand }: ProductCardProps) {
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>(product.variants || []);
  const [expanded, setExpanded] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [expiringBatchCount, setExpiringBatchCount] = useState(0);

  useEffect(() => {
    if (forceExpand !== undefined) {
      setExpanded(forceExpand);
    }
  }, [forceExpand]);
  
  useEffect(() => {
    if (!product.variants || product.variants.length === 0) {
      db.product_variants.where('product_id').equals(product.id).toArray()
        .then(vars => {
          if (vars.length > 0) setLocalVariants(vars);
        });
    } else {
      setLocalVariants(product.variants);
    }
  }, [product.id, product.variants]);

  // Fetch batch count for this product
  useEffect(() => {
    inventoryService.listProductBatches(product.id).then(batches => {
      setBatchCount(batches.length);
      // Count batches expiring within 30 days
      const expiring = batches.filter((b: any) => {
        if (!b.expiry_date) return false;
        const daysUntil = Math.floor((new Date(b.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30 && daysUntil > 0;
      }).length;
      setExpiringBatchCount(expiring);
    });
  }, [product.id]);

  const displayVariants = localVariants;
  const stockQuantity = product.stock_quantity;
  const lowThreshold = getInt32Value(product.low_stock_threshold);
  const isLowStock = stockQuantity <= lowThreshold;

  const expiryDate = getDateValue(product.expires_at);
  const daysUntilExpiry = expiryDate
    ? Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  const price = getNumericValue(product.price);
  const barcode = getTextValue(product.barcode);
  const hasVariants = displayVariants && displayVariants.length > 0;

  return (
    <>
      <TableRow className={`border-b border-[#1A1A1A] hover:bg-[#0D0D0D] transition-colors ${expanded ? 'bg-[#0D0D0D]' : ''}`}>
        <TableCell className="p-3">
          {hasVariants && (
            <button
              className="h-8 w-8 flex items-center justify-center text-[#666666] hover:text-white transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </TableCell>
        <TableCell className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[2px] bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-[#555555]" />
            </div>
            <div>
              <div className="font-semibold text-white text-[13px] flex items-center gap-2">
                {product.name}
                {hasVariants && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#DA291C]/10 text-[#DA291C] border border-[#DA291C]/20 rounded-[2px] font-bold uppercase tracking-wider">
                    {displayVariants.length} VAR
                  </span>
                )}
                {batchCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-[2px] font-bold uppercase tracking-wider ${
                    expiringBatchCount > 0 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {batchCount} B{batchCount === 1 ? 'ATCH' : 'ATCHES'}
                    {expiringBatchCount > 0 && ` (${expiringBatchCount} EXP)`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="p-3">
          <span className="text-[12px] text-[#888888] capitalize">{product.status?.product_status || 'active'}</span>
          {isExpiringSoon && (
            <div className="mt-1">
              <span className="text-[10px] text-amber-400 font-bold">{daysUntilExpiry}d exp</span>
            </div>
          )}
        </TableCell>
        <TableCell className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">{stockQuantity}</span>
            <span className="text-[11px] text-[#888888]">units</span>
            {isLowStock && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-[2px] font-bold uppercase tracking-wider">Low</span>
            )}
          </div>
        </TableCell>
        <TableCell className="p-3">
          <span className="text-[13px] font-bold text-[#DA291C]">रू {price}</span>
        </TableCell>
        <TableCell className="p-3">
          <span className="font-mono text-[11px] text-[#666666]">{barcode || '—'}</span>
        </TableCell>
        <TableCell className="p-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#666666] hover:text-white hover:bg-[#1A1A1A]"
                      onClick={() => handleEditClick(product)}
                      disabled={!offlineStatus.isOnline}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!offlineStatus.isOnline && (
                  <TooltipContent><p>Requires internet</p></TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#666666] hover:text-[#DA291C] hover:bg-[#DA291C]/10"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>Delete product</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Variants Row */}
      {hasVariants && expanded && (
        <TableRow>
          <TableCell colSpan={7} className="p-0 border-b border-[#1A1A1A]">
            <div className="pl-[60px] pr-4 py-3 bg-[#0D0D0D] border-l-2 border-l-[#DA291C]/40">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    <th className="pb-2 text-left text-[10px] text-[#888888] uppercase tracking-[1px] font-bold">Variant</th>
                    <th className="pb-2 text-left text-[10px] text-[#888888] uppercase tracking-[1px] font-bold">SKU</th>
                    <th className="pb-2 text-left text-[10px] text-[#888888] uppercase tracking-[1px] font-bold">Barcode</th>
                    <th className="pb-2 text-right text-[10px] text-[#888888] uppercase tracking-[1px] font-bold">Price</th>
                    <th className="pb-2 text-right text-[10px] text-[#888888] uppercase tracking-[1px] font-bold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {displayVariants.map((v) => (
                    <tr key={String(v.id)} className="border-b border-[#1A1A1A] last:border-0">
                      <td className="py-2 text-[12px] font-medium text-white">
                        {Object.values(v.attributes as Record<string,string>).join(' / ')}
                      </td>
                      <td className="py-2 text-[11px] font-mono text-[#888888]">{v.sku}</td>
                      <td className="py-2 text-[11px] font-mono text-[#888888]">{(v as any).barcode || '—'}</td>
                      <td className="py-2 text-[12px] text-right text-[#DA291C] font-bold">रू {(v as any).selling_price}</td>
                      <td className="py-2 text-[12px] text-right">
                        <span className={`font-bold ${ (v as any).stock_level <= 5 ? 'text-amber-400' : 'text-white'}`}>
                          {(v as any).stock_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}