import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Minus, ShoppingCart, Trash2, Scan, CreditCard, Banknote } from "lucide-react";
import { mockProducts } from "@/lib/mockData";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  const addToCart = (product: typeof mockProducts[0]) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
        },
      ]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + change;
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paymentType === "credit" && (!customerName || !customerPhone)) {
      toast.error("Please enter customer details for credit sales");
      return;
    }

    toast.success("Sale completed successfully!");
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentType("cash");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales / POS</h1>
        <p className="text-gray-500 mt-1">Create new sales and manage transactions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Search */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Product Search</CardTitle>
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
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
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No products found
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-left"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            Stock: {product.stock} • रू {product.sellingPrice}
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
          <Card className="border-0 shadow-sm">
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

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold" style={{ color: colors.primaryDark }}>
                    रू {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as "cash" | "credit")}>
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                  <TabsTrigger value="cash" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </TabsTrigger>
                  <TabsTrigger value="credit" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <CreditCard className="h-4 w-4" />
                    Credit
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cash" className="mt-4">
                  <p className="text-sm text-gray-500 p-3 rounded-lg bg-gray-50">
                    Customer will pay <span className="font-semibold text-gray-900">रू {total.toLocaleString()}</span> in cash
                  </p>
                </TabsContent>

                <TabsContent value="credit" className="space-y-4 mt-4">
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
                </TabsContent>
              </Tabs>

              <Button
                className="w-full h-12 rounded-xl font-semibold text-base"
                style={{ background: colors.primaryDark }}
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
