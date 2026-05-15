import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Users, AlertTriangle, Calendar,
  Plus, ShoppingCart, FileText, ArrowRight, RefreshCw, Package,
  DollarSign, CheckCircle, Info, BarChart3, Receipt, LayoutDashboard,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getReportStats, ReportStats } from "@/services/reportService";
import { getExpenseSummary, type ExpenseSummary } from "@/services/expenseService";
import { getSupplierPayableSummary, type PayableSummary } from "@/services/supplierPayableService";
import { inventoryService } from "@/services/inventory";
import { Product } from "@/types";
import { CountUp } from "@/components/CountUp";
import { PremiumEmptyState } from "@/components/PremiumEmptyState";

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

function StatSkeleton() {
  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24 bg-[#1A1A1A]" />
        <Skeleton className="h-8 w-8 rounded-[2px] bg-[#1A1A1A]" />
      </div>
      <Skeleton className="h-7 w-28 bg-[#1A1A1A] mb-2" />
      <Skeleton className="h-3 w-20 bg-[#1A1A1A]" />
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 bg-[#1A1A1A]" />
            <Skeleton className="h-2.5 w-20 bg-[#1A1A1A]" />
          </div>
          <Skeleton className="h-5 w-10 rounded-[2px] bg-[#1A1A1A]" />
        </div>
      ))}
    </div>
  );
}

