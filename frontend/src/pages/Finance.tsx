import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Wallet, CreditCard, TrendingUp, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    getExpenses, getExpenseSummary, createExpense, updateExpense, deleteExpense,
    EXPENSE_CATEGORIES, PAYMENT_METHODS, Expense, ExpenseSummary
} from "@/services/expenseService";
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
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
    Tooltip as RechartsTooltip, LineChart, Line
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#DA291C", "#E85D52", "#8B1A12", "#FF6B5E", "#C44035", "#F09590", "#A0302A", "#D44D3C"];

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
    return <div className="text-[#888888] p-8 text-center">Payables - migrating...</div>;
}
function CashFlowTab() {
    return <div className="text-[#888888] p-8 text-center">Cash Flow - migrating...</div>;
}
function BalanceSheetTab() {
    return <div className="text-[#888888] p-8 text-center">Balance Sheet - migrating...</div>;
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
