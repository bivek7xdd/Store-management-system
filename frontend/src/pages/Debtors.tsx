import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone, Users, Wallet, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { debtService, Debt } from "@/services/debts";
import { Skeleton } from "@/components/ui/skeleton";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Debtors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await debtService.getDebts();
      setDebts(data);
    } catch (error) {
      toast.error("Failed to fetch debts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = debts.filter(
    (debtor) =>
      (debtor.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (debtor.customer_phone || "").includes(searchTerm)
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + (parseFloat(d.amount_owed) - parseFloat(d.amount_paid)), 0);

  const handleSendReminder = (debtor: Debt) => {
    if (!debtor.customer_phone) {
      toast.error("No phone number for this customer");
      return;
    }
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    const message = `नमस्ते ${debtor.customer_name || 'Customer'}, तपाईंको बाँकी रकम रू ${outstanding.toLocaleString()} छ। कृपया यथाशीघ्र भुक्तान गर्नुहोस्। धन्यवाद!`;
    const whatsappUrl = `https://wa.me/977${debtor.customer_phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const handleMarkPaid = async (debtor: Debt) => {
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    if (outstanding <= 0) return;

    if (confirm(`Mark ${debtor.customer_name}'s debt of ${outstanding} as fully paid?`)) {
      try {
        await debtService.updateDebt(debtor.id, {
          amount_paid: parseFloat(debtor.amount_owed), // Pay full
          status: 'paid'
        });
        toast.success("Debt marked as paid");
        fetchDebts();
      } catch (error) {
        toast.error("Failed to update debt");
      }
    }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debtors / Credit Management</h1>
          <p className="text-gray-500 mt-1">Track outstanding payments from customers</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchDebts}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm" style={{ background: colors.primaryDark }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Total Outstanding</p>
                  <p className="text-3xl font-bold mt-1">रू {totalOutstanding.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-gray-900">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Debtors</p>
                  <p className="text-3xl font-bold mt-1">{debts.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Debtors List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 w-full">
                    <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredDebtors.map((debtor) => {
            const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
            return (
              <Card key={debtor.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: colors.primary }}
                      >
                        {(debtor.customer_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">{debtor.customer_name || "Unknown Customer"}</CardTitle>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {debtor.customer_phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={outstanding > 0 ? "outline" : "default"} className={`${outstanding > 0 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-green-100 text-green-700"}`}>
                      {outstanding > 0 ? "Pending" : "Paid"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="text-gray-500">Outstanding Amount</span>
                      <span className="font-bold text-red-600">
                        रू {outstanding.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium text-gray-700">
                        {new Date(debtor.updated_at).toLocaleDateString("en-NP")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-900 hover:text-gray-900"
                      onClick={() => handleSendReminder(debtor)}
                      disabled={outstanding <= 0}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Remind
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-lg"
                      style={{ background: colors.primaryDark }}
                      onClick={() => handleMarkPaid(debtor)}
                      disabled={outstanding <= 0}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {filteredDebtors.length === 0 && !loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No debtors found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
