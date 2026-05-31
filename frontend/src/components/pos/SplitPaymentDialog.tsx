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
  onConfirm: (payments: PaymentEntry[], debtInfo?: { dueDate: string; notes: string }) => void;
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
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [debtNotes, setDebtNotes] = useState("");

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalDue - totalPaid;
  const hasCredit = payments.some(p => p.type === 'credit') || remaining > 0.01;

  const addPayment = (type: 'cash' | 'credit' | 'online') => {
    if (remaining <= 0 && type !== 'credit') {
        toast.info("Balance already covered.");
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

  const handleQuickPay = (type: 'cash' | 'online') => {
    onConfirm([{ type, amount: totalDue }], { dueDate, notes: debtNotes });
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && remaining <= 0.01) {
      handleConfirm();
    }
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
    
    // If there's a remaining balance, treat it as credit automatically if finalized
    let finalPayments = [...payments];
    if (remaining > 0.01) {
      finalPayments.push({ type: 'credit', amount: remaining });
    }

    onConfirm(finalPayments, { dueDate, notes: debtNotes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] shadow-2xl">
        <DialogHeader className="p-8 border-b border-[#1A1A1A] shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-[#DA291C]" />
            </div>
            <DialogTitle className="text-[16px] font-bold tracking-[1px] uppercase text-white">
              Terminal Settlement
            </DialogTitle>
            <DialogDescription className="sr-only">
              Allocate total amount across different payment methods.
            </DialogDescription>
          </div>
          
          <div className="flex justify-between items-end">
             <div>
                <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Grand Total</p>
                <p className="text-[28px] font-bold text-white tracking-tight">रू {totalDue.toLocaleString()}</p>
             </div>
             <div className="text-right">
                <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Unallocated</p>
                <p className={cn(
                  "text-[28px] font-bold tracking-tight transition-colors",
                  remaining > 0.01 ? "text-[#DA291C]" : "text-emerald-400"
                )}>
                    रू {remaining.toLocaleString()}
                </p>
             </div>
          </div>

          {/* Quick Checkout Shortcuts */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button 
              onClick={() => handleQuickPay('cash')}
              className="h-16 bg-[#111111] border border-emerald-500/20 hover:border-emerald-500/50 rounded-[2px] flex items-center justify-center gap-3 group transition-all"
            >
              <div className="h-10 w-10 rounded-[2px] bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[1.5px]">Instant</p>
                <p className="text-[14px] font-bold text-white uppercase tracking-[0.5px]">Full Cash</p>
              </div>
            </button>
            <button 
              onClick={() => handleQuickPay('online')}
              className="h-16 bg-[#111111] border border-blue-500/20 hover:border-blue-500/50 rounded-[2px] flex items-center justify-center gap-3 group transition-all"
            >
              <div className="h-10 w-10 rounded-[2px] bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20">
                <Smartphone className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[1.5px]">Instant</p>
                <p className="text-[14px] font-bold text-white uppercase tracking-[0.5px]">Full Online</p>
              </div>
            </button>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Active Payments */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555] mb-2">Payment Archive</p>
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
                    <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Amount Collected</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#555555]">रू</span>
                       <input 
                        type="number"
                        autoFocus={index === 0}
                        value={payment.amount || ""}
                        onChange={(e) => updateAmount(index, e.target.value)}
                        onKeyDown={onKeyDown}
                        className={cn(inputCls, "w-full pl-8")}
                       />
                    </div>
                  </div>
                  {payment.type === 'online' && (
                    <div className="flex-[3] space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Payment Provider</label>
                      <input 
                        placeholder="ESEWA, KHALTI, ETC."
                        value={payment.provider || ''}
                        onChange={(e) => updateProvider(index, e.target.value.toUpperCase())}
                        className={cn(inputCls, "w-full text-[14px] font-bold")}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="text-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                 <p className="text-[11px] font-bold text-[#555555] uppercase tracking-[2px]">Initialize Payment Entry</p>
              </div>
            )}
          </div>

          {/* Add Payment Shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'cash', Icon: Banknote, label: 'Add Cash' },
              { type: 'online', Icon: Smartphone, label: 'Add Online' },
              { type: 'credit', Icon: CreditCard, label: 'Add Credit' }
            ].map(({ type, Icon, label }) => (
              <button 
                key={type}
                onClick={() => addPayment(type as any)}
                className="h-14 border border-[#303030] hover:border-[#555555] rounded-[2px] font-bold uppercase text-[10px] tracking-[1.5px] text-[#888888] hover:text-white hover:bg-[#111111] transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Debt Details (Conditional) */}
          {hasCredit && (
            <div className="p-6 bg-[#DA291C]/5 border border-[#DA291C]/20 rounded-[2px] animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-3 mb-6">
                 <CreditCard className="h-4 w-4 text-[#DA291C]" />
                 <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#DA291C]">Debt Configuration</p>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Expected Settlement Date</label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={cn(inputCls, "w-full text-sm font-bold uppercase [color-scheme:dark]")}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#555555]">Collection Notes</label>
                    <input 
                      placeholder="ADDITIONAL NOTES..."
                      value={debtNotes}
                      onChange={(e) => setDebtNotes(e.target.value)}
                      className={cn(inputCls, "w-full text-sm font-bold")}
                    />
                 </div>
               </div>
               <p className="text-[11px] text-[#DA291C]/70 mt-4 uppercase tracking-[0.5px]">
                 * A new debt record for रू {remaining.toLocaleString()} will be automatically generated.
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-[#0F0F0F] border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center gap-6 shrink-0">
          <div className="flex-1 text-left w-full sm:w-auto">
            <p className="text-[#555555] text-[10px] uppercase tracking-[1.5px] font-bold">Sum Collected</p>
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
                onClick={handleConfirm}
                className="flex-[2] sm:flex-none h-14 bg-[#DA291C] hover:bg-[#B01E0A] text-white rounded-[2px] font-bold uppercase px-12 text-[12px] tracking-[1.5px] transition-colors flex items-center justify-center gap-2"
            >
                {remaining <= 0.01 && <CheckCircle2 className="h-4 w-4" />}
                {remaining > 0.01 ? 'Record Debt & Finish' : 'Finalize Settlement'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
