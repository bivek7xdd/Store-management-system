import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MessageCircle, Phone, Users, Wallet, RefreshCw,
  ChevronLeft, ChevronRight, Filter, Pencil, Trash2, Calendar,
  MoreVertical, CreditCard, Banknote, AlertCircle, Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { debtService, Debt } from "@/services/debts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DebtDialog } from "@/components/DebtDialog";
import { PartialPaymentDialog } from "@/components/PartialPaymentDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;

export default function Debtors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [partialPayOpen, setPartialPayOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [fullPayConfirmOpen, setFullPayConfirmOpen] = useState(false);

  useEffect(() => { fetchDebts(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await debtService.getDebts();
      setDebts(data || []);
    } catch {
      toast.error("Failed to fetch debts");
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = (debts || []).filter((d) => {
    const outstanding = parseFloat(d.amount_owed) - parseFloat(d.amount_paid);
    const matchesSearch =
      (d.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (d.customer_phone || "").includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "pending" ? outstanding > 0 : outstanding <= 0;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = (debts || []).reduce(
    (sum, d) => sum + (parseFloat(d.amount_owed) - parseFloat(d.amount_paid)), 0
  );
  const pendingCount = debts.filter(d => parseFloat(d.amount_owed) - parseFloat(d.amount_paid) > 0).length;
  const recoveryRate = debts.length > 0
    ? Math.round((debts.filter(d => parseFloat(d.amount_owed) === parseFloat(d.amount_paid)).length / debts.length) * 100)
    : 0;

  const totalPages = Math.ceil(filteredDebtors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDebtors = filteredDebtors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleMarkPaid = (debtor: Debt) => {
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    if (outstanding <= 0) return;
    setSelectedDebt(debtor);
    setFullPayConfirmOpen(true);
  };

  const confirmFullPay = async () => {
    if (!selectedDebt) return;
    const outstanding = parseFloat(selectedDebt.amount_owed) - parseFloat(selectedDebt.amount_paid);
    try {
      await debtService.recordPayment(selectedDebt.id, outstanding);
      toast.success(`Debt of रू ${outstanding} for ${selectedDebt.customer_name} marked as fully paid`);
      fetchDebts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update debt");
    } finally {
      setFullPayConfirmOpen(false);
      setSelectedDebt(null);
    }
  };

  const submitPartialPayment = async (amount: number) => {
    if (!selectedDebt) return;
    try {
      await debtService.recordPayment(selectedDebt.id, amount);
      toast.success(`Recorded payment of रू ${amount} for ${selectedDebt.customer_name}`);
      fetchDebts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!debtToDelete) return;
    try {
      await debtService.deleteDebt(debtToDelete);
      toast.success("Debt deleted successfully");
      setDebtToDelete(null);
      setDeleteDialogOpen(false);
      fetchDebts();
    } catch {
      toast.error("Failed to delete debt");
    }
  };

  const handleSendSMSReminder = async (debtor: Debt) => {
    if (!debtor.customer_phone) { toast.error("No phone number for this customer"); return; }
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    if (outstanding <= 0) return;
    toast.promise(debtService.sendReminder(debtor.id), {
      loading: `Sending SMS to ${debtor.customer_phone}...`,
      success: "SMS sent successfully!",
      error: "Failed to send SMS.",
    });
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Finance</p>
          <h1 className="text-[22px] font-medium text-white tracking-tight">Debt Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDebts}
            className="h-8 w-8 rounded-[2px] border border-[#1A1A1A] bg-[#111111] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <DebtDialog onSuccess={fetchDebts} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-3" data-tour="debtors-summary">
        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Total Outstanding</p>
            <div className="h-8 w-8 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-[24px] font-medium text-white">रू {totalOutstanding.toLocaleString()}</p>
        </div>

        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Pending Accounts</p>
            <div className="h-8 w-8 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-[24px] font-medium text-white">{pendingCount}</p>
          <p className="text-[12px] text-[#555555] mt-1">of {debts.length} total</p>
        </div>

        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Recovery Rate</p>
            <span className="text-[13px] font-medium text-emerald-400">{recoveryRate}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${recoveryRate}%` }}
            />
          </div>
          <p className="text-[12px] text-[#555555] mt-2">Accounts fully settled</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2" data-tour="debtors-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555555]" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#303030] transition-colors"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: "all" | "pending" | "paid") => setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[160px] h-[38px] rounded-[2px] border border-[#1A1A1A] bg-[#111111] text-[#CCCCCC] text-[12px] focus:ring-0 focus:ring-offset-0">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#555555]" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#303030] rounded-[2px] text-white">
            <SelectItem value="all" className="text-[13px] text-[#CCCCCC] focus:bg-[#1A1A1A] focus:text-white">All Accounts</SelectItem>
            <SelectItem value="pending" className="text-[13px] text-[#CCCCCC] focus:bg-[#1A1A1A] focus:text-white">Unpaid Only</SelectItem>
            <SelectItem value="paid" className="text-[13px] text-[#CCCCCC] focus:bg-[#1A1A1A] focus:text-white">Fully Settled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden" data-tour="debtors-list">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
          {["Customer", "Phone", "Outstanding", "Due Date", "Actions"].map((col) => (
            <p key={col} className="text-[10px] font-medium text-[#555555] uppercase tracking-[1px]">{col}</p>
          ))}
        </div>

        {loading ? (
          <div className="divide-y divide-[#111111]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-4">
                <Skeleton className="h-4 w-32 bg-[#1A1A1A]" />
                <Skeleton className="h-4 w-24 bg-[#1A1A1A]" />
                <Skeleton className="h-4 w-20 bg-[#1A1A1A]" />
                <Skeleton className="h-4 w-20 bg-[#1A1A1A]" />
                <Skeleton className="h-4 w-16 bg-[#1A1A1A]" />
              </div>
            ))}
          </div>
        ) : paginatedDebtors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-8 h-8 text-[#303030] mb-3" />
            <p className="text-[14px] font-medium text-white mb-1">
              {debts.length === 0 ? "No Debtors Yet" : "No Match Found"}
            </p>
            <p className="text-[12px] text-[#555555] max-w-xs">
              {debts.length === 0
                ? "Credit sales appear here automatically, or add a debtor manually."
                : "Try adjusting your search or filter."}
            </p>
            {debts.length === 0 && (
              <div className="mt-5">
                <DebtDialog onSuccess={fetchDebts} />
              </div>
            )}
            {debts.length > 0 && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                className="mt-4 text-[12px] text-[#888888] hover:text-white transition-colors uppercase tracking-[1px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#0A0A0A]">
            {paginatedDebtors.map((debtor) => {
              const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
              const isFullyPaid = outstanding <= 0;
              const paidPct = (parseFloat(debtor.amount_paid) / parseFloat(debtor.amount_owed)) * 100;
              const isOverdue = debtor.due_date && new Date(debtor.due_date) < new Date() && !isFullyPaid;

              return (
                <div key={debtor.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-4 items-center hover:bg-[#0F0F0F] transition-colors group">

                  {/* Customer */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-[2px] flex items-center justify-center text-[11px] font-bold text-white shrink-0 bg-[#303030]">
                      {(debtor.customer_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[13px] text-white font-medium truncate">{debtor.customer_name || "Unknown"}</p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-[#555555] shrink-0" />
                    <p className="text-[12px] text-[#CCCCCC]">{debtor.customer_phone || "—"}</p>
                  </div>

                  {/* Outstanding */}
                  <div>
                    <p className={`text-[13px] font-medium ${isFullyPaid ? "text-emerald-400" : "text-white"}`}>
                      {isFullyPaid ? "Settled" : `रू ${outstanding.toLocaleString()}`}
                    </p>
                    {!isFullyPaid && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(paidPct, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-[#555555]">{Math.round(paidPct)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-1.5">
                    {debtor.due_date ? (
                      <>
                        <Calendar className={`h-3 w-3 shrink-0 ${isOverdue ? "text-[#F13A2C]" : "text-[#555555]"}`} />
                        <p className={`text-[12px] ${isOverdue ? "text-[#F13A2C]" : "text-[#CCCCCC]"}`}>
                          {new Date(debtor.due_date).toLocaleDateString("en-NP")}
                          {isOverdue && <span className="ml-1 text-[10px] uppercase tracking-[0.5px]">(overdue)</span>}
                        </p>
                      </>
                    ) : (
                      <p className="text-[12px] text-[#555555]">—</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!isFullyPaid && (
                      <>
                        <button
                          onClick={() => { setSelectedDebt(debtor); setPartialPayOpen(true); }}
                          className="h-7 px-2.5 rounded-[2px] text-[11px] text-[#CCCCCC] border border-[#303030] hover:text-white hover:border-[#555555] transition-colors uppercase tracking-[0.8px]"
                        >
                          Partial
                        </button>
                        <button
                          onClick={() => handleMarkPaid(debtor)}
                          className="h-7 px-2.5 rounded-[2px] text-[11px] text-white bg-[#DA291C] hover:bg-[#B01E0A] transition-colors uppercase tracking-[0.8px]"
                        >
                          Settle
                        </button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 rounded-[2px] flex items-center justify-center text-[#555555] hover:text-white hover:bg-[#1A1A1A] transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#111111] border-[#303030] rounded-[2px] text-white min-w-[160px]">
                        <DebtDialog debt={debtor} onSuccess={fetchDebts}>
                          <DropdownMenuItem
                            className="text-[13px] text-[#CCCCCC] hover:text-white focus:bg-[#1A1A1A] focus:text-white cursor-pointer gap-2"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit Record
                          </DropdownMenuItem>
                        </DebtDialog>
                        {!isFullyPaid && (
                          <DropdownMenuItem
                            className="text-[13px] text-[#CCCCCC] hover:text-white focus:bg-[#1A1A1A] focus:text-white cursor-pointer gap-2"
                            onSelect={() => handleSendSMSReminder(debtor)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Send SMS
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-[13px] text-[#DA291C] focus:text-[#DA291C] hover:bg-[#DA291C]/10 focus:bg-[#DA291C]/10 cursor-pointer gap-2"
                          onSelect={() => { setDebtToDelete(debtor.id); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1A1A1A] bg-[#0A0A0A]">
            <p className="text-[12px] text-[#555555]">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredDebtors.length)} of {filteredDebtors.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#555555] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 h-7 flex items-center text-[12px] text-[#CCCCCC] bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#555555] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PartialPaymentDialog
        open={partialPayOpen}
        onOpenChange={setPartialPayOpen}
        debt={selectedDebt}
        onSubmit={submitPartialPayment}
      />

      {/* Full Pay Confirm */}
      <AlertDialog open={fullPayConfirmOpen} onOpenChange={setFullPayConfirmOpen}>
        <AlertDialogContent className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] p-0 max-w-sm shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-[2px] bg-emerald-900/30 border border-emerald-800 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-white">Full Settlement</h3>
                <p className="text-[12px] text-[#555555]">Closing account for {selectedDebt?.customer_name}</p>
              </div>
            </div>
            <div className="p-4 bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
              <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mb-1">Amount Due</p>
              <p className="text-[28px] font-medium text-white">
                रू {(parseFloat(selectedDebt?.amount_owed || "0") - parseFloat(selectedDebt?.amount_paid || "0")).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2 p-4">
            <AlertDialogCancel asChild>
              <button className="flex-1 h-[38px] rounded-[2px] border border-[#303030] text-[13px] text-[#CCCCCC] hover:text-white transition-colors uppercase tracking-[1px]">
                Cancel
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={confirmFullPay}
                className="flex-[2] h-[38px] rounded-[2px] bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] uppercase tracking-[1px] transition-colors"
              >
                Confirm Settlement
              </button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] p-0 max-w-sm shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 border border-[#DA291C]/30 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-[#DA291C]" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-white">Delete Account?</h3>
                <p className="text-[12px] text-[#555555]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[13px] text-[#CCCCCC] mt-3 leading-relaxed">
              You are about to permanently remove the debt record for{" "}
              <span className="text-white font-medium">{debts.find(d => d.id === debtToDelete)?.customer_name}</span>.
            </p>
          </div>
          <div className="flex gap-2 p-4">
            <AlertDialogCancel asChild>
              <button className="flex-1 h-[38px] rounded-[2px] border border-[#303030] text-[13px] text-[#CCCCCC] hover:text-white transition-colors uppercase tracking-[1px]">
                Cancel
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={handleDelete}
                className="flex-[2] h-[38px] rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[13px] uppercase tracking-[1px] transition-colors"
              >
                Delete Permanently
              </button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