// Reusable section card
function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1A1A1A]">
        <Icon className="w-4 h-4 text-[#DA291C]" />
        <h3 className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-NP");
  const [range, setRange] = useState("today");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [payableSummary, setPayableSummary] = useState<PayableSummary | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [reportStats, allProducts, expenses, payables] = await Promise.all([
        getReportStats(range),
        inventoryService.getProducts(200, 0),
        getExpenseSummary(range),
        getSupplierPayableSummary(),
      ]);
      setStats(reportStats);
      setProducts(allProducts);
      setExpenseSummary(expenses);
      setPayableSummary(payables);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lowStockItems = products.filter((p) => {
    const threshold = typeof p.low_stock_threshold === "number"
      ? p.low_stock_threshold
      : ((p.low_stock_threshold as { Int32: number; Valid: boolean })?.Int32 ?? 0);
    return p.stock_quantity <= threshold && threshold > 0;
  });

  const nearExpiryItems = products.filter((p) => {
    const expiresAt = p.expires_at;
    if (!expiresAt || !expiresAt.Valid) return false;
    const days = Math.floor((new Date(expiresAt.Time).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });

  const rangeLabel = RANGE_OPTIONS.find(r => r.value === range)?.label ?? "Today";

  const saleTypeColor = (type: string) => ({
    cash: { dot: "bg-emerald-500", text: "text-emerald-400", badge: "border-emerald-800 bg-emerald-900/30 text-emerald-400" },
    credit: { dot: "bg-amber-500", text: "text-amber-400", badge: "border-amber-800 bg-amber-900/30 text-amber-400" },
    online: { dot: "bg-blue-500", text: "text-blue-400", badge: "border-blue-800 bg-blue-900/30 text-blue-400" },
  }[type] ?? { dot: "bg-[#555]", text: "text-[#8F8F8F]", badge: "border-[#303030] bg-[#1A1A1A] text-[#8F8F8F]" });

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5 pb-24 lg:pb-8">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Overview</p>
          <h1 className="text-[22px] font-medium text-white tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Range Selector */}
          <div className="flex items-center gap-0.5 bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-[2px] text-[11px] font-normal uppercase tracking-[0.8px] transition-all ${range === opt.value
                  ? "bg-[#DA291C] text-white"
                  : "text-[#666666] hover:text-[#CCCCCC]"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="h-8 w-8 rounded-[2px] flex items-center justify-center border border-[#1A1A1A] bg-[#111111] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#666666] ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {/* Date */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] border border-[#1A1A1A] bg-[#111111]">
            <span className="text-[12px] text-[#8F8F8F]">{today}</span>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 p-3 bg-[#DA291C]/10 border-l-2 border-[#DA291C]">
          <AlertTriangle className="h-4 w-4 text-[#DA291C] shrink-0" />
          <span className="flex-1 text-[13px] text-[#DA291C]">{error}</span>
          <button
            onClick={() => fetchData()}
            className="text-[11px] uppercase tracking-[1px] text-[#DA291C] border border-[#DA291C]/30 px-2 py-1 rounded-[2px] hover:bg-[#DA291C]/10 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Empty State for New Users */}
      {!loading && !error && stats && stats.inventory.total_products === 0 && stats.sales.count === 0 && (
        <motion.div variants={fadeUp} className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-12 text-center">
          <LayoutDashboard className="w-10 h-10 text-[#303030] mx-auto mb-4" />
          <h3 className="text-[16px] font-medium text-white mb-2">Welcome to StoreHub</h3>
          <p className="text-[13px] text-[#8F8F8F] mb-6 max-w-sm mx-auto leading-relaxed">
            Your business command center is ready. Add products and start recording sales.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/inventory" className="h-[36px] px-4 rounded-[2px] bg-[#DA291C] text-white text-[12px] uppercase tracking-[1px] flex items-center gap-2 hover:bg-[#B01E0A] transition-colors">
              <Package className="w-3.5 h-3.5" /> Add Products
            </Link>
            <Link to="/sales" className="h-[36px] px-4 rounded-[2px] border border-[#303030] text-[#8F8F8F] text-[12px] uppercase tracking-[1px] flex items-center gap-2 hover:text-white hover:border-[#8F8F8F] transition-colors">
              <ShoppingCart className="w-3.5 h-3.5" /> Go to POS
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-cards">
        {loading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            {/* Sales */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">{rangeLabel} Sales</p>
                <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#DA291C]" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={stats?.sales?.total ?? 0} />
              </div>
              {stats?.sales?.growth !== undefined ? (
                <p className={`text-[12px] flex items-center gap-1 ${stats.sales.growth >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                  {stats.sales.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.sales.growth >= 0 ? "+" : ""}{stats.sales.growth.toFixed(1)}% vs prev. period
                </p>
              ) : (
                <p className="text-[12px] text-[#555555]"><CountUp to={stats?.sales?.count ?? 0} /> transactions</p>
              )}
            </div>

            {/* Debts */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Outstanding Debts</p>
                <div className="h-8 w-8 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={stats?.debts?.total_outstanding ?? 0} />
              </div>
              <p className="text-[12px] text-[#555555]"><CountUp to={stats?.debts?.total_debtors ?? 0} /> customers</p>
            </div>

            {/* Low Stock */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Low Stock</p>
                <div className="h-8 w-8 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                <CountUp to={stats?.inventory?.low_stock ?? lowStockItems.length} />
              </div>
              <p className="text-[12px] text-amber-400">Require attention</p>
            </div>

            {/* Near Expiry */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Near Expiry</p>
                <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#DA291C]" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                <CountUp to={nearExpiryItems.length} />
              </div>
              <p className="text-[12px] text-[#DA291C]">Within 30 days</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Financial Stat Cards */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            {/* Total Expenses */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">{rangeLabel} Expenses</p>
                <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-[#DA291C]" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={expenseSummary?.summary?.total_amount ?? 0} />
              </div>
              <p className="text-[12px] text-[#555555]">{expenseSummary?.summary?.total_count ?? 0} transactions</p>
            </div>

            {/* Net Profit */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Net Profit</p>
                <div className="h-8 w-8 rounded-[2px] bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={(stats?.profit?.gross_profit ?? 0) - (expenseSummary?.summary?.total_amount ?? 0)} />
              </div>
              <p className="text-[12px] text-[#555555]">After expenses</p>
            </div>

            {/* Supplier Payables */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Supplier Owed</p>
                <div className="h-8 w-8 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={payableSummary?.summary?.total_outstanding ?? 0} />
              </div>
              <p className="text-[12px] text-[#555555]">{payableSummary?.summary?.total_count ?? 0} invoices</p>
            </div>

            {/* Overdue Payables */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 hover:border-[#303030] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#555555] uppercase tracking-[1px]">Overdue</p>
                <div className="h-8 w-8 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#DA291C]" />
                </div>
              </div>
              <div className="text-[24px] font-medium text-white mb-1">
                रू <CountUp to={payableSummary?.summary?.total_overdue ?? 0} />
              </div>
              <p className="text-[12px] text-[#DA291C]">{payableSummary?.overdue?.length ?? 0} suppliers</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp} data-tour="quick-actions">
        <SectionCard title="Quick Actions" icon={ShoppingCart}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/sales" className="h-[40px] rounded-[2px] bg-[#DA291C] text-white text-[12px] uppercase tracking-[1px] flex items-center justify-center gap-2 hover:bg-[#B01E0A] transition-colors font-normal">
              <ShoppingCart className="h-3.5 w-3.5" /> New Sale
            </Link>
            <Link to="/inventory" className="h-[40px] rounded-[2px] border border-[#303030] text-[#8F8F8F] text-[12px] uppercase tracking-[1px] flex items-center justify-center gap-2 hover:text-white hover:border-[#555555] transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Link>
            <Link to="/debtors" className="h-[40px] rounded-[2px] border border-[#303030] text-[#8F8F8F] text-[12px] uppercase tracking-[1px] flex items-center justify-center gap-2 hover:text-white hover:border-[#555555] transition-colors">
              <Users className="h-3.5 w-3.5" /> View Debtors
            </Link>
            <Link to="/reports" className="h-[40px] rounded-[2px] border border-[#303030] text-[#8F8F8F] text-[12px] uppercase tracking-[1px] flex items-center justify-center gap-2 hover:text-white hover:border-[#555555] transition-colors">
              <FileText className="h-3.5 w-3.5" /> View Reports
            </Link>
          </div>
        </SectionCard>
      </motion.div>

      {/* Smart Insights */}
      <AnimatePresence mode="wait">
        {(loading || (stats?.insights && stats.insights.length > 0)) && (
          <motion.div variants={fadeUp} key="insights" initial="hidden" animate="visible" exit="hidden">
            <SectionCard title="Smart Insights" icon={Info}>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full bg-[#1A1A1A] rounded-[2px]" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {stats!.insights.map((insight, i) => {
                    const colors = insight.type === "success"
                      ? { border: "border-l-emerald-500", bg: "bg-emerald-900/10", icon: <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />, text: "text-emerald-300" }
                      : insight.type === "warning"
                        ? { border: "border-l-amber-500", bg: "bg-amber-900/10", icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />, text: "text-amber-300" }
                        : { border: "border-l-blue-500", bg: "bg-blue-900/10", icon: <Info className="h-4 w-4 text-blue-400 shrink-0" />, text: "text-blue-300" };
                    return (
                      <div key={i} className={`border-l-2 p-3 flex items-start gap-3 ${colors.border} ${colors.bg}`}>
                        {colors.icon}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] ${colors.text}`}>{insight.message}</p>
                          {insight.details && insight.details.length > 0 && (
                            <p className="text-[11px] text-[#555555] mt-0.5">
                              {insight.details.slice(0, 3).join(", ")}
                              {insight.details.length > 3 ? ` +${insight.details.length - 3} more` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Breakdown + Profit Side by Side */}
      <motion.div variants={fadeUp} className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="Payment Breakdown" icon={BarChart3}>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full bg-[#1A1A1A] rounded-[2px]" />)}</div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Cash", value: stats?.sales?.cash ?? 0, bar: "bg-emerald-500" },
                { label: "Credit", value: stats?.sales?.credit ?? 0, bar: "bg-amber-500" },
                { label: "Online", value: stats?.sales?.online ?? 0, bar: "bg-blue-500" },
              ].map(({ label, value, bar }) => {
                const total = stats?.sales?.total ?? 1;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-[#8F8F8F]">{label}</span>
                      <span className="text-[12px] text-white">
                        रू {value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Profit Summary" icon={DollarSign}>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full bg-[#1A1A1A] rounded-[2px]" />)}</div>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Total Revenue", value: stats?.profit?.total_revenue ?? 0, cls: "text-white" },
                { label: "Total Cost", value: stats?.profit?.total_cost ?? 0, cls: "text-[#DA291C]" },
                { label: "Gross Profit", value: stats?.profit?.gross_profit ?? 0, cls: "text-emerald-400 font-medium" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-3 py-2.5">
                  <span className="text-[12px] text-[#8F8F8F]">{label}</span>
                  <span className={`text-[13px] ${cls}`}>
                    रू {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Alerts */}
      <motion.div variants={fadeUp} className="grid gap-3 lg:grid-cols-2" data-tour="dashboard-alerts">
        {/* Low Stock */}
        <SectionCard title="Low Stock Alerts" icon={AlertTriangle}>
          {loading ? <ListSkeleton /> : lowStockItems.length === 0 ? (
            <p className="text-[13px] text-[#555555]">All items are well stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3 hover:bg-[#1A1A1A] transition-colors">
                  <div>
                    <p className="text-[13px] text-white font-medium">{product.name}</p>
                    <p className="text-[11px] text-[#555555]">Stock: {product.stock_quantity} units</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-[2px] bg-amber-900/30 text-amber-400 border border-amber-800">Low</span>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <Link to="/inventory" className="flex items-center justify-center gap-1.5 text-[12px] text-[#8F8F8F] hover:text-white transition-colors pt-1">
                  View all {lowStockItems.length} items <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </SectionCard>

        {/* Near Expiry */}
        <SectionCard title="Near Expiry Products" icon={Calendar}>
          {loading ? <ListSkeleton /> : nearExpiryItems.length === 0 ? (
            <p className="text-[13px] text-[#555555]">No products expiring soon.</p>
          ) : (
            <div className="space-y-2">
              {nearExpiryItems.slice(0, 3).map(product => {
                const expiresAt = product.expires_at!;
                const days = Math.floor((new Date(expiresAt.Time).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={product.id} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3 hover:bg-[#1A1A1A] transition-colors">
                    <div>
                      <p className="text-[13px] text-white font-medium">{product.name}</p>
                      <p className="text-[11px] text-[#555555]">Expires: {new Date(expiresAt.Time).toLocaleDateString("en-NP")}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-[2px] bg-[#DA291C]/10 text-[#DA291C] border border-[#DA291C]/30">{days}d</span>
                  </div>
                );
              })}
              {nearExpiryItems.length > 3 && (
                <Link to="/inventory" className="flex items-center justify-center gap-1.5 text-[12px] text-[#8F8F8F] hover:text-white transition-colors pt-1">
                  View all {nearExpiryItems.length} items <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Top Selling + Top Debtors */}
      <motion.div variants={fadeUp} className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="Top Selling Products" icon={Package}>
          {loading ? <ListSkeleton /> : !stats?.sales?.top_products?.length ? (
            <p className="text-[13px] text-[#555555]">No sales data for this period.</p>
          ) : (
            <div className="space-y-2">
              {stats.sales.top_products.slice(0, 5).map((product, i) => (
                <div key={i} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3 hover:bg-[#1A1A1A] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-[2px] flex items-center justify-center text-[11px] font-bold text-white bg-[#DA291C]">{i + 1}</span>
                    <p className="text-[13px] text-white">{product.product_name}</p>
                  </div>
                  <span className="text-[11px] text-[#8F8F8F] border border-[#303030] px-2 py-0.5 rounded-[2px]">{product.total_quantity} sold</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Top Debtors" icon={Users}>
          {loading ? <ListSkeleton /> : !stats?.debts?.top_debtors?.length ? (
            <p className="text-[13px] text-[#555555]">No outstanding debts.</p>
          ) : (
            <div className="space-y-2">
              {stats.debts.top_debtors.slice(0, 5).map((debtor, i) => (
                <div key={i} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3 hover:bg-[#1A1A1A] transition-colors">
                  <div>
                    <p className="text-[13px] text-white font-medium">{debtor.customer_name}</p>
                    <p className="text-[11px] text-[#555555]">{debtor.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium text-[#DA291C]">रू {debtor.total_debt.toLocaleString()}</p>
                    <p className="text-[10px] text-[#555555]">awaiting pay</p>
                  </div>
                </div>
              ))}
              <Link to="/debtors" className="flex items-center justify-center gap-1.5 text-[12px] text-[#8F8F8F] hover:text-white transition-colors pt-1">
                View all debtors <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={fadeUp}>
        <SectionCard title="Recent Transactions" icon={Receipt}>
          {loading ? <ListSkeleton rows={5} /> : !stats?.sales?.recent?.length ? (
            <p className="text-[13px] text-[#555555]">No recent transactions.</p>
          ) : (
            <div className="space-y-2">
              {stats.sales.recent.map(sale => {
                const c = saleTypeColor(sale.sales_type);
                return (
                  <div key={sale.id} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] p-3 hover:bg-[#1A1A1A] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                      <div>
                        <p className="text-[13px] text-white">{sale.customer_name || "Walk-in Customer"}</p>
                        <p className="text-[11px] text-[#555555]">
                          {new Date(sale.sale_date).toLocaleString("en-NP", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-white">
                        रू {sale.total_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <span className={`text-[10px] uppercase tracking-[0.8px] px-1.5 py-0.5 rounded-[2px] border ${c.badge}`}>
                        {sale.sales_type}
                      </span>
                    </div>
                  </div>
                );
              })}
              <Link to="/reports" className="flex items-center justify-center gap-1.5 text-[12px] text-[#8F8F8F] hover:text-white transition-colors pt-1">
                View all transactions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </SectionCard>
      </motion.div>

    </motion.div>
  );
}
