import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone, Users, Wallet } from "lucide-react";
import { mockDebtors } from "@/lib/mockData";
import { useState } from "react";
import { toast } from "sonner";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

export default function Debtors() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDebtors = mockDebtors.filter(
    (debtor) =>
      debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.phone.includes(searchTerm)
  );

  const totalOutstanding = mockDebtors.reduce((sum, d) => sum + d.outstandingAmount, 0);

  const handleSendReminder = (debtor: typeof mockDebtors[0]) => {
    const message = `नमस्ते ${debtor.name}, तपाईंको बाँकी रकम रू ${debtor.outstandingAmount.toLocaleString()} छ। कृपया यथाशीघ्र भुक्तान गर्नुहोस्। धन्यवाद!`;
    const whatsappUrl = `https://wa.me/977${debtor.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Debtors / Credit Management</h1>
        <p className="text-gray-500 mt-1">Track outstanding payments from customers</p>
      </div>

      {/* Summary Card */}
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
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Users className="h-5 w-5 text-white/80" />
                <p className="text-sm text-white/80">Total Debtors</p>
              </div>
              <p className="text-3xl font-bold mt-1">{mockDebtors.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
        {filteredDebtors.map((debtor) => (
          <Card key={debtor.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ background: colors.primary }}
                  >
                    {debtor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">{debtor.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {debtor.phone}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">Outstanding Amount</span>
                  <span className="font-bold text-red-600">
                    रू {debtor.outstandingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">Last Transaction</span>
                  <span className="font-medium text-gray-700">
                    {new Date(debtor.lastTransaction).toLocaleDateString("en-NP")}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-500">Total Sales</span>
                  <span className="font-medium text-gray-700">{debtor.sales.length}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-lg border-gray-200 hover:bg-gray-50"
                  onClick={() => handleSendReminder(debtor)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Remind
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-lg"
                  style={{ background: colors.primaryDark }}
                  onClick={() => toast.success("Payment received! (Demo)")}
                >
                  Mark Paid
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDebtors.length === 0 && (
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
