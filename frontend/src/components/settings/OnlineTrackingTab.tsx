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
import { cn } from "@/lib/utils";

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

  const inputCls = "h-12 bg-transparent border border-[#1A1A1A] rounded-[2px] px-4 font-bold text-sm text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors";
  const labelCls = "text-[10px] font-bold uppercase tracking-[2px] text-[#555555]";

  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
      <div className="p-8 border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold uppercase tracking-[2px] text-white">Online Storefront Protocol</h3>
          <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mt-1">Configure products for digital synchronization.</p>
        </div>
        <div className="h-10 w-10 bg-[#DA291C]/10 border border-[#DA291C]/20 flex items-center justify-center rounded-[2px]">
          <Globe className="h-5 w-5 text-[#DA291C]" />
        </div>
      </div>
      
      <div className="p-8 space-y-10">
        
        {/* Search & Add Section */}
        <div className="space-y-4">
          <h3 className={labelCls}>Sync New Entity</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555555]" />
            <input 
              placeholder="SEARCH BY NAME OR BARCODE..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(inputCls, "w-full pl-11 uppercase")}
            />
          </div>
          
          {searchTerm.length >= 2 && (
            <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0F0F0F] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <ScrollArea className="h-[240px]">
                {searchResults.length === 0 ? (
                  <div className="p-10 text-center text-[10px] font-bold text-[#333333] uppercase tracking-[2px]">No matching records.</div>
                ) : (
                  <div className="divide-y divide-[#1A1A1A]">
                    {searchResults.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors group">
                        <div className="space-y-1">
                          <div className="font-bold text-[11px] text-white uppercase tracking-[1px]">{product.name}</div>
                          <div className="text-[9px] font-bold text-[#555555] uppercase tracking-[1.5px]">
                            QUANTITY: {product.stock_quantity} • UNIT_PRICE: रू {typeof product.price === 'number' ? product.price : (product.price?.Int64 || 0)}
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="h-8 rounded-[2px] border border-[#333333] hover:border-[#DA291C] hover:text-[#DA291C] hover:bg-[#DA291C]/5 transition-all text-[10px] font-bold uppercase tracking-[1.5px]"
                          onClick={() => {
                            handleTrackToggle(product.id, true);
                            setSearchTerm("");
                          }}
                          disabled={trackProductMutation.isPending}
                        >
                          <Plus className="h-3 w-3 mr-1.5" /> Initialize
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Tracked Products List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={labelCls}>Active Digital Nodes ({trackedProducts.length})</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-12 bg-[#0F0F0F] border border-[#1A1A1A] rounded-[2px]">
              <Loader2 className="h-5 w-5 animate-spin text-[#DA291C]" />
            </div>
          ) : trackedProducts.length === 0 ? (
            <div className="text-center p-16 border border-[#1A1A1A] border-dashed rounded-[2px] bg-[#0F0F0F]">
              <Globe className="h-8 w-8 text-[#1A1A1A] mx-auto mb-4" />
              <p className="text-[10px] font-bold text-[#333333] uppercase tracking-[2px]">Offline Mode: No Active Nodes</p>
              <p className="text-[9px] text-[#222222] uppercase tracking-[1px] mt-1">Search and initialize product entities for online tracking.</p>
            </div>
          ) : (
            <div className="border border-[#1A1A1A] rounded-[2px] divide-y divide-[#1A1A1A]">
              {trackedProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-5 bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 bg-[#1A1A1A] border border-[#222222] rounded-[2px] flex items-center justify-center">
                      <Globe className="h-4 w-4 text-[#DA291C]" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[12px] text-white uppercase tracking-[1px]">{product.name}</div>
                      <div className="text-[9px] font-bold text-[#555555] uppercase tracking-[1.5px] flex gap-3">
                        <span>STOCK: {product.stock_quantity}</span>
                        <span className="text-[#222222]">|</span>
                        <span>VALUE: रू {typeof product.price === 'number' ? product.price : (product.price?.Int64 || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-[#333333] hover:text-[#DA291C] hover:bg-[#DA291C]/5 rounded-[2px] transition-all"
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
      </div>
    </div>
  );
}
