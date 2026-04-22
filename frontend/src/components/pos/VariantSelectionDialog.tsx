import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelectionDialog({ open, onOpenChange, product, onSelect }: VariantSelectionDialogProps) {
  if (!product || !product.variants) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border border-black rounded-[2px] bg-white shadow-2xl">
        <DialogHeader className="p-6 border-b border-black bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black/5 flex items-center justify-center rounded-[2px] border border-black/10">
              <Package className="h-5 w-5 text-black" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-black uppercase tracking-tight">
                Select Variation
              </DialogTitle>
              <p className="text-zinc-500 text-[11px] mt-0.5 uppercase tracking-widest font-medium">
                {product.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {product.variants.map((v) => {
            const outOfStock = v.stock_level <= 0;
            const attrString = Object.entries(v.attributes || {})
              .map(([_, val]) => val)
              .join(" / ");

            return (
              <button
                key={v.id}
                disabled={outOfStock}
                onClick={() => {
                  onSelect(v);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-[1px] transition-all group border border-transparent",
                  outOfStock ? "opacity-40 grayscale cursor-not-allowed" : "hover:border-black hover:bg-zinc-50"
                )}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-bold text-[14px] text-black uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                    {attrString}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-zinc-500 font-mono">
                      SKU: {v.sku}
                    </span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold border-zinc-200 text-zinc-600 bg-zinc-50">
                      {v.stock_level} IN STOCK
                    </Badge>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-black text-[15px] text-black">
                    रू {v.selling_price.toLocaleString()}
                  </span>
                  {!outOfStock && (
                    <div className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Check className="h-4 w-4 text-black" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-black/5 text-center">
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[2px]">
            Absolute inventory integrity enforced
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
