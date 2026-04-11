import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone, Users, Wallet, RefreshCw, ChevronLeft, ChevronRight, Filter, Pencil, Trash2, Calendar, MoreVertical, CreditCard, Banknote, AlertCircle, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { debtService, Debt } from "@/services/debts";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumEmptyState } from "@/components/PremiumEmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DebtDialog } from "@/components/DebtDialog";
import { PartialPaymentDialog } from "@/components/PartialPaymentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
  primaryLight: "#f0fdfa",
};

const ITEMS_PER_PAGE = 9;

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

  const queryClient = useQueryClient();

  useEffect(() => {
    fetchDebts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await debtService.getDebts();
      setDebts(data || []);
    } catch (error) {
      toast.error("Failed to fetch debts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = (debts || []).filter(
    (debtor) => {
      const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
      const matchesSearch = (debtor.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (debtor.customer_phone || "").includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "pending" ? outstanding > 0 :
            outstanding <= 0;

      return matchesSearch && matchesStatus;
    }
  );

  const totalOutstanding = (debts || []).reduce((sum, d) => sum + (parseFloat(d.amount_owed) - parseFloat(d.amount_paid)), 0);

  // Pagination Logic
  const totalPages = Math.ceil(filteredDebtors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDebtors = filteredDebtors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleMarkPaid = async (debtor: Debt) => {
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    if (outstanding <= 0) return;

    setSelectedDebt(debtor);
    setFullPayConfirmOpen(true);
  }

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
  }

  const handlePartialPayment = (debtor: Debt) => {
    setSelectedDebt(debtor);
    setPartialPayOpen(true);
  }

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
  }

  const handleDelete = async () => {
    if (!debtToDelete) return;

    try {
      await debtService.deleteDebt(debtToDelete);
      toast.success("Debt deleted successfully");
      setDebtToDelete(null);
      setDeleteDialogOpen(false);
      fetchDebts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete debt");
    }
  };

  const handleSendSMSReminder = async (debtor: Debt) => {
    if (!debtor.customer_phone) {
      toast.error("No phone number for this customer");
      return;
    }
    const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
    if (outstanding <= 0) return;

    try {
      toast.promise(debtService.sendReminder(debtor.id), {
        loading: `Sending SMS to ${debtor.customer_phone}...`,
        success: "SMS sent successfully!",
        error: "Failed to send SMS. Please check your configuration."
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] -m-6 p-6 space-y-8 pb-20 lg:pb-12 animate-in fade-in duration-500">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 shadow-2xl shadow-slate-200" data-tour="debtors-summary">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Debt Management</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-teal-400" />
              Monitoring <span className="text-white">{(debts || []).length}</span> accounts and collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDebts}
              className="rounded-2xl h-12 w-12 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <DebtDialog onSuccess={fetchDebts} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <Wallet className="h-6 w-6 text-teal-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                <p className="text-2xl font-black text-white">रू {totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Accounts</p>
                <p className="text-2xl font-black text-white">
                  {debts.filter(d => (parseFloat(d.amount_owed) - parseFloat(d.amount_paid)) > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Recovery Rate</span>
                <span className="text-teal-400">
                  {debts.length > 0
                    ? Math.round((debts.filter(d => parseFloat(d.amount_owed) === parseFloat(d.amount_paid)).length / debts.length) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${debts.length > 0 ? (debts.filter(d => parseFloat(d.amount_owed) === parseFloat(d.amount_paid)).length / debts.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center px-2" data-tour="debtors-filters">
        <div className="relative flex-1 w-full lg:w-auto shadow-sm shadow-slate-200">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search accounts by name, phone or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white border-0 rounded-[1.25rem] focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-medium placeholder:text-slate-400 transition-all shadow-inner"
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto h-14">
          <Select value={statusFilter} onValueChange={(v: "all" | "pending" | "paid") => setStatusFilter(v)}>
            <SelectTrigger className="w-full lg:w-[200px] h-full rounded-[1.25rem] border-0 bg-white shadow-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-teal-600" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 p-1 shadow-2xl shadow-slate-200">
              <SelectItem value="all" className="rounded-xl">All Accounts</SelectItem>
              <SelectItem value="pending" className="rounded-xl">Unpaid Only</SelectItem>
              <SelectItem value="paid" className="rounded-xl">Fully Settled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debtors Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-2" data-tour="debtors-list">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-[2rem] bg-white border border-slate-100 p-6 space-y-4 shadow-sm animate-pulse">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl bg-slate-50" />
                <div className="space-y-2 flex-1 pt-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-50" />
                  <Skeleton className="h-3 w-1/2 bg-slate-50" />
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-2xl bg-slate-50" />
              <div className="flex gap-3">
                <Skeleton className="h-11 flex-1 rounded-xl bg-slate-50" />
                <Skeleton className="h-11 flex-1 rounded-xl bg-slate-50" />
              </div>
            </div>
          ))
        ) : (
          paginatedDebtors.map((debtor) => {
            const outstanding = parseFloat(debtor.amount_owed) - parseFloat(debtor.amount_paid);
            const isFullyPaid = outstanding <= 0;

            return (
              <Card key={debtor.id} className={`group rounded-[2rem] border-0 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden ${isFullyPaid ? 'bg-slate-50 opacity-80' : 'bg-white'}`}>
                <CardHeader className="p-6 pb-2 relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/10 ${isFullyPaid ? 'bg-slate-400' : 'bg-teal-600 shadow-teal-200'}`}>
                        {(debtor.customer_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight py-0.5">{debtor.customer_name || "Unknown Account"}</h3>
                        <p className="text-sm font-medium text-slate-400 flex items-center gap-1.5 capitalize">
                          <Phone className="h-3 w-3" />
                          {debtor.customer_phone || "No Phone"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-1 shadow-2xl shadow-slate-200">
                        <DebtDialog debt={debtor} onSuccess={fetchDebts}>
                          <DropdownMenuItem className="gap-2 rounded-xl py-2 cursor-pointer font-medium text-slate-600">
                            <Pencil className="h-4 w-4" /> Edit Record
                          </DropdownMenuItem>
                        </DebtDialog>
                        <DropdownMenuItem
                          className="gap-2 rounded-xl py-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 font-medium"
                          onSelect={() => {
                            setDebtToDelete(debtor.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase border shadow-sm ${isFullyPaid ? 'bg-green-50 text-green-700 border-green-100 shadow-green-100/20' : 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/20'}`}>
                      {isFullyPaid ? "Fully Paid" : "Payment Due"}
                    </Badge>
                    {!isFullyPaid && debtor.due_date && (
                      <div className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] uppercase">
                        <Calendar className={`h-3 w-3 ${new Date(debtor.due_date) < new Date() ? 'animate-pulse' : ''}`} />
                        {new Date(debtor.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${isFullyPaid ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-slate-50 group-hover:bg-teal-50/30 group-hover:border-teal-50'}`}>
                    <div className="flex justify-between items-baseline mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                        <p className={`text-3xl font-black tracking-tight ${isFullyPaid ? 'text-slate-500' : 'text-slate-900 group-hover:text-teal-700 transition-colors'}`}>
                          <span className="text-sm font-bold mr-1">रू</span>
                          {outstanding.toLocaleString()}
                        </p>
                      </div>
                      <ArrowUpRight className={`h-6 w-6 transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isFullyPaid ? 'text-slate-300' : 'text-teal-400'}`} />
                    </div>

                    <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2 shadow-inner">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${isFullyPaid ? 'bg-slate-400' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]'}`}
                        style={{ width: `${(parseFloat(debtor.amount_paid) / parseFloat(debtor.amount_owed)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-0.5">
                      <span>Owed: {parseFloat(debtor.amount_owed).toLocaleString()}</span>
                      <span>Paid: {parseFloat(debtor.amount_paid).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all h-12 shadow-sm"
                      onClick={() => handlePartialPayment(debtor)}
                      disabled={isFullyPaid}
                    >
                      Partial
                    </Button>
                    <Button
                      className={`rounded-2xl font-black transition-all h-12 shadow-lg ${isFullyPaid ? 'bg-slate-200 text-slate-400 pointer-events-none' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 hover:scale-[1.02] active:scale-[0.98]'}`}
                      onClick={() => handleMarkPaid(debtor)}
                      disabled={isFullyPaid}
                    >
                      Settle Full
                    </Button>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors disabled:opacity-0"
                    onClick={() => handleSendSMSReminder(debtor)}
                    disabled={isFullyPaid}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Send Reminder SMS
                  </button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {filteredDebtors.length === 0 && !loading && (
        <Card className="border-0 shadow-sm bg-white p-12 rounded-[3rem] border-dashed border-2 border-slate-100">
          <CardContent className="py-8">
            <PremiumEmptyState
              icon={Users}
              title={debts.length === 0 ? "No Debtors Yet" : "No Match Found"}
              description={
                debts.length === 0
                  ? "Your credit sales will appear here. You can also manually add a new debtor to track their payments."
                  : "We couldn't find any accounts matching your current search or filters. Try a different term."
              }
              action={
                debts.length === 0 ? (
                  <DebtDialog onSuccess={fetchDebts} />
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset All Filters
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 bg-white p-2 rounded-[1.5rem] w-fit mx-auto shadow-sm border border-slate-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl h-10 w-10 hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="px-5 h-10 flex items-center text-sm font-black text-slate-700 bg-slate-50 rounded-[1rem]">
            {currentPage} <span className="text-slate-300 mx-1.5 font-medium">/</span> {totalPages}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl h-10 w-10 hover:bg-slate-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <PartialPaymentDialog
        open={partialPayOpen}
        onOpenChange={setPartialPayOpen}
        debt={selectedDebt}
        onSubmit={submitPartialPayment}
      />

      <AlertDialog open={fullPayConfirmOpen} onOpenChange={setFullPayConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-0 overflow-hidden p-0 max-w-md shadow-2xl overflow-y-auto">
          <div className="bg-slate-900 p-8 text-white text-center relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-teal-500/20 blur-2xl" />
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/20 backdrop-blur-md relative z-10">
              <Banknote className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="text-2xl font-black relative z-10 tracking-tight">Full Settlement</h3>
            <p className="text-slate-400 text-sm mt-1 relative z-10 font-medium">Closing account for {selectedDebt?.customer_name}</p>
          </div>
          <div className="p-8 space-y-8">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Final Amount Due</p>
              <p className="text-4xl font-black text-slate-900 text-center tracking-tighter">
                <span className="text-lg font-bold mr-1 text-slate-400 leading-none align-top pt-1 block sm:inline">रू</span>
                {(parseFloat(selectedDebt?.amount_owed || "0") - parseFloat(selectedDebt?.amount_paid || "0")).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel asChild>
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-slate-500 font-bold hover:bg-slate-50">Back</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button className="flex-[2] h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-200 transition-all active:scale-[0.98]" onClick={confirmFullPay}>Verify Settlement</Button>
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] border-0 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                You are about to permanently remove the debt record for <span className="text-slate-900 font-bold underline decoration-red-200 underline-offset-4">{debts.find(d => d.id === debtToDelete)?.customer_name}</span>. This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-xl flex-1 h-12 border-slate-200 text-slate-500 font-bold">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl flex-1 h-12 font-black shadow-lg shadow-red-200 active:scale-[0.98]"
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
