import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Banknote, CreditCard, Smartphone, Calculator, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PaymentEntry {
  type: 'cash' | 'credit' | 'online';
  amount: number;
  provider?: string;
}

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalDue: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  initialPayments?: PaymentEntry[];
}

const inputCls = "h-12 bg-transparent border border-[#303030] rounded-[2px] px-3 font-bold text-lg text-white placeholder:text-[#888888] focus:outline-none focus:border-[#DA291C] transition-colors";

export const SplitPaymentDialog: React.FC<SplitPaymentDialogProps> = ({
  open,
  onOpenChange,
  totalDue,
  onConfirm,
  initialPayments = []
}) => {
  const [payments, setPayments] = useState<PaymentEntry[]>(
    initialPayments.length > 0 ? initialPayments : [{ type: 'cash', amount: totalDue }]
  );

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalDue - totalPaid;

  const addPayment = (type: 'cash' | 'credit' | 'online') => {
    if (remaining <= 0 && type !== 'credit') {
        toast.info("Balance already covered. Adding as extra payment.");
    }
    setPayments([...payments, { type, amount: Math.max(0, remaining) }]);
  };

  const removePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const updateAmount = (index: number, amount: string) => {
    const newPayments = [...payments];
    newPayments[index].amount = parseFloat(amount) || 0;
    setPayments(newPayments);
  };

  const updateProvider = (index: number, provider: string) => {
    const newPayments = [...payments];
    newPayments[index].provider = provider;
    setPayments(newPayments);
  };

  const handleConfirm = () => {
    if (payments.length === 0) {
      toast.error("At least one payment entry is required");
      return;
    }
    onConfirm(payments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] shadow-2xl">
        <DialogHeader className="p-8 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-[#DA291C]" />
            </div>
            <DialogTitle className="text-[16px] font-bold tracking-[1px] uppercase text-white">
              Split Payment Settlement
            </DialogTitle>
            <DialogDescription className="sr-only">
              Allocate total amount across different payment methods.
            </DialogDescription>
          </div>
          
          <div className="flex justify-between items-end">
             <div>
                <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Total Transaction</p>
                <p className="text-[28px] font-bold text-white tracking-tight">रू {totalDue.toLocaleString()}</p>
             </div>
             <div className="text-right">
                <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Remaining Balance</p>
                <p className={cn(
                  "text-[28px] font-bold tracking-tight transition-colors",
                  remaining > 0 ? "text-[#DA291C]" : "text-emerald-400"
                )}>
                    रू {remaining.toLocaleString()}
                </p>
             </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {payments.map((payment, index) => (
              <div key={index} className="group relative p-5 border border-[#1A1A1A] rounded-[2px] bg-[#0F0F0F] transition-colors hover:border-[#303030]">
                <div className="flex items-center justify-between mb-5">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#1A1A1A] text-white flex items-center justify-center rounded-[2px]">
                         {payment.type === 'cash' && <Banknote className="h-4 w-4" />}
                         {payment.type === 'online' && <Smartphone className="h-4 w-4" />}
                         {payment.type === 'credit' && <CreditCard className="h-4 w-4" />}
                      </div>
                      <span className="font-bold text-[11px] uppercase tracking-[1.5px] text-[#CCCCCC]">{payment.type} Payment</span>
                   </div>
                   <button 
                    onClick={() => removePayment(index)}
                    className="h-8 w-8 text-[#555555] hover:text-[#DA291C] transition-colors"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-[2] space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Amount Received</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#555555]">रू</span>
                       <input 
                        type="number"
                        value={payment.amount || ""}
                        onChange={(e) => updateAmount(index, e.target.value)}
                        className={cn(inputCls, "w-full pl-8")}
                       />
                    </div>
                  </div>
                  {payment.type === 'online' && (
                    <div className="flex-[3] space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Provider Name</label>
                      <input 
                        placeholder="PROVIDER (E.G. ESEWA)"
                        value={payment.provider || ''}
                        onChange={(e) => updateProvider(index, e.target.value.toUpperCase())}
                        className={cn(inputCls, "w-full text-sm")}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="text-center py-16 border border-dashed border-[#1A1A1A] rounded-[2px]">
                 <p className="text-[11px] font-bold text-[#555555] uppercase tracking-[2px]">No Payments Recorded</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'cash', Icon: Banknote, label: 'Add Cash' },
              { type: 'online', Icon: Smartphone, label: 'Add Online' },
              { type: 'credit', Icon: CreditCard, label: 'Add Credit' }
            ].map(({ type, Icon, label }) => (
              <button 
                key={type}
                onClick={() => addPayment(type as any)}
                className="h-14 border border-[#303030] hover:border-[#555555] rounded-[2px] font-bold uppercase text-[10px] tracking-[1.5px] text-white hover:bg-[#111111] transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="p-8 bg-[#0F0F0F] border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-left w-full sm:w-auto">
            <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Total Collected</p>
            <p className="text-[24px] font-bold text-white tracking-tight">रू {totalPaid.toLocaleString()}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none h-14 border border-[#303030] hover:border-[#555555] rounded-[2px] font-bold uppercase px-8 text-[12px] tracking-[1.5px] text-[#CCCCCC] hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                disabled={remaining > 0 && !payments.some(p => p.type === 'credit')}
                onClick={handleConfirm}
                className="flex-[2] sm:flex-none h-14 bg-[#DA291C] hover:bg-[#B01E0A] text-white rounded-[2px] font-bold uppercase px-12 text-[12px] tracking-[1.5px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {remaining <= 0 && <CheckCircle2 className="h-4 w-4" />}
                Finalize Settlement
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
