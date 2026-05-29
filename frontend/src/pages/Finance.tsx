import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Wallet, Package, Users, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart, AlertTriangle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense,
    EXPENSE_CATEGORIES, PAYMENT_METHODS, Expense, ExpenseSummary
} from "@/services/expenseService";
import {
    getSupplierPayables, getSupplierPayableSummary, createSupplierPayable,
    recordSupplierPayment, deleteSupplierPayable,
    SupplierPayable, PAYABLE_STATUS_COLORS
} from "@/services/supplierPayableService";
import { inventoryService } from "@/services/inventory";
import api from "@/services/api";
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
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
    Tooltip as RechartsTooltip, LineChart, Line, ComposedChart, CartesianGrid
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#DA291C", "#E85D52", "#8B1A12", "#FF6B5E", "#C44035", "#F09590", "#A0302A", "#D44D3C"];

interface CashFlowDay {
    date: string;
    sales_inflow: number;
    expense_outflow: number;
    refund_outflow: number;
    supplier_payment_outflow: number;
    net_flow: number;
}

function FinanceExpenses() {
    const [dateRange, setDateRange] = useState("month");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: expenses, isLoading: expensesLoading } = useQuery({
        queryKey: ["expenses", dateRange, categoryFilter],
        queryFn: () => getExpenses(dateRange, categoryFilter === "all" ? "" : categoryFilter),
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ["expenseSummary", dateRange],
        queryFn: () => getExpenseSummary(dateRange),
    });

    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            toast.success("Expense recorded");
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
            setDialogOpen(false);
        },
        onError: () => toast.error("Failed to record expense"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateExpense(id, data),
        onSuccess: () => {
            toast.success("Expense updated");
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
            setDialogOpen(false);
            setEditingExpense(null);
        },
        onError: () => toast.error("Failed to update expense"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            toast.success("Expense deleted");
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
            setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete expense"),
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            category: formData.get("category") as string,
            description: formData.get("description") as string,
            amount: parseFloat(formData.get("amount") as string),
            expense_date: formData.get("expense_date") as string,
            payment_method: formData.get("payment_method") as string,
        };

        if (editingExpense) {
            updateMutation.mutate({ id: editingExpense.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const totalAmount = Number((summary as ExpenseSummary)?.summary?.total_amount) || 0;
    const byCategory = (summary as ExpenseSummary)?.by_category || [];
    const daily = (summary as ExpenseSummary)?.daily || [];
    const expenseList = expenses || [];

    if (summaryLoading || expensesLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[24px] font-bold text-white tracking-tight">Expenses</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
                <Skeleton className="h-64 bg-[#111111] rounded-[2px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Expenses</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-28 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-36 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                            <SelectItem value="all">All Categories</SelectItem>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => { setEditingExpense(null); setDialogOpen(true); }}
                        className="h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE]"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Expenses</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-[#DA291C]">रू {totalAmount.toLocaleString()}</h2>
                        <Wallet className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Transactions</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">{(summary as ExpenseSummary)?.summary?.total_count || 0}</h2>
                        <Pencil className="h-5 w-5 text-[#888888]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Top Category</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-xl font-bold text-white truncate">
                            {byCategory[0]?.category ? byCategory[0].category.charAt(0).toUpperCase() + byCategory[0].category.slice(1) : "—"}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A]">
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">By Category</span>
                    </div>
                    <div className="p-5">
                        {byCategory.length === 0 ? (
                            <p className="text-[13px] text-[#888888] text-center py-8">No expense data</p>
                        ) : (
                            <div className="space-y-3">
                                {byCategory.map((cat, i) => (
                                    <div key={cat.category} className="space-y-1">
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-[#CCCCCC] capitalize">{cat.category}</span>
                                            <span className="text-[#8F8F8F]">रू {Number(cat.total).toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#1A1A1A] rounded-[2px] overflow-hidden">
                                            <div
                                                className="h-full rounded-[2px]"
                                                style={{ width: `${totalAmount > 0 ? (Number(cat.total) / totalAmount) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Trend */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A]">
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Daily Trend</span>
                    </div>
                    <div className="p-5 h-64">
                        {daily.length === 0 ? (
                            <p className="text-[13px] text-[#888888] text-center py-8">No daily data</p>
                        ) : (
                            <ResponsiveContainer>
                                <LineChart data={daily}>
                                    <XAxis dataKey="expense_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => new Date(v).toLocaleDateString([], { day: 'numeric', month: 'short' })} />
                                    <YAxis hide />
                                    <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                    <Line type="monotone" dataKey="daily_total" stroke="#DA291C" strokeWidth={2} dot={{ r: 3, fill: '#DA291C', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Expense Table */}
            <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
                    {["Date", "Description", "Category", "Payment", "Amount", ""].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#888888]">{h}</span>
                    ))}
                </div>

                <div className="divide-y divide-[#1A1A1A]">
                    {expenseList.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <Wallet className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-[#888888]">No Expenses Recorded</p>
                        </div>
                    ) : (
                        expenseList.map((expense: Expense) => (
                            <div key={expense.id} className="group p-6 grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center hover:bg-[#0A0A0A] transition-colors">
                                <span className="text-[12px] text-[#888888]">{new Date(expense.expense_date).toLocaleDateString()}</span>
                                <span className="text-[13px] text-white truncate">{expense.description || "—"}</span>
                                <span className="text-[10px] uppercase tracking-[0.5px] px-2 py-1 rounded-[2px] bg-[#1A1A1A] text-[#888888] w-fit">{expense.category}</span>
                                <span className="text-[11px] text-[#888888] capitalize">{expense.payment_method || "—"}</span>
                                <span className="text-[13px] font-bold text-[#DA291C]">रू {Number(expense.amount).toLocaleString()}</span>
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingExpense(expense); setDialogOpen(true); }} className="p-1.5 hover:bg-[#1A1A1A] rounded-[2px] text-[#888888] hover:text-white transition-colors">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setDeleteTarget(expense.id)} className="p-1.5 hover:bg-[#1A1A1A] rounded-[2px] text-[#888888] hover:text-[#DA291C] transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingExpense(null); } }}>
                <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">
                            {editingExpense ? "Edit Expense" : "Record Expense"}
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-[#888888] uppercase tracking-[0.5px]">
                            {editingExpense ? "Update expense details" : "Add a new operating expense"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Category</label>
                            <Select name="category" defaultValue={editingExpense?.category}>
                                <SelectTrigger className="h-10 bg-[#111111] border-[#1A1A1A] rounded-[2px] text-[13px] text-white">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-[#1A1A1A] rounded-[2px]">
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value} className="text-[13px] text-white">{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Amount (रू)</label>
                            <input name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Description</label>
                            <input name="description" defaultValue={editingExpense?.description} placeholder="What was this expense for?"
                                className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#333333]" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Date</label>
                                <input name="expense_date" type="date" defaultValue={editingExpense ? new Date(editingExpense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                    className="w-full h-10 px-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white focus:outline-none focus:border-[#333333]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-[#888888]">Payment</label>
                                <Select name="payment_method" defaultValue={editingExpense?.payment_method || "cash"}>
                                    <SelectTrigger className="h-10 bg-[#111111] border-[#1A1A1A] rounded-[2px] text-[13px] text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111111] border-[#1A1A1A] rounded-[2px]">
                                        {PAYMENT_METHODS.map(pm => (
                                            <SelectItem key={pm.value} value={pm.value} className="text-[13px] text-white">{pm.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => { setDialogOpen(false); setEditingExpense(null); }}
                                className="flex-1 h-10 bg-transparent border border-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] hover:bg-[#1A1A1A]">
                                Cancel
                            </button>
                            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 h-10 bg-[#DA291C] hover:bg-[#B01E0A] disabled:opacity-50 text-white text-[10px] uppercase font-black tracking-widest rounded-[2px] flex items-center justify-center gap-2">
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editingExpense ? "Update" : "Record"}
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
                            This action is irreversible. The expense record will be permanently removed.
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

function PayablesTab() {
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
function CashFlowTab() {
    const [dateRange, setDateRange] = useState("month");

    const { data: cashFlowData, isLoading } = useQuery({
        queryKey: ["cashFlow", dateRange],
        queryFn: async () => {
            const response = await api.get(`/reports/cashflow?range=${dateRange}`);
            return response.data.data as CashFlowDay[];
        },
    });

    const data = cashFlowData || [];

    const totalInflow = data.reduce((sum, d) => sum + Number(d.sales_inflow), 0);
    const totalOutflow = data.reduce((sum, d) => sum + Number(d.expense_outflow) + Number(d.refund_outflow) + Number(d.supplier_payment_outflow), 0);
    const netFlow = totalInflow - totalOutflow;

    const chartData = data.map(d => ({
        date: d.date,
        inflow: Number(d.sales_inflow),
        outflow: Number(d.expense_outflow) + Number(d.refund_outflow) + Number(d.supplier_payment_outflow),
        net: Number(d.net_flow),
    }));

    let runningBalance = 0;
    const balanceData = chartData.map(d => {
        runningBalance += d.net;
        return { ...d, balance: runningBalance };
    });

    if (isLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[24px] font-bold text-white tracking-tight">Cash Flow</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
                <Skeleton className="h-72 bg-[#111111] rounded-[2px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Cash Flow</h1>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-28 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Inflow</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-emerald-400">रू {totalInflow.toLocaleString()}</h2>
                        <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Outflow</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-[#DA291C]">रू {totalOutflow.toLocaleString()}</h2>
                        <ArrowDownRight className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Net Cash Flow</p>
                    <div className="flex items-end justify-between">
                        <h2 className={`text-3xl font-bold ${netFlow >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                            रू {netFlow.toLocaleString()}
                        </h2>
                        {netFlow >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-[#DA291C]" />}
                    </div>
                </div>
            </div>

            {/* Net Flow Chart */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Daily Net Cash Flow</span>
                </div>
                <div className="p-5 h-72">
                    {balanceData.length === 0 ? (
                        <p className="text-[13px] text-[#888888] text-center py-8">No cash flow data</p>
                    ) : (
                        <ResponsiveContainer>
                            <ComposedChart data={balanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => new Date(v).toLocaleDateString([], { day: 'numeric', month: 'short' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => `रू${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                <Bar dataKey="inflow" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.3} />
                                <Bar dataKey="outflow" fill="#DA291C" radius={[2, 2, 0, 0]} opacity={0.3} />
                                <Line type="monotone" dataKey="net" stroke="#ffffff" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Running Balance */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Running Balance</span>
                </div>
                <div className="p-5 h-56">
                    {balanceData.length === 0 ? (
                        <p className="text-[13px] text-[#888888] text-center py-8">No balance data</p>
                    ) : (
                        <ResponsiveContainer>
                            <LineChart data={balanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => new Date(v).toLocaleDateString([], { day: 'numeric', month: 'short' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => `रू${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                <Line type="monotone" dataKey="balance" stroke="#DA291C" strokeWidth={2} dot={{ r: 2, fill: '#DA291C', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
                    {["Date", "Sales Inflow", "Expenses", "Refunds", "Net Flow"].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#888888]">{h}</span>
                    ))}
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                    {balanceData.length === 0 ? (
                        <div className="py-20 text-center">
                            <Wallet className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-[#888888] mt-4">No Data Available</p>
                        </div>
                    ) : (
                        balanceData.map((d, i) => (
                            <div key={i} className="p-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                                <span className="text-[12px] text-[#888888]">{new Date(d.date).toLocaleDateString()}</span>
                                <span className="text-[13px] text-emerald-400">रू {d.inflow.toLocaleString()}</span>
                                <span className="text-[13px] text-[#DA291C]">रू {d.outflow.toLocaleString()}</span>
                                <span className="text-[13px] text-amber-400">रू {data[i]?.refund_outflow ? Number(data[i].refund_outflow).toLocaleString() : "0"}</span>
                                <span className={`text-[13px] font-bold ${d.net >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                                    रू {d.net.toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
function BalanceSheetTab() {
    const [dateRange, setDateRange] = useState("month");

    const { data: netProfitData, isLoading: profitLoading } = useQuery({
        queryKey: ["netProfit", dateRange],
        queryFn: async () => {
            const response = await api.get(`/reports/net-profit?range=${dateRange}`);
            return response.data.data;
        },
    });

    const { data: balanceSheetData, isLoading: balanceLoading } = useQuery({
        queryKey: ["balanceSheet", dateRange],
        queryFn: async () => {
            const [assets, liabilities] = await Promise.all([
                api.get("/reports/balance-sheet/assets"),
                api.get("/reports/balance-sheet/liabilities"),
            ]);
            return {
                assets: assets.data.data,
                liabilities: liabilities.data.data,
            };
        },
    });

    if (profitLoading || balanceLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[24px] font-bold text-white tracking-tight">Balance Sheet</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
            </div>
        );
    }

    const profit = netProfitData || {};
    const balance = balanceSheetData || { assets: {}, liabilities: {} };

    const totalRevenue = Number(profit.total_revenue) || 0;
    const totalCOGS = Number(profit.total_cogs) || 0;
    const totalExpenses = Number(profit.total_expenses) || 0;
    const totalRefunds = Number(profit.total_refunds) || 0;
    const netProfit = Number(profit.net_profit) || 0;

    const accountsReceivable = Number(balance.assets?.accounts_receivable) || 0;
    const inventoryValue = Number(balance.assets?.inventory_value) || 0;
    const accountsPayable = Number(balance.liabilities?.accounts_payable) || 0;

    const BS_COLORS = ["#10b981", "#DA291C", "#f59e0b"];

    const assetData = [
        { name: "Receivables", value: accountsReceivable },
        { name: "Inventory", value: inventoryValue },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Balance Sheet</h1>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-28 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* P&L Summary */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Profit & Loss Summary</span>
                </div>
                <div className="p-6 space-y-3">
                    {[
                        { label: "Total Revenue", value: totalRevenue, cls: "text-white" },
                        { label: "Cost of Goods Sold", value: totalCOGS, cls: "text-[#DA291C]" },
                        { label: "Operating Expenses", value: totalExpenses, cls: "text-amber-400" },
                        { label: "Refunds", value: totalRefunds, cls: "text-amber-400" },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <span className="text-[12px] text-[#8F8F8F]">{label}</span>
                            <span className={`text-[14px] font-bold ${cls}`}>रू {value.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-4 mt-4">
                        <span className="text-[14px] font-bold text-white uppercase tracking-[1px]">Net Profit</span>
                        <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                            रू {netProfit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Assets & Liabilities */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-emerald-900/30 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Assets</span>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Accounts Receivable</span>
                            </div>
                            <span className="text-[14px] font-bold text-white">रू {accountsReceivable.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Inventory Value</span>
                            </div>
                            <span className="text-[14px] font-bold text-white">रू {inventoryValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-3 mt-2">
                            <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Total Assets</span>
                            <span className="text-[16px] font-bold text-emerald-400">रू {(accountsReceivable + inventoryValue).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Liabilities */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-[#DA291C]" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Liabilities</span>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Accounts Payable</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#DA291C]">रू {accountsPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-3 mt-2">
                            <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Total Liabilities</span>
                            <span className="text-[16px] font-bold text-[#DA291C]">रू {accountsPayable.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Composition Chart */}
            {assetData.length > 0 && (
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                            <PieChart className="h-4 w-4 text-[#DA291C]" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Asset Composition</span>
                    </div>
                    <div className="p-5 h-64 flex items-center">
                        <div className="w-1/2">
                            <ResponsiveContainer>
                                <RechartsPieChart>
                                    <Pie data={assetData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                                        {assetData.map((_, i) => <Cell key={i} fill={BS_COLORS[i % BS_COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-3">
                            {assetData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: BS_COLORS[i % BS_COLORS.length] }} />
                                    <span className="text-[12px] text-[#8F8F8F]">{d.name}</span>
                                    <span className="text-[12px] text-white font-bold ml-auto">रू {d.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Finance() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Finance</h1>
                <p className="text-[13px] text-[#888888] mt-1">Manage expenses, payables, cash flow, and balance sheet</p>
            </div>
            <Tabs defaultValue="expenses" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="expenses" className="gap-2"><Wallet className="h-4 w-4" /> Expenses</TabsTrigger>
                    <TabsTrigger value="payables" className="gap-2"><CreditCard className="h-4 w-4" /> Payables</TabsTrigger>
                    <TabsTrigger value="cashflow" className="gap-2"><TrendingUp className="h-4 w-4" /> Cash Flow</TabsTrigger>
                    <TabsTrigger value="balance-sheet" className="gap-2"><PieChart className="h-4 w-4" /> Balance Sheet</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses"><FinanceExpenses /></TabsContent>
                <TabsContent value="payables"><PayablesTab /></TabsContent>
                <TabsContent value="cashflow"><CashFlowTab /></TabsContent>
                <TabsContent value="balance-sheet"><BalanceSheetTab /></TabsContent>
            </Tabs>
        </div>
    );
}
