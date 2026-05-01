import { useState, useEffect } from "react";
import { Search, Plus, Minus, ShoppingCart, Trash2, Scan, Loader2, WifiOff, Database, PartyPopper, UserCheck, User as UserIcon, Split, Calculator } from "lucide-react";
import { inventoryService } from "@/services/inventory";
import { salesService, CreateSaleData } from "@/services/sales";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureTooltip } from "@/components/FeatureTooltip";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { Product, OfflineStatus } from "@/types";
import { db } from "@/db/db";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import confetti from "canvas-confetti";
import { CustomerSelection } from "@/components/pos/CustomerSelection";
import { SplitPaymentDialog, PaymentEntry } from "@/components/pos/SplitPaymentDialog";
import { customerService } from "@/services/customerService";
import { userService } from "@/services/userService";
import { Customer } from "@/types";
import { cn } from "@/lib/utils";
import { VariantSelectionDialog } from "@/components/pos/VariantSelectionDialog";
import { ProductVariant } from "@/types";

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const inputCls = "w-full h-11 bg-[#111111] border border-[#1A1A1A] rounded-[2px] transition-colors focus:outline-none focus:border-[#303030] text-white px-4 text-[13px] placeholder:text-[#666666]";

export default function Sales() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [debtNote, setDebtNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(syncService.getStatus());
  const [cachedProductsCount, setCachedProductsCount] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(() => {
    const saved = localStorage.getItem("storeflow_confetti");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [variantSelectionProduct, setVariantSelectionProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState({
    target: 5,
    discount: "10.00"
  });

  useEffect(() => {
    localStorage.setItem("storeflow_confetti", JSON.stringify(showConfetti));
  }, [showConfetti]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discountAmount = discountType === "percent"
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : (parseFloat(discountValue) || 0);

  const finalTotal = Math.max(0, subtotal - discountAmount);

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

  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        const response = await userService.getStore();
        const store = response.data;
        if (store) {
          setLoyaltySettings({
            target: store.loyalty_progress_target || 5,
            discount: store.loyalty_discount_percentage || "10.00"
          });
        }
      } catch (error) {
        console.error("Failed to fetch loyalty settings:", error);
      }
    };
    if (isAuthenticated) {
      fetchLoyaltySettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const search = async () => {
      if (!searchTerm) {
        setProducts([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await inventoryService.searchProducts(searchTerm);
        setProducts(results || []);
      } catch (error) {
        console.error("Search error:", error);
        // Fallback search directly in Dexie if service fails
        try {
          const cachedProducts = await db.products
            .where('name')
            .startsWithIgnoreCase(searchTerm)
            .limit(20)
            .toArray();
          setProducts(cachedProducts || []);
          toast.info("Showing cached products (Search Error)");
        } catch (fallbackError) {
          console.error("Fallback search error:", fallbackError);
          setProducts([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, offlineStatus.isOnline]);

  // Remove the stale no-op fetchCatalog since we now enrich search results directly.

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.name !== 'Guest') {
      const isEligible = customerService.isEligibleForLoyaltyDiscount(selectedCustomer.purchase_count, loyaltySettings.target);
      if (isEligible && !loyaltyApplied) {
        setDiscountType('percent');
        setDiscountValue(parseFloat(loyaltySettings.discount).toString());
        setLoyaltyApplied(true);
        toast.success(`Loyalty Reward: ${parseFloat(loyaltySettings.discount)}% discount auto-applied for ${selectedCustomer.name}!`, {
            icon: '🎁',
            duration: 5000
        });
      }
    } else {
        if (loyaltyApplied) {
            setDiscountValue("");
            setLoyaltyApplied(false);
        }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (discountValue === "" && loyaltyApplied) {
        setLoyaltyApplied(false);
    }
  }, [discountValue]);

  const addToCart = async (product: Product, variant?: ProductVariant) => {
    // If product.variants hasn't been hydrated yet (e.g. scan path bypassed search
    // enrichment), do a quick Dexie lookup before deciding whether to open the modal.
    let resolvedProduct = product;
    if (!variant && product.variants === undefined) {
      const cachedVariants = await db.product_variants
        .where('product_id')
        .equals(product.id)
        .toArray();
      if (cachedVariants.length > 0) {
        resolvedProduct = { ...product, variants: cachedVariants };
      }
    }

    if (!variant && resolvedProduct.variants && resolvedProduct.variants.length > 0) {
      setVariantSelectionProduct(resolvedProduct);
      setShowVariantModal(true);
      return;
    }

    const itemKey = variant ? `${product.id}-${variant.id}` : product.id;
    const existing = cart.find((item) => (variant ? item.variantId === variant.id : item.productId === product.id && !item.variantId));
    
    const price = variant ? variant.selling_price : (typeof product.price === 'number' ? product.price : (product.price as any).Int64 || (product.price as any).Float64 || 0);
    const stock = variant ? variant.stock_level : product.stock_quantity;
    const displayName = variant ? `${product.name} - ${Object.values(variant.attributes).join(" / ")}` : product.name;

    if (existing) {
      if (existing.quantity >= stock) {
        toast.error("Not enough stock");
        return;
      }
      setCart(
        cart.map((item) =>
          (variant ? item.variantId === variant.id : item.productId === product.id && !item.variantId)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (stock <= 0) {
        toast.error("Product out of stock");
        return;
      }
      setCart([
        ...cart,
        {
          productId: product.id,
          variantId: variant?.id,
          name: displayName,
          price: price,
          quantity: 1,
          stock: stock
        },
      ]);
    }
    toast.success(`${displayName} added to cart`);
  };

  const handleScanSuccess = async (barcode: string) => {
    setIsSearching(true);
    try {
      let results: Product[] = [];
      if (offlineStatus.isOnline) {
        results = await inventoryService.searchProducts(barcode);
      } else {
        const allProducts = await db.products.toArray();
        results = allProducts.filter(p => {
          const barcodeStr = typeof p.barcode === 'string'
            ? p.barcode
            : (p.barcode && 'Valid' in p.barcode && p.barcode.Valid ? p.barcode.String : '');
          return barcodeStr === barcode;
        });
      }

      // Check if barcode matches a variant SKU or barcode directly
      if (results.length === 0) {
         let matchedVariants = await db.product_variants.where('sku').equals(barcode).toArray();
         if (matchedVariants.length === 0) {
             matchedVariants = await db.product_variants.where('barcode').equals(barcode).toArray();
         }
         
         if (matchedVariants.length === 1) {
            const parent = await db.products.get(matchedVariants[0].product_id);
            if (parent) {
               addToCart(parent, matchedVariants[0]);
               setIsSearching(false);
               return;
            }
         }
      }

      if (results && results.length > 0) {
        if (results.length === 1) {
          addToCart(results[0]);
          setSearchTerm("");
        } else {
          setSearchTerm(barcode);
          toast.info(`Found ${results.length} matched products`);
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

  const updateQuantity = (key: string, changeVal: number) => {
    setCart(
      cart
        .map((item) => {
          // key is either variantId (for variant items) or productId (for plain items)
          const matches = item.variantId ? item.variantId === key : item.productId === key;
          if (matches) {
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

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(cart.filter((item) => (variantId ? item.variantId !== variantId : item.productId !== productId || item.variantId !== undefined)));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!selectedCustomer) {
      setShowCustomerModal(true);
      toast.error("Identify the customer first");
      return;
    }
    setPayments([{ type: 'cash', amount: finalTotal }]);
    setShowSplitPaymentModal(true);
  };

  const finalizeCheckout = async (confirmedPayments: PaymentEntry[], debtInfo?: { dueDate: string; notes: string }) => {
    const parsedDiscountValue = parseFloat(discountValue) || 0;
    const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (isNaN(parsedDiscountValue) || parsedDiscountValue < 0) {
      toast.error("Invalid discount value");
      return;
    }
    setIsProcessing(true);
    try {
      let salesType: 'cash' | 'credit' | 'online' | 'mixed' = 'cash';
      if (confirmedPayments.length > 1) {
        salesType = 'mixed';
      } else if (confirmedPayments.length === 1) {
        salesType = confirmedPayments[0].type;
      }
      if (totalPaid < finalTotal) {
        salesType = 'credit';
      }

      const saleData: CreateSaleData = {
        sales_type: salesType,
        amount_paid: totalPaid,
        total_amount: finalTotal,
        payments: confirmedPayments.map(p => ({
            amount: p.amount,
            payment_type: p.type,
            provider: p.provider
        })),
        note: debtInfo?.notes || debtNote,
        due_date: debtInfo?.dueDate,
        discount_applied: discountAmount,
        customer_id: selectedCustomer!.id,
        items: cart.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product_name: item.name
        }))
      };

      await salesService.createSale(saleData);

      if (offlineStatus.isOnline) {
        toast.success("Sale completed successfully!");
        if (showConfetti) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#DA291C", "#FFFFFF", "#F6E500"],
          });
        }
      } else {
        toast.success("Sale saved offline! Will sync automatically.");
      }

      setCart([]);
      setSelectedCustomer(null);
      setDiscountValue("");
      setAmountReceived("");
      setDebtNote("");
      setSearchTerm("");
      setProducts([]);

      if (offlineStatus.isOnline) {
        fetchNotifications();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestCheckout = async () => {
    const guest = await customerService.getGuestCustomer();
    if (guest) {
      setSelectedCustomer(guest);
      setShowCustomerModal(false);
      toast.success("Guest Checkout Active");
    } else {
      toast.error("Guest account not initialized.");
    }
  };

  if (authLoading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4">
      <Loader2 className="animate-spin text-[#DA291C] h-8 w-8" />
      <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#888888]">Initializing Terminal</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Terminal</p>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Sales / POS</h1>
        </div>
        <div className="flex items-center gap-3">
          <OfflineIndicator
            isOnline={offlineStatus.isOnline}
            pendingSales={offlineStatus.pendingSales}
            isSyncing={offlineStatus.isSyncing}
            syncError={offlineStatus.syncError}
            lastSyncTime={offlineStatus.lastSyncTime}
          />
          <button
            onClick={() => setShowConfetti(!showConfetti)}
            className={cn(
              "h-9 w-9 rounded-[2px] border flex items-center justify-center transition-all",
              showConfetti ? "text-[#DA291C] border-[#DA291C]/30 bg-[#DA291C]/5" : "text-[#888888] border-[#1A1A1A] hover:text-white"
            )}
            title="Celebration Effects"
          >
            <PartyPopper className={`h-4 w-4 ${showConfetti ? "fill-[#DA291C]/10" : ""}`} />
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="h-9 px-4 rounded-[2px] bg-white text-black text-[12px] font-bold uppercase tracking-[1px] flex items-center gap-2 hover:bg-[#F2F2F2] transition-colors"
          >
            <Scan className="h-4 w-4" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />

      {/* Offline Mode Banner */}
      {!offlineStatus.isOnline && (
        <div className="border border-[#F13A2C]/30 bg-[#F13A2C]/5 rounded-[2px] p-4 flex items-center gap-4">
          <WifiOff className="h-5 w-5 text-[#F13A2C]" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Offline Persistence Active</p>
            <p className="text-[11px] text-[#F13A2C] uppercase tracking-[0.5px] mt-0.5 opacity-80">
              {cachedProductsCount > 0
                ? `${cachedProductsCount} products indexed locally. Sales will sync on restoration.`
                : "No local cache detected. Internet required for product indexing."
              }
            </p>
          </div>
          {offlineStatus.pendingSales > 0 && (
            <div className="px-2 py-0.5 bg-[#F13A2C] text-white text-[10px] font-bold uppercase tracking-[1px] rounded-[2px]">
              {offlineStatus.pendingSales} Queue
            </div>
          )}
        </div>
      )}

      {/* Sync Progress Banner */}
      {offlineStatus.isSyncing && (
        <div className="border border-blue-500/30 bg-blue-500/5 rounded-[2px] p-4 flex items-center gap-4">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Data Synchronization in Progress</p>
            <p className="text-[11px] text-blue-400 uppercase tracking-[0.5px] mt-0.5 opacity-80">
              Uploading terminal transaction queue to central server...
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Search & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px] mb-3 block">Product Search Terminal</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
              <input
                placeholder="INPUT PRODUCT NAME OR SCAN SERIAL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(inputCls, "h-14 pl-12 pr-12 text-[15px] focus:border-[#DA291C]")}
              />
              {isSearching && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#DA291C]" />
                </div>
              )}
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-[#888888] hover:text-[#DA291C] transition-colors"
                onClick={() => setScannerOpen(true)}
              >
                <Scan className="h-4 w-4" />
              </button>
            </div>
          </div>

          {searchTerm && (
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#CCCCCC] uppercase tracking-[1px]">Results Archive</p>
                {!offlineStatus.isOnline && cachedProductsCount > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#888888] uppercase font-bold tracking-[0.5px]">
                    <Database className="h-3 w-3" />
                    Local Vault Data
                  </div>
                )}
              </div>
              <div className="divide-y divide-[#1A1A1A] max-h-[500px] overflow-y-auto custom-scrollbar">
                {products.length === 0 && !isSearching ? (
                  <div className="text-center py-16">
                    <p className="text-[12px] font-medium text-[#666666] uppercase tracking-[2px]">No Matches In Archive</p>
                  </div>
                ) : (
                  products.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    const isDisabled = hasVariants
                      ? product.variants!.every(v => v.stock_level <= 0)
                      : product.stock_quantity <= 0;

                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={isDisabled}
                        className="w-full flex items-center justify-between p-5 hover:bg-[#1A1A1A] transition-all text-left group disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-[#0A0A0A] border border-[#303030] rounded-[2px] flex items-center justify-center">
                             <p className="text-[14px] font-black text-white">{product.name.charAt(0).toUpperCase()}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[14px] text-white uppercase tracking-tight group-hover:text-[#DA291C] transition-colors">{product.name}</p>
                              {hasVariants && (
                                <div className="px-1.5 py-0.5 text-[8px] font-black border border-[#DA291C]/40 text-[#DA291C] uppercase rounded-[1px] tracking-[1px]">
                                  {product.variants!.length} VAR
                                </div>
                              )}
                              {!offlineStatus.isOnline && (
                                <div className="px-1 text-[8px] font-bold border border-[#555555] text-[#888888] uppercase rounded-[1px]">Vault</div>
                              )}
                            </div>
                            <p className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.5px] mt-0.5">
                              {hasVariants
                                ? `${product.variants!.length} variations available`
                                : `Index: ${product.stock_quantity} UNIT • रू ${(typeof product.price === 'number' ? product.price : (product.price as any).Int64 || (product.price as any).Float64 || 0).toLocaleString()}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="h-9 w-9 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center group-hover:bg-[#DA291C] group-hover:border-[#DA291C] transition-all">
                          <Plus className="h-4 w-4 text-[#CCCCCC] group-hover:text-white" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart Section */}
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
            <div className="p-6 border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-white/5 border border-white/10 rounded-[2px] flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <p className="text-[13px] font-bold text-white uppercase tracking-[1px]">Active Cart</p>
              </div>
              <div className="h-6 px-2 bg-[#1A1A1A] rounded-[2px] flex items-center">
                <span className="text-[10px] font-bold text-[#CCCCCC] uppercase tracking-[1px]">{cart.length} UNITS</span>
              </div>
            </div>
            
            <div className="px-6 py-6 border-b border-[#1A1A1A] min-h-[160px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <ShoppingCart className="h-8 w-8 text-[#1A1A1A] mb-4" />
                  <p className="text-[10px] font-bold text-[#666666] uppercase tracking-[2px]">Empty Terminal Cart</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {cart.map((item) => (
                    <div key={item.variantId ? `v-${item.variantId}` : `p-${item.productId}`} className="flex items-center justify-between p-3 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#303030] transition-colors group">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-[12px] text-white uppercase tracking-tight truncate">{item.name}</p>
                        <p className="text-[10px] text-[#888888] font-medium uppercase tracking-[0.5px]">
                          रू {item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.variantId || item.productId, -1)}
                          className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#888888] hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[12px] font-bold text-white w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId || item.productId, 1)}
                          className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#888888] hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="h-7 w-7 rounded-[2px] flex items-center justify-center text-[#888888] hover:text-[#DA291C]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0D0D0D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px]">Subtotal Archive</span>
                <span className="text-[13px] font-bold text-[#CCCCCC]">रू {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[1.5px]">Loyalty Deduction</span>
                  <span className="text-[13px] font-bold text-emerald-500">- रू {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Gross Total</span>
                <span className="text-[24px] font-bold text-white tracking-tight">रू {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Selection Identity */}
          <div className={cn(
            "bg-[#111111] border rounded-[2px] overflow-hidden transition-all duration-300",
            selectedCustomer ? "border-[#DA291C]/30" : "border-[#1A1A1A]"
          )}>
            <div className="p-4 border-b border-[#1A1A1A] flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px]">Identity Verification</p>
              {selectedCustomer && (
                 <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="text-[9px] font-bold text-[#DA291C] uppercase tracking-[1px] hover:underline"
                 >
                  Shift
                 </button>
              )}
            </div>
            <div className="p-5">
              {selectedCustomer ? (
                <div className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="h-10 w-10 bg-[#0A0A0A] border border-[#DA291C]/20 rounded-[2px] flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-[#DA291C]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[13px] text-white uppercase tracking-tight truncate">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-[#888888] font-medium tracking-[0.5px] uppercase">{selectedCustomer.phone}</p>
                      <div className="h-3 px-1.5 bg-[#DA291C] text-white text-[8px] font-black uppercase flex items-center rounded-[1px]">
                        {selectedCustomer.loyalty_status}
                      </div>
                    </div>
                    {selectedCustomer.name !== 'Guest' && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between items-center pr-1">
                          <span className="text-[8px] font-black uppercase text-[#555555]">Reward Progress</span>
                          <span className="text-[8px] font-black uppercase text-[#DA291C]">
                            {selectedCustomer.purchase_count % loyaltySettings.target} / {loyaltySettings.target}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#DA291C] transition-all duration-500" 
                            style={{ width: `${((selectedCustomer.purchase_count % loyaltySettings.target) / loyaltySettings.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full h-12 border border-dashed border-[#303030] hover:border-[#DA291C] hover:bg-[#DA291C]/5 transition-all text-[#888888] hover:text-[#DA291C] rounded-[2px] text-[11px] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  Select Entity
                </button>
              )}
            </div>
          </div>

          {/* Payment Terminal Section */}
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6 space-y-6">
            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px]">Settlement Parameters</p>
            
            <div className="space-y-4">
              {/* Discount Entry */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[1px]">Adjustment Type</label>
                <div className="flex gap-2">
                  <div className="flex h-11 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] p-1 flex-1 max-w-[120px]">
                    <button
                      className={cn(
                        "flex-1 rounded-[1px] text-[10px] font-bold transition-all uppercase",
                        discountType === 'percent' ? 'bg-[#DA291C] text-white' : 'text-[#666666] hover:text-white'
                      )}
                      onClick={() => setDiscountType('percent')}
                    >
                      % Rate
                    </button>
                    <button
                      className={cn(
                        "flex-1 rounded-[1px] text-[10px] font-bold transition-all uppercase",
                        discountType === 'amount' ? 'bg-[#DA291C] text-white' : 'text-[#666666] hover:text-white'
                      )}
                      onClick={() => setDiscountType('amount')}
                    >
                      Flat
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className={cn(inputCls, "flex-1 text-center font-bold text-[14px]")}
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
            <div className="grid grid-cols-2 gap-2">
                {[500, 1000].map((denom) => (
                  <button
                    key={denom}
                    className="h-10 border border-[#1A1A1A] hover:border-[#303030] text-[#888888] hover:text-white rounded-[2px] text-[11px] font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                        setPayments([{ type: 'cash', amount: denom }]);
                        finalizeCheckout([{ type: 'cash', amount: denom }]);
                    }}
                  >
                    रू {denom} Cash
                  </button>
                ))}
                <button
                  onClick={handleCheckout}
                  className="col-span-2 h-10 border border-[#DA291C]/30 bg-[#DA291C]/5 text-[#DA291C] hover:bg-[#DA291C] hover:text-white rounded-[2px] text-[11px] font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2"
                >
                  <Split className="h-4 w-4" />
                  Split Settlement
                </button>
              </div>

              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full h-16 bg-[#DA291C] hover:bg-[#B01E0A] text-white rounded-[2px] font-black text-[14px] uppercase tracking-[2px] flex items-center justify-center gap-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl shadow-[#DA291C]/5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Archive Recording...
                  </>
                ) : (
                  <>
                    Authorize Settlement
                    <Calculator className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-all group-hover:scale-110" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomerSelection 
        open={showCustomerModal} 
        onOpenChange={setShowCustomerModal}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerModal(false);
          toast.success(`Identity Verified: ${customer.name}`);
        }}
        onGuestCheckout={handleGuestCheckout}
      />
      <SplitPaymentDialog
        key={showSplitPaymentModal ? 'open' : 'closed'}
        open={showSplitPaymentModal}
        onOpenChange={setShowSplitPaymentModal}
        totalDue={finalTotal}
        onConfirm={finalizeCheckout}
        initialPayments={payments}
      />
      <VariantSelectionDialog
        open={showVariantModal}
        onOpenChange={setShowVariantModal}
        product={variantSelectionProduct}
        onSelect={(variant) => {
          if (variantSelectionProduct) {
            addToCart(variantSelectionProduct, variant);
          }
        }}
      />
    </div>
  );
}
