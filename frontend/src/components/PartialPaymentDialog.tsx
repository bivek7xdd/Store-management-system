import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Debt } from "@/services/debts";
import { Banknote, Wallet, AlertCircle } from "lucide-react";

interface PartialPaymentDialogProps {
    debt: Debt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (amount: number) => Promise<void>;
}

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
            <DialogContent className="sm:max-w-[425px] overflow-hidden border-0 shadow-2xl p-0">
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                        <Banknote className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Record Payment</DialogTitle>
                    <DialogDescription className="text-teal-50/80 mt-1">
                        Recording payment for <span className="font-semibold text-white">{debt.customer_name}</span>
                    </DialogDescription>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex-1">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Outstanding</Label>
                            <p className="text-xl font-bold text-gray-900">रू {outstanding.toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div className="flex-1 text-right">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Total Paid</Label>
                            <p className="text-xl font-bold text-teal-600">रू {parseFloat(debt.amount_paid).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">Payment Amount (रू)</Label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">रू</div>
                            <Input
                                id="amount"
                                type="number"
                                step="any"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-14 pl-10 rounded-2xl border-gray-200 text-lg font-bold focus:ring-teal-500/20 focus:border-teal-500"
                                required
                                max={outstanding}
                            />
                        </div>
                        <div className="flex justify-between gap-2 pt-1">
                            {[0.25, 0.5, 0.75, 1].map((pct) => (
                                <Button
                                    key={pct}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs rounded-lg border-gray-100 font-medium text-gray-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-all"
                                    onClick={() => setAmount((outstanding * pct).toFixed(2))}
                                >
                                    {pct * 100}%
                                </Button>
                            ))}
                        </div>
                    </div>

                    {parseFloat(amount) > outstanding && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs border border-amber-100">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Warning: Payment amount exceeds the outstanding balance.</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 h-12 rounded-xl text-gray-500 font-semibold"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                        >
                            {loading ? "Recording..." : "Verify Payment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
