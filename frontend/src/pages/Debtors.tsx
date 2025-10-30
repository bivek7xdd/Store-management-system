import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone } from "lucide-react";
import { mockDebtors } from "@/lib/mockData";
import { useState } from "react";
import { toast } from "sonner";

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Debtors / Credit Management</h1>
        <p className="text-muted-foreground mt-1">Track outstanding payments from customers</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Outstanding</p>
              <p className="text-3xl font-bold mt-1">रू {totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Debtors</p>
              <p className="text-3xl font-bold mt-1">{mockDebtors.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Debtors List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDebtors.map((debtor) => (
          <Card key={debtor.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{debtor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {debtor.phone}
                  </p>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding Amount:</span>
                  <span className="font-bold text-destructive">
                    रू {debtor.outstandingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Transaction:</span>
                  <span className="font-medium">
                    {new Date(debtor.lastTransaction).toLocaleDateString("en-NP")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sales:</span>
                  <span className="font-medium">{debtor.sales.length}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendReminder(debtor)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Remind
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No debtors found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
