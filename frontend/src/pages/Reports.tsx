import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/CountUp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  FileText,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ShoppingCart,
  ArrowRight,
  Clock,
  RefreshCw,
  Tag,
  Link2,
  ChevronDown,
  ChevronUp,
  Flame,
  Brain,
  Info,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { getReportStats } from "@/services/reportService";
import { getExpenseSummary, getExpenses, EXPENSE_CATEGORIES } from "@/services/expenseService";
import { getSupplierPayableSummary, getSupplierPayables } from "@/services/supplierPayableService";
import type { Insight, ReportStats } from "@/services/reportService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeatureTooltip } from "@/components/FeatureTooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  Tooltip as RechartsTooltip,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY = "#DA291C";
const PRIMARY_DARK = "#B01E0A";
const COLORS = ["#DA291C", "#E85D52", "#8B1A12", "#FF6B5E", "#C44035", "#F09590"];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i === 12) return "12pm";
  return i < 12 ? `${i}am` : `${i - 12}pm`;
});

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightIcon({ type }: { type: Insight["type"] }) {
  switch (type) {
    case "success":    return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />;
    case "warning":    return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
    case "alert":      return <Flame className="h-4 w-4 text-[#DA291C] shrink-0 mt-0.5" />;
    case "opportunity":return <Zap className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />;
    default:           return <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />;
  }
}

function insightBorder(type: Insight["type"]) {
  return {
    success:     "border-l-emerald-500 bg-emerald-900/20",
    warning:     "border-l-amber-500 bg-amber-900/20",
    alert:       "border-l-[#DA291C] bg-[#DA291C]/10",
    opportunity: "border-l-violet-500 bg-violet-900/20",
    info:        "border-l-sky-500 bg-sky-900/20",
  }[type] ?? "border-l-[#303030] bg-[#1A1A1A]";
}

function insightActionLabel(action: string | undefined): string {
  switch (action) {
    case "view_sales":      return "See Sales →";
    case "view_debtors":    return "See Debtors →";
    case "view_dead_stock": return "See Dead Stock →";
    case "view_velocity":   return "Restock Now →";
    case "view_basket":     return "See Bundles →";
    default:                return "View →";
  }
}

