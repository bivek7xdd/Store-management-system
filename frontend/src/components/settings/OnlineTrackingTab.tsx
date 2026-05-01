import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Product } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Globe, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OnlineTrackingTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => inventoryService.getProducts(500),
  });

  const trackProductMutation = useMutation({
    mutationFn: ({ id, is_tracked }: { id: string; is_tracked: boolean }) =>
      inventoryService.updateProduct(id, { is_tracked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Online tracking updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update tracking");
    },
  });

  const handleTrackToggle = (id: string, is_tracked: boolean) => {
    trackProductMutation.mutate({ id, is_tracked });
  };

  const trackedProducts = products.filter(p => p.is_tracked);
  
  const searchResults = searchTerm.length >= 2 
    ? products.filter(p => 
        !p.is_tracked && 
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (p.barcode?.String || p.barcode || "").includes(searchTerm))
      )
    : [];

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Online Store Tracking</CardTitle>
            <CardDescription>Select products to display on your online storefront.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-8">
        
        {/* Search & Add Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Add Products to Online Store</h3>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search inventory by name or barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          
          {searchTerm.length >= 2 && (
            <Card className="border shadow-sm">
              <ScrollArea className="h-[200px]">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No matching un-tracked products found.</div>
                ) : (
                  <div className="p-2 space-y-1">
                    {searchResults.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Stock: {product.stock_quantity} • रू {typeof product.price === 'number' ? product.price : (product.price?.Int64 || 0)}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            handleTrackToggle(product.id, true);
                            setSearchTerm("");
                          }}
                          disabled={trackProductMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* Tracked Products List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Currently Tracked ({trackedProducts.length})</h3>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : trackedProducts.length === 0 ? (
            <div className="text-center p-8 border rounded-xl border-dashed bg-muted/10">
              <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No products are currently tracked online.</p>
              <p className="text-xs text-muted-foreground mt-1">Search and add products above to get started.</p>
            </div>
          ) : (
            <div className="border rounded-xl divide-y">
              {trackedProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-white hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted/30 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary/70" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>Stock: {product.stock_quantity}</span>
                        <span>•</span>
                        <span>रू {typeof product.price === 'number' ? product.price : (product.price?.Int64 || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleTrackToggle(product.id, false)}
                    disabled={trackProductMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
