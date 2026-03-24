import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Minus, ShoppingCart, Trash2, Scan, CreditCard, Banknote, Loader2, WifiOff, Database, AlertCircle } from "lucide-react";
import { inventoryService } from "@/services/inventory";
import { salesService, CreateSaleData } from "@/services/sales";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { Product, OfflineStatus } from "@/types";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { db } from "@/db/db";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Sales() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [debtNote, setDebtNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(syncService.getStatus());
  const [cachedProductsCount, setCachedProductsCount] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discountAmount = discountType === "percent"
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : (parseFloat(discountValue) || 0);

  const finalTotal = Math.max(0, subtotal - discountAmount);
  const change = amountReceived ? parseFloat(amountReceived) - finalTotal : 0;

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

  // Get cached products count for offline indicator
  useEffect(() => {
    const getCachedProductsCount = async () => {
      try {
        const count = await db.products.count();
        setCachedProductsCount(count);
      } catch (error) {
        console.error('Failed to get cached products count:', error);
      }
    };

    getCachedProductsCount();
  }, []);

  // Search products when searchTerm changes
  useEffect(() => {
    const search = async () => {
      if (!searchTerm) {
        setProducts([]);
        return;
      }
      setIsSearching(true);
      try {
        let results;
        if (offlineStatus.isOnline) {
          // Online: Use inventory service
          results = await inventoryService.searchProducts(searchTerm);
        } else {
          // Offline: Search cached products
          const cachedProducts = await db.products
            .where('name')
            .startsWithIgnoreCase(searchTerm)
            .limit(20)
            .toArray();
          results = cachedProducts;
        }
        setProducts(results || []);
      } catch (error) {
        console.error("Search error:", error);
        // Fallback to cached products if online search fails
        if (offlineStatus.isOnline) {
          try {
            const cachedProducts = await db.products
              .where('name')
              .startsWithIgnoreCase(searchTerm)
              .limit(20)
              .toArray();
            setProducts(cachedProducts || []);
            toast.info("Showing cached products (network error)");
          } catch (fallbackError) {
            console.error("Fallback search error:", fallbackError);
            setProducts([]);
          }
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, offlineStatus.isOnline]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id);
    const price = typeof product.price === 'number' ? product.price : (product.price as any).Int64 || (product.price as any).Float64 || 0;

    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        toast.error("Not enough stock");
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock_quantity <= 0) {
        toast.error("Product out of stock");
        return;
      }
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: price,
          quantity: 1,
          stock: product.stock_quantity
        },
      ]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const handleScanSuccess = async (barcode: string) => {
    setIsSearching(true);
    try {
      let results: Product[] = [];
      if (offlineStatus.isOnline) {
        results = await inventoryService.searchProducts(barcode);
      } else {
        // Offline: Search cached products
        const allProducts = await db.products.toArray();
        results = allProducts.filter(p => {
          const barcodeStr = typeof p.barcode === 'string'
            ? p.barcode
            : (p.barcode && 'Valid' in p.barcode && p.barcode.Valid ? p.barcode.String : '');
          return barcodeStr === barcode;
        });
      }

      if (results && results.length > 0) {
        // If multiple matches (rare for barcodes), add the first one or show list
        if (results.length === 1) {
          addToCart(results[0]);
          setSearchTerm("");
        } else {
          setSearchTerm(barcode);
          toast.info(`Found ${results.length} products with this barcode`);
        }
      } else {
        toast.error(`Product with barcode ${barcode} not found`);
      }
    } catch (error) {
      console.error("Scan search error:", error);
      toast.error("Failed to search product by barcode");
    } finally {
      setIsSearching(false);
    }
  };

  const updateQuantity = (productId: string, changeVal: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + changeVal;
            if (newQuantity > item.stock) {
              toast.error("Not enough stock");
              return item;
            }
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate and trim customer details
    const trimmedCustomerName = customerName.trim();
    const trimmedCustomerPhone = customerPhone.trim();

    // Check if partial payment (credit) but no customer details
    if (change < 0 && (!trimmedCustomerName || !trimmedCustomerPhone)) {
      toast.error("Please enter valid customer details for partial payment / credit sales");
      return;
    }

    // Validate numeric inputs to prevent NaN or invalid values in saleData
    const parsedDiscountValue = parseFloat(discountValue) || 0;
    const parsedAmountReceived = amountReceived ? parseFloat(amountReceived) : 0;
    if (isNaN(parsedDiscountValue) || parsedDiscountValue < 0) {
      toast.error("Invalid discount value. Please enter a valid number.");
      return;
    }
    if (isNaN(parsedAmountReceived) || parsedAmountReceived < 0) {
      toast.error("Amount received cannot be negative");
      return;
    }
    if (isNaN(subtotal) || subtotal < 0) {
      toast.error("Invalid cart subtotal. Please check cart items.");
      return;
    }

    setIsProcessing(true);
    try {
      const saleData: CreateSaleData = {
        sales_type: change < 0 ? "credit" : "cash",
        amount_paid: parsedAmountReceived,
        total_amount: finalTotal,
        note: debtNote,
        discount_applied: discountAmount,
        customer_name: trimmedCustomerName,
        customer_phone: trimmedCustomerPhone,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product_name: item.name
        }))
      };

      console.log("Creating sale with data:", saleData);  // This should now print if validation passes
      console.log("Offline status:", offlineStatus.isOnline);  // Additional debug log

      await salesService.createSale(saleData);

      // Show appropriate success message based on online status
      if (offlineStatus.isOnline) {
        toast.success("Sale completed successfully!");
      } else {
        toast.success("Sale saved offline! Will sync when connection is restored.");
      }

      // Reset form state after successful checkout
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountValue("");
      setAmountReceived("");
      setDebtNote("");
      setSearchTerm("");
      setProducts([]);

      // Fetch notifications after sale to update low stock alerts, etc.
      if (offlineStatus.isOnline) {
        fetchNotifications();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);  // Enhanced logging for debugging
      console.error("Error response:", error.response?.data);  // Log backend error details
      toast.error(error.response?.data?.message || "Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };


  if (authLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-tour="sales-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales / POS</h1>
          <p className="text-gray-500 mt-1">Create new sales and manage transactions</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Offline Status Indicator */}
          <OfflineIndicator
            isOnline={offlineStatus.isOnline}
            pendingSales={offlineStatus.pendingSales}
            isSyncing={offlineStatus.isSyncing}
            syncError={offlineStatus.syncError}
            lastSyncTime={offlineStatus.lastSyncTime}
          />
          <Button
            onClick={() => setScannerOpen(true)}
            className="rounded-lg gap-2"
            style={{ background: colors.primaryDark }}
          >
            <Scan className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </Button>
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />

      {/* Offline Mode Banner */}
      {!offlineStatus.isOnline && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              Working offline
            </p>
            <p className="text-xs text-orange-600">
              {cachedProductsCount > 0
                ? `${cachedProductsCount} products available from cache. Sales will sync when connection is restored.`
                : "No cached products available. Connect to internet to load product data."
              }
            </p>
          </div>
          {offlineStatus.pendingSales > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {offlineStatus.pendingSales} pending
            </Badge>
          )}
        </div>
      )}

      {/* Sync Progress Banner */}
      {offlineStatus.isSyncing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              Syncing sales data...
            </p>
            <p className="text-xs text-blue-600">
              Uploading offline sales to server
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Search */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm" data-tour="sales-search">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Product Search</CardTitle>
                {!offlineStatus.isOnline && cachedProductsCount > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Database className="h-3 w-3" />
                    Cached data
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-12 h-12 rounded-xl border-gray-200"
                />
                {isSearching && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                  onClick={() => setScannerOpen(true)}
                >
                  <Scan className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchTerm && (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4">
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {products.length === 0 && !isSearching ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">
                        {!offlineStatus.isOnline && cachedProductsCount === 0
                          ? "No cached products available. Connect to internet to load products."
                          : "No products found"
                        }
                      </p>
                      {!offlineStatus.isOnline && cachedProductsCount > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Searching in {cachedProductsCount} cached products
                        </p>
                      )}
                    </div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity <= 0}
                        className={`flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-left ${product.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {!offlineStatus.isOnline && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                Cached
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Stock: {product.stock_quantity} • रू {typeof product.price === 'number' ? product.price : (product.price as any).Int64 || (product.price as any).Float64 || 0}
                          </p>
                        </div>
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${colors.primary}15` }}
                        >
                          <Plus className="h-5 w-5" style={{ color: colors.primary }} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm" data-tour="sales-cart">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${colors.primary}15` }}
                  >
                    <ShoppingCart className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  Cart
                </CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">{cart.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          रू {item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-gray-200"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold w-8 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-gray-200"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal:</span>
                  <span>रू {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-red-500">
                    <span>Discount:</span>
                    <span>- रू {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold" style={{ color: colors.primaryDark }}>
                    रू {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm" data-tour="sales-payment">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Discount</Label>
                <div className="flex gap-2">
                  <div className="flex bg-gray-100 rounded-lg p-1 h-12 w-32 shrink-0">
                    <button
                      className={`flex-1 rounded-md text-xs font-medium transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => setDiscountType('percent')}
                    >
                      %
                    </button>
                    <button
                      className={`flex-1 rounded-md text-xs font-medium transition-all ${discountType === 'amount' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => setDiscountType('amount')}
                    >
                      Fixed
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder={discountType === 'percent' ? "e.g. 10" : "e.g. 500"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-12 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountReceived" className="text-sm font-medium text-gray-700">Amount Received (रू)</Label>
                <div className="relative">
                  <Input
                    id="amountReceived"
                    type="number"
                    min={0}
                    placeholder="Enter amount given by customer"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className={`h-12 rounded-xl border-gray-200 pl-4 font-semibold text-lg ${parseFloat(amountReceived) < 0 ? "border-red-500 bg-red-50" : ""}`}
                  />
                  {amountReceived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                      onClick={() => setAmountReceived("")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {amountReceived && (
                <div className={`p-4 rounded-xl border flex justify-between items-center ${parseFloat(amountReceived) < 0 ? "bg-red-50 border-red-100" : (change >= 0 ? "bg-teal-50 border-teal-100" : "bg-orange-50 border-orange-100")}`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${parseFloat(amountReceived) < 0 ? "text-red-600" : (change >= 0 ? "text-teal-600" : "text-orange-600")}`}>
                      {parseFloat(amountReceived) < 0 ? "Error" : (change >= 0 ? "Change to Return" : "Remaining Due / Debt")}
                    </p>
                    <p className={`text-xl font-bold ${parseFloat(amountReceived) < 0 ? "text-red-700" : (change >= 0 ? "text-teal-700" : "text-orange-700")}`}>
                      {parseFloat(amountReceived) < 0 ? "Invalid Amount" : `रू ${Math.abs(change).toLocaleString()}`}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${parseFloat(amountReceived) < 0 ? "bg-red-100" : (change >= 0 ? "bg-teal-100" : "bg-orange-100")}`}>
                    {parseFloat(amountReceived) < 0 ? <AlertCircle className="h-5 w-5 text-red-600" /> : <Banknote className={`h-5 w-5 ${change >= 0 ? "text-teal-600" : "text-orange-600"}`} />}
                  </div>
                </div>
              )}

              {/* Dynamic Customer Form for Credit/Debt */}
              {change < 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>Partial payment detected. Please enter debtor details.</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-sm font-medium">Customer Name*</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-sm font-medium">Phone Number*</Label>
                    <Input
                      id="customerPhone"
                      placeholder="98XXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtNote" className="text-sm font-medium">Note (Optional)</Label>
                    <Input
                      id="debtNote"
                      placeholder="e.g. Promised to pay next week..."
                      value={debtNote}
                      onChange={(e) => setDebtNote(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[finalTotal, 50, 100, 500, 1000].map((denom, i) => (
                  <Button
                    key={`${denom}-${i}`}
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-gray-200 text-xs font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                    onClick={() => setAmountReceived(denom.toString())}
                  >
                    {denom === finalTotal ? "Exact" : `रू ${denom}`}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-12 rounded-xl font-semibold text-base mt-4"
                style={{ background: colors.primaryDark }}
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {change < 0 ? "Confirm Credit Sale" : "Complete Sale"}
                    {!offlineStatus.isOnline && (
                      <span className="ml-2 text-xs opacity-75">(Offline)</span>
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
