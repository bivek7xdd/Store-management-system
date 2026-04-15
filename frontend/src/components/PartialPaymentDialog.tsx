import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Debt } from "@/services/debts";
import { Banknote, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartialPaymentDialogProps {
    debt: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (amount: number) => Promise<void>;
}

const inputCls = "w-full h-[44px] bg-transparent border border-[#303030] rounded-[2px] px-3 text-[16px] font-bold text-white placeholder:text-[#555555] focus:outline-none focus:border-[#1EAEDB] transition-colors";

export function PartialPaymentDialog({ debt, open, onOpenChange, onSubmit }: PartialPaymentDialogProps) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    if (!debt) return null;

    const outstanding = parseFloat(debt.amount_owed) - parseFloat(debt.amount_paid);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;

        setLoading(true);
        try {
            await onSubmit(parsedAmount);
            setAmount("");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 border border-[#1A1A1A] bg-[#0A0A0A] rounded-[2px] shadow-2xl shadow-black/60 overflow-hidden gap-0">
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-[#1A1A1A]">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-8 rounded-[2px] bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-[15px] font-medium text-white uppercase tracking-[0.5px]">Record Payment</DialogTitle>
                            <p className="text-[12px] text-[#888888]">
                                Partial payment for <span className="text-white font-medium">{debt.customer_name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleFormSubmit} className="px-6 py-6 space-y-6">
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 gap-px bg-[#1A1A1A] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                        <div className="bg-[#111111] p-4 text-center">
                            <p className="text-[10px] font-medium text-[#555555] uppercase tracking-[1px] mb-1">Outstanding</p>
                            <p className="text-[16px] font-medium text-white">रू {outstanding.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#111111] p-4 text-center">
                            <p className="text-[10px] font-medium text-[#555555] uppercase tracking-[1px] mb-1">Total Paid</p>
                            <p className="text-[16px] font-medium text-emerald-400">रू {parseFloat(debt.amount_paid).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-1.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">
                            <Banknote className="h-3 w-3" />
                            Payment Amount (रू)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#555555] text-sm">रू</span>
                            <input
                                id="amount"
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={cn(inputCls, "pl-10")}
                                required
                                max={outstanding}
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {[0.25, 0.5, 0.75, 1].map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setAmount((outstanding * pct).toFixed(2))}
                                    className="h-8 rounded-[2px] border border-[#303030] text-[11px] font-normal text-[#AAAAAA] hover:text-white hover:bg-[#1A1A1A] hover:border-[#555555] transition-all uppercase tracking-[0.5px]"
                                >
                                    {pct * 100}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Excess Warning */}
                    {parseFloat(amount) > outstanding && (
                        <div className="flex items-start gap-2 p-3 bg-[#DA291C]/10 border border-[#DA291C]/20 rounded-[2px]">
                            <AlertCircle className="h-4 w-4 text-[#DA291C] shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#DA291C] font-medium">Payment amount exceeds the outstanding balance.</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-[#1A1A1A]">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-[40px] rounded-[2px] border border-[#303030] text-[12px] text-[#888888] hover:text-white uppercase tracking-[1px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="flex-[2] h-[40px] rounded-[2px] bg-white text-black hover:bg-[#F2F2F2] font-medium text-[12px] uppercase tracking-[1px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Recording..." : "Verify Payment"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