// ── Daily Insights Feed ───────────────────────────────────────────────────────
function InsightsFeed({ insights }: { insights: Insight[] }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const shown = expanded ? insights : insights.slice(0, 3);

  const handleAction = (action: string | undefined) => {
    if (action === "view_debtors") navigate("/debtors");
    else if (action === "view_sales") navigate("/sales");
    else if (action === "view_velocity" || action === "view_dead_stock" || action === "view_basket") {
      const el = document.getElementById(action);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!insights || insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]" data-tour="reports-insights">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
              <Brain className="h-4 w-4 text-[#DA291C]" />
            </div>
            <span className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">Daily Insights</span>
            <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#DA291C]/10 text-[#DA291C] font-medium">
              {insights.length} new
            </span>
          </div>
          <span className="text-[11px] text-[#888888]">Smart Analysis · Just Now</span>
        </div>
        <div className="p-5 space-y-2.5">
          <AnimatePresence mode="popLayout">
            {shown.map((insight, i) => (
              <motion.div
                key={`${i}-${insight.type}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-[2px] border-l-2 transition-all duration-200 group",
                  insightBorder(insight.type)
                )}
              >
                <InsightIcon type={insight.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#CCCCCC] leading-snug">{insight.message}</p>
                </div>
                {insight.action && (
                  <button
                    className="text-[11px] px-2 py-1 shrink-0 text-[#8F8F8F] hover:text-white uppercase tracking-[0.5px] transition-colors"
                    onClick={() => handleAction(insight.action)}
                  >
                    {insightActionLabel(insight.action)}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {insights.length > 3 && (
            <button
              className="w-full text-[#888888] hover:text-[#8F8F8F] text-[11px] uppercase tracking-[1px] py-2 flex items-center justify-center gap-1 transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Show less" : `Show ${insights.length - 3} more insights`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature 2: Dead Stock Cash Trap ──────────────────────────────────────────
function DeadStockWidget({ deadStock }: { deadStock: ReportStats["dead_stock"] }) {
  const [open, setOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(20); // default 20%
  const queryClient = useQueryClient();

  const applyDiscountMutation = useMutation({
    mutationFn: async () => {
      const items = deadStock?.items || [];
      const promises = items.map(item => {
        const newPrice = item.cost_price * (1 - (discountPercent / 100));
        // Using inventoryService to update price
        return inventoryService.updateProduct(item.product_id, {
          price: Math.max(newPrice, 0.01) // ensure it's not 0 or negative
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`${deadStock.items.length} items discounted!`);
      queryClient.invalidateQueries({ queryKey: ["reportStats"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to apply discounts.");
    }
  });

  const navigate = useNavigate();
  if (!deadStock) return null;

  const total = deadStock.total_60d ?? 0;
  const byCategory = deadStock.by_category ?? [];
  const max = Math.max(...byCategory.map((c) => c.total), 1);

  const thresholdData = [
    { label: "60+ days", value: deadStock.total_60d ?? 0, color: "#f59e0b" },
    { label: "90+ days", value: deadStock.total_90d ?? 0, color: "#f97316" },
    { label: "120+ days", value: deadStock.total_120d ?? 0, color: "#ef4444" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div id="view_dead_stock" className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-[2px] bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">Dead Stock Cash Trap</span>
          </div>
            
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="text-[11px] h-7 px-3 flex items-center gap-1.5 rounded-[2px] border border-amber-800 text-amber-400 hover:bg-amber-900/30 transition-colors uppercase tracking-[0.5px]">
                <Tag className="h-3 w-3" />
                Create Discount
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#111111] border-[#303030]">
              <DialogHeader>
                <DialogTitle className="text-white">Discount Dead Stock</DialogTitle>
                <DialogDescription className="text-[#8F8F8F]">
                  You have {(deadStock?.items || []).length} items that haven't sold in 60+ days. Apply a bulk markdown to liquidate them and recover your capital.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#8F8F8F]">Discount Percentage (%)</Label>
                  <div className="flex items-center gap-2">
                     <Input 
                       type="number" 
                       min={1} 
                       max={99} 
                       value={discountPercent} 
                       onChange={(e) => setDiscountPercent(Number(e.target.value))} 
                       className="w-full bg-[#0A0A0A] border-[#303030] text-white"
                     />
                     <span className="text-xl font-medium text-white">%</span>
                  </div>
                </div>
                <div className="text-[12px] text-[#8F8F8F] bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-[2px] space-y-2">
                  <p className="font-medium text-white">Items to be updated:</p>
                  <ul className="list-disc pl-4 grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                    {(deadStock?.items || []).map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item.product_name} 
                        <span className="text-[#888888] ml-1">(-{discountPercent}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <button className="px-4 py-2 rounded-[2px] border border-[#303030] text-[#8F8F8F] text-[12px] uppercase tracking-[1px] hover:text-white transition-colors" onClick={() => setOpen(false)}>Cancel</button>
                <button 
                  className="px-4 py-2 rounded-[2px] bg-amber-600 hover:bg-amber-700 text-white text-[12px] uppercase tracking-[1px] disabled:opacity-50 flex items-center gap-2 transition-colors" 
                  onClick={() => applyDiscountMutation.mutate()}
                  disabled={applyDiscountMutation.isPending || !deadStock?.items?.length}
                >
                  {applyDiscountMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Slash Prices
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-[#888888] uppercase tracking-[1px] mb-1">Capital Tied Up</p>
                <p className="text-[28px] font-medium text-amber-400">
                  रू <CountUp to={total} />
                </p>
                <p className="text-[12px] text-[#888888] mt-1">Unsold for 60+ days</p>
              </div>
              <div className="space-y-2">
                {thresholdData.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-[11px] text-[#8F8F8F] w-20">{t.label}</span>
                    <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-[2px] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${total > 0 ? (t.value / total) * 100 : 0}%` }}
                        viewport={{ once: true }}
                        className="h-full rounded-[2px]"
                        style={{ backgroundColor: t.color }}
                        transition={{ duration: 1, ease: "circOut" }}
                      />
                    </div>
                    <span className="text-[12px] font-medium text-[#CCCCCC] w-24 text-right">रू {t.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">By Category</p>
              {byCategory.length === 0 ? (
                <p className="text-[13px] text-[#888888] py-4 text-center">Clear! 🎉</p>
              ) : (
                byCategory.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#CCCCCC] truncate">{cat.category || "General"}</span>
                      <span className="text-[#8F8F8F]">रू {cat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1A] rounded-[2px] overflow-hidden">
                      <div
                        className="h-full rounded-[2px] bg-amber-500"
                        style={{ width: `${(cat.total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature 3: Predictive Velocity Restocking ─────────────────────────────────
function VelocityTable({ items }: { items: ReportStats["velocity"] }) {
  const urgency = (days: number) => {
    if (days <= 7) return { bg: "bg-[#DA291C]/5", badge: "bg-[#DA291C]/20 text-[#DA291C]", label: "Critical" };
    if (days <= 14) return { bg: "bg-amber-900/10", badge: "bg-amber-900/30 text-amber-400", label: "Low" };
    return { bg: "hover:bg-[#1A1A1A]", badge: "bg-emerald-900/30 text-emerald-400", label: "Healthy" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div id="view_velocity" className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-[#DA291C]" />
            </div>
            <span className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">Velocity Tracking</span>
          </div>
          <span className="text-[11px] text-[#888888]">Predictive Restock Analysis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#0A0A0A]">
                <th className="text-left px-4 py-2.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">Product</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">Stock</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">Daily Avg</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">Days Left</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {(items || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#888888] italic text-[13px]">
                    No velocity data available for this period. 
                  </td>
                </tr>
              ) : (
                items.slice(0, 10).map((item, i) => {
                  const u = urgency(item.estimated_days_to_stockout);
                  return (
                    <tr key={i} className={cn("transition-colors", u.bg)}>
                      <td className="px-4 py-3 text-[#CCCCCC]">{item.product_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-white">{item.stock_quantity}</td>
                      <td className="px-4 py-3 text-right text-[#8F8F8F]">{Number(item.avg_daily_sales).toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-white">
                        {item.estimated_days_to_stockout > 365 ? "365+" : item.estimated_days_to_stockout}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px]", u.badge)}>
                          {u.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature 4: Market Basket Analysis ────────────────────────────────────────
function BasketWidget({ pairs }: { pairs: ReportStats["basket_pairs"] }) {
  const maxFreq = Math.max(...(pairs?.map((p) => p.pair_frequency) || [1]), 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div id="view_basket" className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] h-full">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1A1A1A]">
          <div className="h-7 w-7 rounded-[2px] bg-violet-900/30 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-violet-400" />
          </div>
          <span className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">Smart Bundles</span>
        </div>
        <div className="p-5 space-y-3">
          {(pairs || []).slice(0, 5).map((pair, i) => {
            const pct = Math.round((pair.pair_frequency / maxFreq) * 100);
            return (
              <div key={i} className="group flex items-center gap-3 p-3 rounded-[2px] bg-[#0A0A0A] hover:bg-[#1A1A1A] transition-all border border-[#1A1A1A] hover:border-[#303030]">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#CCCCCC] truncate">{pair.product_a_name}</p>
                  <div className="flex items-center gap-1 my-1">
                    <Link2 className="h-3 w-3 text-violet-400" />
                    <div className="h-[1px] flex-1 bg-violet-500/20" />
                  </div>
                  <p className="text-[12px] text-[#CCCCCC] truncate">{pair.product_b_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium text-violet-400 uppercase tracking-[0.5px]">{pair.pair_frequency}× Pairs</span>
                  <div className="w-12 h-1 bg-[#1A1A1A] rounded-[2px] mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-violet-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature 5: Traffic Heatmap ────────────────────────────────────────────────
function TrafficHeatmap({ cells }: { cells: ReportStats["traffic_heatmap"] }) {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number } | null>(null);

  const matrix = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    (cells || []).forEach((c) => {
      const dayIdx = c.day_of_week - 1; 
      if (dayIdx >= 0 && dayIdx < 7 && c.hour_of_day >= 0 && c.hour_of_day < 24) {
        m[dayIdx][c.hour_of_day] = c.transaction_count;
      }
    });
    return m;
  }, [cells]);

  const maxCount = useMemo(() => Math.max(...(cells?.map((c) => c.transaction_count) || [1]), 1), [cells]);

  const cellColor = (count: number): string => {
    if (count === 0) return "#1A1A1A";
    const intensity = count / maxCount;
    const r = Math.round(30 + intensity * 188);
    const g = Math.round(26 + intensity * 15);
    const b = Math.round(28 + intensity * 0);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1A1A1A]">
          <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-[#DA291C]" />
          </div>
          <span className="text-[12px] font-normal text-[#8F8F8F] uppercase tracking-[1px]">Peak Traffic Hours</span>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">
              <div className="flex mb-2 ml-12">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="flex-1 text-center text-[10px] font-medium text-[#888888] uppercase tracking-[0.5px]">{d}</div>
                ))}
              </div>
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex items-center mb-0.5">
                  <div className="w-12 text-right pr-2 text-[9px] font-normal text-[#888888] shrink-0 tabular-nums">
                    {hour % 3 === 0 ? HOUR_LABELS[hour] : ""}
                  </div>
                  {Array.from({ length: 7 }, (_, day) => {
                    const count = matrix[day][hour];
                    return (
                      <TooltipProvider key={day}>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.15, zIndex: 10 }}
                              className="flex-1 h-3.5 mx-0.5 rounded-[2px] cursor-help"
                              style={{ backgroundColor: cellColor(count) }}
                              onMouseEnter={() => setHoveredCell({ day, hour, count })}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="text-[10px] font-medium bg-[#1A1A1A] border-[#303030] text-white">
                            {DAY_LABELS[day]} · {HOUR_LABELS[hour]} · {count} tx
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── KPI Summary Card ──────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, iconBg, valueColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconBg?: string;
  valueColor?: string;
}) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  return (
    <motion.div whileHover={{ y: -2 }}>
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5 h-full hover:border-[#303030] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">{label}</p>
          <div className={cn("h-8 w-8 rounded-[2px] flex items-center justify-center", iconBg ?? "bg-[#DA291C]/10")}>
            {icon}
          </div>
        </div>
        <div className={cn("text-[24px] font-medium flex items-baseline gap-1", valueColor ?? "text-white")}>
          {value.includes("रू") && <span className="text-[12px] text-[#888888]">रू</span>}
          <CountUp to={numericValue} />
        </div>
        {sub && <p className="text-[12px] text-[#888888] mt-1 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reports() {
  const [dateRange, setDateRange] = useState("month");
  const navigate = useNavigate();

  const handleExportPDF = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportPDF(dateRange);
      toast.success("Generating PDF...");
    });
  };

  const handleExportCSV = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportCSV(dateRange);
      toast.success("Exporting CSV...");
    });
  };

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["reportStats", dateRange],
    queryFn: () => getReportStats(dateRange),
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ["expenseSummary", dateRange],
    queryFn: () => getExpenseSummary(dateRange),
  });

  const { data: payableSummary } = useQuery({
    queryKey: ["payableSummary"],
    queryFn: getSupplierPayableSummary,
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#DA291C] opacity-50" />
      <p className="text-[11px] text-[#888888] uppercase tracking-[1px] animate-pulse">Analyzing Store Pulse...</p>
    </div>
  );

  if (isError || !stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <AlertTriangle className="h-10 w-10 text-[#DA291C]/50" />
      <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">Intelligence Service Offline</p>
    </div>
  );

  const { sales, inventory, debts, profit, insights, dead_stock, velocity, basket_pairs, traffic_heatmap } = stats;
  const totalSalesVal = Number(sales.total) || 0;
  const totalOutstanding = Number(debts.total_outstanding) || 0;

  return (
    <motion.div 
      className="space-y-6 pb-24 lg:pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="reports-header">
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Analytics</p>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Intelligence Hub</h1>
        </div>
        <div className="flex items-center gap-2" data-tour="reports-export">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
              <Calendar className="h-3 w-3 mr-2 text-[#888888]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <FeatureTooltip
            featureKey="reports_export"
            title="Download Reports"
            description="Generate professional PDF or CSV reports for your store's performance to share with your team or accountant."
            placement="bottom"
          >
            <div className="flex items-center gap-1">
              <button onClick={handleExportPDF} className="h-9 w-9 rounded-[2px] flex items-center justify-center border border-[#1A1A1A] bg-[#111111] hover:bg-[#1A1A1A] transition-colors"><FileText className="h-4 w-4 text-[#666666]" /></button>
              <button onClick={handleExportCSV} className="h-9 w-9 rounded-[2px] flex items-center justify-center border border-[#1A1A1A] bg-[#111111] hover:bg-[#1A1A1A] transition-colors"><Download className="h-4 w-4 text-[#666666]" /></button>
            </div>
          </FeatureTooltip>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && <InsightsFeed insights={insights} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="reports-kpis">
        <KPICard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} label="Total Sales" value={`रू ${totalSalesVal}`} sub={`${sales.count} Transactions`} iconBg="bg-emerald-900/30" valueColor="text-emerald-400" />
        <KPICard icon={<Zap className="h-4 w-4 text-[#DA291C]" />} label="Gross Profit" value={`रू ${profit.gross_profit}`} sub={`${profit.total_revenue > 0 ? Math.round((Number(profit.gross_profit) / Number(profit.total_revenue)) * 100) : 0}% Margin`} />
        <KPICard icon={<Package className="h-4 w-4 text-sky-400" />} label="Inventory Value" value={`रू ${inventory.total_value}`} sub={`${inventory.total_products} Skus`} iconBg="bg-sky-900/30" />
        <KPICard icon={<Users className="h-4 w-4 text-[#DA291C]" />} label="Receivables" value={`रू ${totalOutstanding}`} sub={`from ${debts.total_debtors} Debtors`} iconBg="bg-[#DA291C]/10" valueColor="text-[#DA291C]" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DeadStockWidget deadStock={dead_stock} />
        <BasketWidget pairs={basket_pairs} />
      </div>

      <VelocityTable items={velocity} />
      <TrafficHeatmap cells={traffic_heatmap} />

      {/* Detailed Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-[#111111] border border-[#1A1A1A] p-0.5 rounded-[2px] w-fit">
          <TabsTrigger value="sales" className="rounded-[2px] px-5 text-[11px] uppercase tracking-[1px] text-[#666666] data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-[2px] px-5 text-[11px] uppercase tracking-[1px] text-[#666666] data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">Inventory</TabsTrigger>
          <TabsTrigger value="debtors" className="rounded-[2px] px-5 text-[11px] uppercase tracking-[1px] text-[#666666] data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">Debtors</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-[2px] px-5 text-[11px] uppercase tracking-[1px] text-[#666666] data-[state=active]:bg-[#DA291C] data-[state=active]:text-white">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
             <div className="md:col-span-2 bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                  <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Sales Volume Trend</span>
                </div>
                <div className="p-5 h-64">
                   <ResponsiveContainer>
                      <ComposedChart data={sales.daily_trend}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                         <XAxis dataKey="sale_date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#555555'}} tickFormatter={(v) => new Date(v).toLocaleDateString([], {day: 'numeric', month: 'short'})} />
                         <YAxis hide />
                         <RechartsTooltip contentStyle={{borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC'}} />
                         <Bar dataKey="daily_total" fill={PRIMARY} radius={[2, 2, 0, 0]} opacity={0.3} />
                         <Line type="monotone" dataKey="daily_total" stroke={PRIMARY} strokeWidth={2} dot={{r: 3, fill: PRIMARY, strokeWidth: 0}} />
                      </ComposedChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                  <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Top Sellers</span>
                </div>
                <div className="p-5 space-y-4">
                   {sales.top_products?.slice(0, 5).map(p => (
                      <div key={p.product_id} className="flex items-center justify-between">
                         <span className="text-[12px] text-[#CCCCCC] truncate pr-4">{p.product_name}</span>
                         <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#DA291C]/10 text-[#DA291C] font-medium shrink-0">{p.total_quantity} sold</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
           <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                 <div className="px-5 py-4 border-b border-[#1A1A1A]">
                   <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Stock Distribution</span>
                 </div>
                 <div className="p-5 h-64 flex flex-col items-center">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={inventory.stock_by_category} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="product_count">
                           {inventory.stock_by_category?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                       {inventory.stock_by_category?.map((c, i) => (
                          <div key={i} className="flex items-center gap-1 text-[10px] text-[#8F8F8F]">
                             <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                             {c.category_name}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                 <div className="px-5 py-4 border-b border-[#1A1A1A]">
                   <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Revenue by Category</span>
                 </div>
                 <div className="p-5 h-64">
                    <ResponsiveContainer>
                       <BarChart data={inventory.revenue_by_category} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="category_name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#8F8F8F'}} width={80} />
                          <Bar dataKey="total_revenue" fill={PRIMARY} radius={[0, 2, 2, 0]} />
                          <RechartsTooltip contentStyle={{borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC'}} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="debtors" className="space-y-4">
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]">
              <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Largest Receivables</span>
              <span className="text-[10px] text-[#888888]">Follow up required</span>
            </div>
            <div className="p-5 space-y-2">
              {debts.top_debtors?.map(d => (
                <div key={d.customer_phone} className="flex items-center justify-between p-3 rounded-[2px] bg-[#0A0A0A] hover:bg-[#1A1A1A] transition-colors border border-[#1A1A1A]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[2px] bg-[#DA291C]/10 text-[#DA291C] flex items-center justify-center font-medium text-[12px]">
                       {d.customer_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] text-white">{d.customer_name}</p>
                      <p className="text-[10px] text-[#888888]">{d.customer_phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-medium text-[#DA291C]">रू {Number(d.total_debt).toLocaleString()}</p>
                    <p className="text-[9px] text-[#888888]">Last: {new Date(d.last_transaction).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
              <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Total Expenses</p>
              <p className="text-[18px] font-medium text-[#DA291C] mt-2">रू {(expenseSummary?.summary?.total_amount ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
              <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Outstanding Payables</p>
              <p className="text-[18px] font-medium text-amber-400 mt-2">रू {(payableSummary?.summary?.total_outstanding ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-5">
              <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Net Profit</p>
              <p className="text-[18px] font-medium text-emerald-400 mt-2">
                रू {((stats?.profit?.gross_profit ?? 0) - (expenseSummary?.summary?.total_amount ?? 0)).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <a href="/reports/finance" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A9B8E] text-white rounded-[2px] text-[13px] hover:bg-[#15897d] transition-colors">
              View Full Finance
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
