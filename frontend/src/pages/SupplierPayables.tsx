import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, Loader2, AlertTriangle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    getSupplierPayables, getSupplierPayableSummary, createSupplierPayable,
    recordSupplierPayment, deleteSupplierPayable,
    SupplierPayable, PAYABLE_STATUS_COLORS
} from "@/services/supplierPayableService";
import { inventoryService } from "@/services/inventory";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SupplierPayables() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: payables, isLoading: payablesLoading } = useQuery({
        queryKey: ["supplierPayables", statusFilter],
        queryFn: () => getSupplierPayables(statusFilter === "all" ? "" : statusFilter),
    });

    const { data: summary } = useQuery({
        queryKey: ["supplierPayableSummary"],
        queryFn: getSupplierPayableSummary,
    });

    const { data: suppliers } = useQuery({
        queryKey: ["suppliers"],
        queryFn: inventoryService.getSuppliers,
    });

    const createMutation = useMutation({
        mutationFn: createSupplierPayable,
        onSuccess: () => {
            toast.success("Payable recorded");
            queryClient.invalidateQueries({ queryKey: ["supplierPayables"] });
            queryClient.invalidateQueries({ queryKey: ["supplierPayableSummary"] });
            setDialogOpen(false);
        },
        onError: () => toast.error("Failed to record payable"),
    });

    const paymentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => recordSupplierPayment(id, data),
        onSuccess: () => {
            toast.success("Payment recorded");
            queryClient.invalidateQueries({ queryKey: ["supplierPayables"] });
            queryClient.invalidateQueries({ queryKey: ["supplierPayableSummary"] });
            setPaymentDialogOpen(false);
            setSelectedPayable(null);
        },
        onError: () => toast.error("Failed to record payment"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSupplierPayable,
        onSuccess: () => {
            toast.success("Payable deleted");
            queryClient.invalidateQueries({ queryKey: ["supplierPayables"] });
            queryClient.invalidateQueries({ queryKey: ["supplierPayableSummary"] });
            setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete payable"),
    });

    const handleCreatePayable = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            supplier_id: formData.get("supplier_id") as string,
            description: formData.get("description") as string,
            amount_owed: parseFloat(formData.get("amount_owed") as string),
            due_date: formData.get("due_date") as string,
        });
    };

    const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedPayable) return;
        const formData = new FormData(e.currentTarget);
        paymentMutation.mutate({
            id: selectedPayable.id,
            data: {
                amount: parseFloat(formData.get("amount") as string),
                payment_method: formData.get("payment_method") as string,
                notes: formData.get("notes") as string,
            },
        });
    };

    const totalOutstanding = Number((summary as any)?.summary?.total_outstanding) || 0;
    const totalOverdue = Number((summary as any)?.summary?.total_overdue) || 0;
    const dueThisWeek = Number((summary as any)?.summary?.due_this_week) || 0;
    const payableList = payables || [];

    if (payablesLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[24px] font-bold text-white tracking-tight">Supplier Payables</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Supplier Payables</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE]"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Record Purchase
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Outstanding</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-[#DA291C]">रू {totalOutstanding.toLocaleString()}</h2>
                        <CreditCard className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Overdue</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-amber-400">रू {totalOverdue.toLocaleString()}</h2>
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Due This Week</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">रू {dueThisWeek.toLocaleString()}</h2>
                        <Truck className="h-5 w-5 text-[#888888]" />
                    </div>
                </div>
            </div>

            {/* Payables Table */}
            <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
                    {["Supplier", "Description", "Owed", "Paid", "Balance", "Due Date", ""].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#888888]">{h}</span>
                    ))}
                </div>

                <div className="divide-y divide-[#1A1A1A]">
                    {payableList.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <CreditCard className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-[#888888]">No Outstanding Payables</p>
                        </div>
                    ) : (
                        payableList.map((payable: SupplierPayable) => {
                            const balance = Number(payable.amount_owed) - Number(payable.amount_paid);
                            const colors = PAYABLE_STATUS_COLORS[payable.status as keyof typeof PAYABLE_STATUS_COLORS] || PAYABLE_STATUS_COLORS.pending;
                            return (
                                <div key={payable.id} className="group p-6 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 items-center hover:bg-[#0A0A0A] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-[#1A1A1A] rounded-[2px] flex items-center justify-center">
                                            <Truck className="h-4 w-4 text-[#DA291C]" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] text-white font-bold uppercase tracking-tight">{payable.supplier_name}</p>
                                            <p className="text-[10px] text-[#888888]">{payable.supplier_phone}</p>
                                        </div>
                                    </div>
                                    <span className="text-[12px] text-[#888888] truncate">{payable.description || "—"}</span>
                                    <span className="text-[13px] font-bold text-white">रू {Number(payable.amount_owed).toLocaleString()}</span>
                                    <span className="text-[13px] text-emerald-400">रू {Number(payable.amount_paid).toLocaleString()}</span>
                                    <span className="text-[13px] font-bold text-[#DA291C]">रू {balance.toLocaleString()}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-[#888888]">{payable.due_date ? new Date(payable.due_date).toLocaleDateString() : "—"}</span>
                                        <Badge className={`rounded-[2px] text-[9px] uppercase font-black tracking-tighter ${colors.bg} ${colors.text} border ${colors.border}`}>
                                            {payable.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {payable.status !== "paid" && (
                                            <button onClick={() => { setSelectedPayable(payable); setPaymentDialogOpen(true); }}
                                                className="p-1.5 hover:bg-[#1A1A1A] rounded-[2px] text-[#888888] hover:text-emerald-400 transition-colors" title="Make Payment">
                                                <CreditCard className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button onClick={() => setDeleteTarget(payable.id)}
                                            className="p-1.5 hover:bg-[#1A1A1A] rounded-[2px] text-[#888888] hover:text-[#DA291C] transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Create Payable Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
                <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Record Purchase</DialogTitle>
                        <DialogDescription className="text-[11px] text-[#888888] uppercase tracking-[0.5px]">Record a supplier purchase on credit</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePayable} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Supplier</label>
                            <Select name="supplier_id" required>
                                <SelectTrigger className="h-10 bg-[#111111] border-[#1A1A1A] rounded-[2px] text-[13px] text-white">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-[#1A1A1A] rounded-[2px]">
                                    {suppliers?.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id} className="text-[13px] text-white">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Amount Owed (रू)</label>
                            <input name="amount_owed" type="number" step="0.01" placeholder="0.00" required
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Description</label>
                            <input name="description" placeholder="e.g., 100 units of Product X"
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Due Date</label>
                            <input name="due_date" type="date" required
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white focus:outline-none focus:border-[#333333]" />
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setDialogOpen(false)}
                                className="flex-1 h-10 bg-transparent border border-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] hover:bg-[#1A1A1A]">
                                Cancel
                            </button>
                            <button type="submit" disabled={createMutation.isPending}
                                className="flex-1 h-10 bg-[#DA291C] hover:bg-[#B01E0A] disabled:opacity-50 text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Record
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={(open) => { if (!open) { setPaymentDialogOpen(false); setSelectedPayable(null); } }}>
                <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Make Payment</DialogTitle>
                        <DialogDescription className="text-[11px] text-[#888888] uppercase tracking-[0.5px]">
                            {selectedPayable?.supplier_name} — Balance: रू {(Number(selectedPayable?.amount_owed) - Number(selectedPayable?.amount_paid)).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Payment Amount (रू)</label>
                            <input name="amount" type="number" step="0.01" max={selectedPayable ? Number(selectedPayable.amount_owed) - Number(selectedPayable.amount_paid) : 0} placeholder="0.00" required
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Payment Method</label>
                            <Select name="payment_method" defaultValue="cash">
                                <SelectTrigger className="h-10 bg-[#111111] border-[#1A1A1A] rounded-[2px] text-[13px] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-[#1A1A1A] rounded-[2px]">
                                    <SelectItem value="cash" className="text-[13px] text-white">Cash</SelectItem>
                                    <SelectItem value="esewa" className="text-[13px] text-white">eSewa</SelectItem>
                                    <SelectItem value="khalti" className="text-[13px] text-white">Khalti</SelectItem>
                                    <SelectItem value="bank_transfer" className="text-[13px] text-white">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Notes</label>
                            <input name="notes" placeholder="Optional notes"
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => { setPaymentDialogOpen(false); setSelectedPayable(null); }}
                                className="flex-1 h-10 bg-transparent border border-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] hover:bg-[#1A1A1A]">
                                Cancel
                            </button>
                            <button type="submit" disabled={paymentMutation.isPending}
                                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] flex items-center justify-center gap-2">
                                {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Pay
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
                            This action is irreversible. The payable record will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-6"
                            onClick={() => deleteMutation.mutate(deleteTarget!)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
