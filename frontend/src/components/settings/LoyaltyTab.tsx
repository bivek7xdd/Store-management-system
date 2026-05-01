import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Award, Percent } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

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
        loyalty_discount_percentage: loyaltyData.loyalty_discount_percentage,
      });
      toast.success("Loyalty program settings updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update loyalty settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Heart className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Loyalty Program Settings</CardTitle>
            <CardDescription>Configure how customers earn rewards at checkout.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleUpdate}>
        <CardContent className="space-y-8 pt-8">
          
          {/* Progress Target */}
          <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-muted/50">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="progress_target" className="text-base font-semibold">Reward Threshold</Label>
                <p className="text-sm text-muted-foreground">Number of purchases required before a customer becomes eligible for a loyalty reward.</p>
                <div className="pt-2 max-w-[200px]">
                  <div className="relative">
                    <Input 
                      id="progress_target" 
                      type="number"
                      min="1"
                      step="1"
                      value={loyaltyData.loyalty_progress_target} 
                      onChange={e => setLoyaltyData({...loyaltyData, loyalty_progress_target: parseInt(e.target.value) || 0})} 
                      className="rounded-xl h-11 pr-16 focus-visible:ring-rose-500 text-lg font-medium"
                    />
                    <div className="absolute right-3 top-0 h-11 flex items-center text-sm font-medium text-muted-foreground pointer-events-none">
                      purchases
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Percentage */}
          <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-muted/50">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Percent className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="discount_percentage" className="text-base font-semibold">Reward Discount</Label>
                <p className="text-sm text-muted-foreground">The percentage discount applied to the customer's total bill once they reach the reward threshold.</p>
                <div className="pt-2 max-w-[200px]">
                  <div className="relative">
                    <Input 
                      id="discount_percentage" 
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={loyaltyData.loyalty_discount_percentage} 
                      onChange={e => setLoyaltyData({...loyaltyData, loyalty_discount_percentage: e.target.value})} 
                      className="rounded-xl h-11 pr-12 focus-visible:ring-emerald-500 text-lg font-medium"
                    />
                    <div className="absolute right-4 top-0 h-11 flex items-center text-lg font-medium text-muted-foreground pointer-events-none">
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="bg-muted/10 border-t mt-4 py-4 px-6 flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="rounded-xl h-11 px-8 font-semibold shadow-md active:scale-95 transition-transform bg-rose-600 hover:bg-rose-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Loyalty Settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
