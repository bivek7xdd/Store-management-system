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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getReportStats } from "@/services/reportService";
import type { Insight, ReportStats } from "@/services/reportService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
const PRIMARY = "#0d9488";
const PRIMARY_DARK = "#115e59";
const COLORS = ["#0d9488", "#059669", "#0891b2", "#7c3aed", "#db2777", "#ea580c"];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i === 12) return "12pm";
  return i < 12 ? `${i}am` : `${i - 12}pm`;
});

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightIcon({ type }: { type: Insight["type"] }) {
  switch (type) {
    case "success":    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    case "warning":    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case "alert":      return <Flame className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
    case "opportunity":return <Zap className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />;
    default:           return <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />;
  }
}

function insightBorder(type: Insight["type"]) {
  return {
    success:     "border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20",
    warning:     "border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/20",
    alert:       "border-l-red-400 bg-red-50/60 dark:bg-red-900/20",
    opportunity: "border-l-violet-400 bg-violet-50/60 dark:bg-violet-900/20",
    info:        "border-l-sky-400 bg-sky-50/60 dark:bg-sky-900/20",
  }[type] ?? "border-l-gray-400 bg-gray-50/60";
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
      <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t-2 border-teal-500/20" data-tour="reports-insights">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <Brain className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              Daily Insights
              <Badge variant="secondary" className="text-xs font-medium">
                {insights.length} new
              </Badge>
            </CardTitle>
            <span className="text-xs text-muted-foreground">Smart Analysis · Just Now</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {shown.map((insight, i) => (
                <motion.div
                  key={`${i}-${insight.type}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all duration-200 group",
                    insightBorder(insight.type)
                  )}
                >
                  <InsightIcon type={insight.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{insight.message}</p>
                  </div>
                  {insight.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleAction(insight.action)}
                    >
                      {insightActionLabel(insight.action)}
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {insights.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground text-xs gap-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Show less" : `Show ${insights.length - 3} more insights`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Feature 2: Dead Stock Cash Trap ──────────────────────────────────────────
function DeadStockWidget({ deadStock }: { deadStock: ReportStats["dead_stock"] }) {
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
      <Card id="view_dead_stock" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Dead Stock Cash Trap
            </CardTitle>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400">
              <Tag className="h-3 w-3" />
              Create Discount
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Capital Tied Up</p>
                <p className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  रू <CountUp to={total} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Unsold for 60+ days</p>
              </div>
              <div className="space-y-2">
                {thresholdData.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-muted-foreground w-20">{t.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${total > 0 ? (t.value / total) * 100 : 0}%` }}
                        viewport={{ once: true }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: t.color }}
                        transition={{ duration: 1, ease: "circOut" }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-24 text-right">रू {t.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Category</p>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Clear! 🎉</p>
              ) : (
                byCategory.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate">{cat.category || "General"}</span>
                      <span className="text-muted-foreground">रू {cat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(cat.total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Feature 3: Predictive Velocity Restocking ─────────────────────────────────
function VelocityTable({ items }: { items: ReportStats["velocity"] }) {
  const urgency = (days: number) => {
    if (days <= 7) return { bg: "bg-red-50 dark:bg-red-950/30", badge: "bg-red-100 text-red-700 dark:bg-red-900/40", label: "Critical" };
    if (days <= 14) return { bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40", label: "Low" };
    return { bg: "hover:bg-muted/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40", label: "Healthy" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Card id="view_velocity" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              Velocity Tracking
            </CardTitle>
            <span className="text-xs text-muted-foreground">Predictive Restock Analysis</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Product</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Daily Avg</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Days Left</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(items || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                    No velocity data available for this period. 
                  </td>
                </tr>
              ) : (
                items.slice(0, 10).map((item, i) => {
                  const u = urgency(item.estimated_days_to_stockout);
                  return (
                    <tr key={i} className={cn("transition-colors", u.bg)}>
                      <td className="px-4 py-3 font-medium">{item.product_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.stock_quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{Number(item.avg_daily_sales).toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {item.estimated_days_to_stockout > 365 ? "365+" : item.estimated_days_to_stockout}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", u.badge)}>
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
      </Card>
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
      <Card id="view_basket" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            Smart Bundles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(pairs || []).slice(0, 5).map((pair, i) => {
              const pct = Math.round((pair.pair_frequency / maxFreq) * 100);
              return (
                <div key={i} className="group flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all border border-transparent hover:border-violet-500/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{pair.product_a_name}</p>
                    <div className="flex items-center gap-1 my-1">
                      <Link2 className="h-3 w-3 text-violet-500" />
                      <div className="h-[1px] flex-1 bg-violet-500/20" />
                    </div>
                    <p className="text-xs font-bold truncate text-foreground">{pair.product_b_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-400">{pair.pair_frequency}× Pairs</span>
                    <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
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
        </CardContent>
      </Card>
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
    if (count === 0) return "hsl(var(--muted)/0.3)";
    const intensity = count / maxCount;
    return `hsl(183, 70%, ${Math.round(85 - intensity * 50)}%)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            Peak Traffic Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">
              <div className="flex mb-2 ml-12">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="flex-1 text-center text-[10px] font-bold text-muted-foreground">{d}</div>
                ))}
              </div>
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex items-center mb-0.5">
                  <div className="w-12 text-right pr-2 text-[9px] font-medium text-muted-foreground shrink-0 tabular-nums">
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
                          <TooltipContent className="text-[10px] font-bold">
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
        </CardContent>
      </Card>
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
    <motion.div whileHover={{ y: -4 }}>
      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full group">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all group-hover:bg-primary/20", iconBg ?? "bg-primary/10")}>
              {icon}
            </div>
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-xl font-black flex items-baseline gap-1", valueColor ?? "text-foreground")}>
            {value.includes("रू") && <span className="text-xs opacity-60">रू</span>}
            <CountUp to={numericValue} />
          </div>
          {sub && <p className="text-[10px] font-medium text-muted-foreground mt-1 truncate">{sub}</p>}
        </CardContent>
      </Card>
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      <p className="text-xs font-bold text-muted-foreground animate-pulse">Analyzing Store Pulse...</p>
    </div>
  );

  if (isError || !stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <AlertTriangle className="h-10 w-10 text-red-500/50" />
      <p className="text-xs font-bold text-muted-foreground">Intelligence Service Offline</p>
    </div>
  );

  const { sales, inventory, debts, profit, insights, dead_stock, velocity, basket_pairs, traffic_heatmap } = stats;
  const totalSalesVal = Number(sales.total) || 0;
  const totalOutstanding = Number(debts.total_outstanding) || 0;

  return (
    <motion.div 
      className="space-y-6 pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tighter">Intelligence Hub</h1>
          <p className="text-sm font-medium text-muted-foreground">Actionable business intelligence for {dateRange}ly performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 h-9 text-xs font-bold rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-0 shadow-sm">
              <Calendar className="h-3 w-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExportPDF} className="h-9 w-9 border-0 bg-white/50 dark:bg-slate-900/50 rounded-xl shadow-sm"><FileText className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={handleExportCSV} className="h-9 w-9 border-0 bg-white/50 dark:bg-slate-900/50 rounded-xl shadow-sm"><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && <InsightsFeed insights={insights} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Total Sales" value={`रू ${totalSalesVal}`} sub={`${sales.count} Transactions`} iconBg="bg-emerald-500/10" valueColor="text-emerald-600" />
        <KPICard icon={<Zap className="h-4 w-4 text-primary" />} label="Gross Profit" value={`रू ${profit.gross_profit}`} sub={`${profit.total_revenue > 0 ? Math.round((Number(profit.gross_profit) / Number(profit.total_revenue)) * 100) : 0}% Margin`} />
        <KPICard icon={<Package className="h-4 w-4 text-sky-500" />} label="Inventory Value" value={`रू ${inventory.total_value}`} sub={`${inventory.total_products} Skus`} iconBg="bg-sky-500/10" />
        <KPICard icon={<Users className="h-4 w-4 text-red-500" />} label="Receivables" value={`रू ${totalOutstanding}`} sub={`from ${debts.total_debtors} Debtors`} iconBg="bg-red-500/10" valueColor="text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DeadStockWidget deadStock={dead_stock} />
        <BasketWidget pairs={basket_pairs} />
      </div>

      <VelocityTable items={velocity} />
      <TrafficHeatmap cells={traffic_heatmap} />

      {/* Detailed Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm p-1 rounded-2xl border border-white/10 w-fit">
          <TabsTrigger value="sales" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Inventory</TabsTrigger>
          <TabsTrigger value="debtors" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Debtors</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
             <Card className="md:col-span-2 border-0 shadow-md overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-sm font-bold">Sales Volume Trend</CardTitle></CardHeader>
                <CardContent className="h-64">
                   <ResponsiveContainer>
                      <ComposedChart data={sales.daily_trend}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                         <XAxis dataKey="sale_date" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => new Date(v).toLocaleDateString([], {day: 'numeric', month: 'short'})} />
                         <YAxis hide />
                         <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                         <Bar dataKey="daily_total" fill={PRIMARY} radius={[4, 4, 0, 0]} opacity={0.3} />
                         <Line type="monotone" dataKey="daily_total" stroke={PRIMARY} strokeWidth={3} dot={{r: 4, fill: PRIMARY, strokeWidth: 0}} />
                      </ComposedChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
             <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-sm font-bold">Top Sellers</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {sales.top_products?.slice(0, 5).map(p => (
                      <div key={p.product_id} className="flex items-center justify-between">
                         <span className="text-xs font-bold truncate pr-4">{p.product_name}</span>
                         <Badge variant="secondary" className="text-[10px] font-black">{p.total_quantity} sold</Badge>
                      </div>
                   ))}
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
           <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                 <CardHeader><CardTitle className="text-sm font-bold">Stock Distribution</CardTitle></CardHeader>
                 <CardContent className="h-64 flex flex-col items-center">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={inventory.stock_by_category} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="product_count">
                           {inventory.stock_by_category?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                       {inventory.stock_by_category?.map((c, i) => (
                          <div key={i} className="flex items-center gap-1 text-[10px] font-bold">
                             <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                             {c.category_name}
                          </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                 <CardHeader><CardTitle className="text-sm font-bold">Revenue by Category</CardTitle></CardHeader>
                 <CardContent className="h-64">
                    <ResponsiveContainer>
                       <BarChart data={inventory.revenue_by_category} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="category_name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={80} />
                          <Bar dataKey="total_revenue" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                       </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="debtors" className="space-y-4">
          <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                Largest Receivables
                <span className="text-[10px] text-muted-foreground">Follow up required</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {debts.top_debtors?.map(d => (
                <div key={d.customer_phone} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                       {d.customer_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black">{d.customer_name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.customer_phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-red-500">रू {Number(d.total_debt).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-muted-foreground">Last: {new Date(d.last_transaction).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
