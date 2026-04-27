import { useState, useEffect } from "react";
import { Search, Users, RefreshCw, Smartphone, Award, ShoppingBag, ChevronRight, UserMinus, Pencil, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService } from "@/services/customerService";
import { Customer } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
      customerService.updateCustomer(id, data),
    onSuccess: () => {
      toast.success("Customer updated successfully");
      setEditDialogOpen(false);
      fetchCustomers();
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error("Failed to update customer");
    }
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.listCustomers();
      setCustomers(data || []);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <>
      <div className="space-y-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">CRM</p>
            <h1 className="text-[22px] font-medium text-white tracking-tight">Customer Database</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCustomers}
              className="h-8 w-8 rounded-[2px] border border-[#1A1A1A] bg-[#111111] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Managed</p>
            <div className="flex items-end justify-between">
              <h2 className="text-3xl font-bold text-white">{customers.length}</h2>
              <Users className="h-5 w-5 text-[#DA291C]" />
            </div>
          </div>
          <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Loyal Customers</p>
            <div className="flex items-end justify-between">
              <h2 className="text-3xl font-bold text-white">
                  {customers.filter(c => c.loyalty_status !== 'standard').length}
              </h2>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
            <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Sales Vol.</p>
            <div className="flex items-end justify-between">
              <h2 className="text-3xl font-bold text-white">
                  {customers.reduce((sum, c) => sum + c.purchase_count, 0)}
              </h2>
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555555]" />
          <input
            type="text"
            placeholder="SEARCH BY NAME OR PHONE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-xs font-bold uppercase tracking-widest text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors"
          />
        </div>

        {/* Table */}
        <div className="border border-[#1A1A1A] rounded-[2px] bg-[#000000] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
            {["Customer", "Identity", "Orders", "Loyalty Status", "Progress", ""].map(h => (
              <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#555555]">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#1A1A1A]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4">
                  <Skeleton className="h-5 w-40 bg-[#111111]" />
                  <Skeleton className="h-5 w-30 bg-[#111111]" />
                  <Skeleton className="h-5 w-10 bg-[#111111]" />
                  <Skeleton className="h-5 w-24 bg-[#111111]" />
                  <Skeleton className="h-5 w-32 bg-[#111111]" />
                  <Skeleton className="h-5 w-8 bg-[#111111]" />
                </div>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <div key={customer.id} className="group p-6 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 items-center hover:bg-[#0A0A0A] transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#1A1A1A] rounded-[2px] flex items-center justify-center font-black text-white text-xs">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{customer.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Added {new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-[#555555]" />
                    <span className="text-[12px] text-[#AAAAAA] font-medium">{customer.phone || '—'}</span>
                  </div>

                  <div className="text-[13px] font-bold text-white pl-2">
                    {customer.purchase_count}
                  </div>

                  <div>
                    <Badge className={`rounded-[2px] text-[10px] uppercase font-black tracking-tighter ${customer.loyalty_status === 'gold' ? 'bg-amber-500 text-black' : customer.loyalty_status === 'silver' ? 'bg-slate-300 text-black' : 'bg-[#1A1A1A] text-white'}`}>
                      {customer.loyalty_status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {customer.name === 'Guest' ? (
                      <span className="text-[10px] text-[#333333] uppercase font-black italic">N/A</span>
                    ) : (
                      <>
                        <div className="flex justify-between items-center pr-4">
                          <span className="text-[9px] font-black uppercase text-[#555555]">
                            {customer.purchase_count % 5} / 5
                          </span>
                        </div>
                        <div className="h-1 w-24 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#DA291C] transition-all duration-500" 
                            style={{ width: `${(customer.purchase_count % 5) * 20}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {customer.name !== 'Guest' && (
                      <button 
                        onClick={() => {
                          setEditingCustomer(customer);
                          setEditDialogOpen(true);
                        }}
                        className="p-2 hover:bg-[#1A1A1A] rounded-[2px] text-[#888888] hover:text-white transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <UserMinus className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[2px] text-[#555555]">No Customers Found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] text-white max-w-md rounded-[2px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Customer</DialogTitle>
            <DialogDescription className="text-[#888888] text-xs uppercase tracking-widest">
              Modify information for {editingCustomer?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editingCustomer) return;
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get("name") as string,
              phone: formData.get("phone") as string,
            };
            updateCustomerMutation.mutate({ id: editingCustomer.id, data });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCustomer?.name}
                  className="bg-[#111111] border-[#1A1A1A] rounded-[2px] focus:ring-[#DA291C] focus:border-[#DA291C] text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingCustomer?.phone}
                  className="bg-[#111111] border-[#1A1A1A] rounded-[2px] focus:ring-[#DA291C] focus:border-[#DA291C] text-sm"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-8"
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Update Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
