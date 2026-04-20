import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, UserPlus, User, Check, X, Loader2 } from "lucide-react";
import { Customer } from "@/types";
import { customerService } from "@/services/customerService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CustomerSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
  onGuestCheckout: () => void;
}

const inputCls = "w-full h-12 bg-transparent border border-[#303030] rounded-[2px] px-4 text-[14px] text-white placeholder:text-[#555555] focus:outline-none focus:border-[#DA291C] transition-colors uppercase tracking-tight";

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  open,
  onOpenChange,
  onSelect,
  onGuestCheckout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setCustomers([]);
      setShowAddForm(false);
      return;
    }

    const search = async () => {
      if (!searchTerm) {
        setCustomers([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await customerService.searchCustomers(searchTerm);
        setCustomers(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, open]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Name and Phone are required");
      return;
    }
    setIsLoading(true);
    try {
      const created = await customerService.createCustomer(newCustomer);
      toast.success("Customer created successfully");
      onSelect(created);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] shadow-2xl">
        <DialogHeader className="p-6 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[#DA291C]" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-medium text-white uppercase tracking-[1px]">
                Identify Customer
              </DialogTitle>
              <DialogDescription className="sr-only">
                Search or create a customer profile for this sale.
              </DialogDescription>
              <p className="text-[#555555] text-[11px] mt-0.5 uppercase tracking-[1px]">
                Loyalty & Transaction Security
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {!showAddForm ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555555]" />
                <input
                  placeholder="SEARCH BY NAME OR PHONE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(inputCls, "pl-11")}
                />
              </div>

              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[#DA291C]" />
                  </div>
                ) : customers.length > 0 ? (
                  customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c)}
                      className="w-full flex items-center justify-between p-4 border border-transparent hover:border-[#303030] hover:bg-[#111111] transition-all rounded-[2px] group"
                    >
                      <div className="text-left">
                        <p className="font-bold text-[13px] text-white uppercase tracking-[0.5px]">{c.name}</p>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[0.5px] mt-0.5">{c.phone}</p>
                      </div>
                      <div className="h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="h-4 w-4 text-emerald-400" />
                      </div>
                    </button>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                    <p className="text-[11px] font-medium text-[#555555] uppercase tracking-[1px]">No Matches Found</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-3 text-[11px] font-bold text-[#DA291C] uppercase tracking-[1px] hover:underline"
                    >
                      Create New Identity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={onGuestCheckout}
                      className="w-full h-14 border border-[#303030] hover:border-[#555555] bg-transparent text-white rounded-[2px] text-[12px] font-bold uppercase tracking-[1.5px] transition-all flex items-center justify-center gap-3"
                    >
                      <User className="h-4 w-4" />
                      Guest Checkout
                    </button>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full h-[40px] text-[11px] font-bold uppercase tracking-[1.5px] text-[#555555] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add New Customer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateCustomer} className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Full Name</label>
                <input
                  required
                  placeholder="IDENTITY NAME"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Phone Number</label>
                <input
                  required
                  placeholder="CONTACT NUMBER"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 h-12 border border-[#303030] hover:border-[#555555] text-white rounded-[2px] text-[12px] font-bold uppercase tracking-[1px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] h-12 bg-[#DA291C] hover:bg-[#B01E0A] text-white rounded-[2px] text-[12px] font-bold uppercase tracking-[1px] transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Identity"}
                </button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="p-6 bg-[#0F0F0F] border-t border-[#1A1A1A]">
          <p className="text-[10px] text-[#444444] font-medium uppercase tracking-[1px] text-center w-full">
            Mandatory customer association ensures ecosystem integrity.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
