import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Award, Percent } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function LoyaltyTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({
    loyalty_progress_target: 5,
    loyalty_discount_percentage: "10.00",
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await userService.getStore();
        const store = response.data;
        setLoyaltyData({
          loyalty_progress_target: store.loyalty_progress_target || 5,
          loyalty_discount_percentage: store.loyalty_discount_percentage || "10.00",
        });
      } catch (error) {
        console.error("Failed to fetch store info:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchStore();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateStore({
        loyalty_progress_target: loyaltyData.loyalty_progress_target,
        loyalty_discount_percentage: String(loyaltyData.loyalty_discount_percentage),
      });
      toast.success("Loyalty program settings updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update loyalty settings");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-12 bg-transparent border border-[#1A1A1A] rounded-[2px] px-4 font-bold text-lg text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors";
  const labelCls = "text-[10px] font-bold uppercase tracking-[2px] text-[#555555]";

  if (fetching) {
    return (
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#DA291C]" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
      <div className="p-8 border-b border-[#1A1A1A] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold uppercase tracking-[2px] text-white">Loyalty Protocol</h3>
          <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mt-1">Configure automated customer reward logic.</p>
        </div>
        <div className="h-10 w-10 bg-[#DA291C]/10 border border-[#DA291C]/20 flex items-center justify-center rounded-[2px]">
          <Heart className="h-5 w-5 text-[#DA291C]" />
        </div>
      </div>
      
      <form onSubmit={handleUpdate}>
        <div className="p-8 space-y-10">
          
          {/* Progress Target */}
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-[#DA291C]" />
                <Label htmlFor="progress_target" className={labelCls}>Reward Threshold</Label>
              </div>
              <p className="text-[11px] text-[#888888] uppercase tracking-[0.5px] leading-relaxed">
                Define the quantity of finalized transactions required to trigger a VIP status reward for a customer entity.
              </p>
            </div>
            <div className="relative max-w-[240px]">
              <input 
                id="progress_target" 
                type="number"
                min="1"
                step="1"
                value={loyaltyData.loyalty_progress_target} 
                onChange={e => setLoyaltyData({...loyaltyData, loyalty_progress_target: parseInt(e.target.value) || 0})} 
                className={cn(inputCls, "w-full pr-24")}
              />
              <div className="absolute right-4 top-0 h-12 flex items-center text-[10px] font-bold text-[#555555] uppercase tracking-[1px] pointer-events-none">
                UNITS
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1A1A1A]" />

          {/* Discount Percentage */}
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-[#DA291C]" />
                <Label htmlFor="discount_percentage" className={labelCls}>Loyalty Rebate Rate</Label>
              </div>
              <p className="text-[11px] text-[#888888] uppercase tracking-[0.5px] leading-relaxed">
                The fixed percentage value deducted from the gross total once the target threshold is validated at checkout.
              </p>
            </div>
            <div className="relative max-w-[240px]">
              <input 
                id="discount_percentage" 
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={loyaltyData.loyalty_discount_percentage} 
                onChange={e => setLoyaltyData({...loyaltyData, loyalty_discount_percentage: e.target.value})} 
                className={cn(inputCls, "w-full pr-12")}
              />
              <div className="absolute right-5 top-0 h-12 flex items-center text-lg font-bold text-[#DA291C] pointer-events-none">
                %
              </div>
            </div>
          </div>

        </div>

        <div className="bg-[#111111] border-t border-[#1A1A1A] p-6 flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="rounded-[2px] h-12 px-10 font-bold uppercase text-[11px] tracking-[2px] bg-[#DA291C] text-white hover:bg-[#B01E0A] transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : "Save Protocol"}
          </Button>
        </div>
      </form>
    </div>
  );
}
