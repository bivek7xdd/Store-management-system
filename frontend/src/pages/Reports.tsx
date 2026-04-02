import { useState, useMemo } from "react";
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
  Snowflake,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getReportStats } from "@/services/reportService";
import type { Insight, VelocityItem, BasketPair, HeatmapCell } from "@/services/reportService";
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
      // scroll to respective section
      const el = document.getElementById(action);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!insights || insights.length === 0) return null;

  return (
    <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm" data-tour="reports-insights">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            Daily Insights
            <Badge variant="secondary" className="text-xs font-medium">
              {insights.length} new
            </Badge>
          </CardTitle>
          <span className="text-xs text-muted-foreground">AI-generated · just now</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {shown.map((insight, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all duration-200",
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
          </div>
        ))}

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
      </CardContent>
    </Card>
  );
}

// ── Feature 2: Dead Stock Cash Trap ──────────────────────────────────────────
function DeadStockWidget({ deadStock }: { deadStock: ReturnType<typeof getReportStats> extends Promise<infer T> ? T["dead_stock"] : never }) {
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
    <Card id="view_dead_stock" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Snowflake className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
          {/* Left: headline + threshold breakdown */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Capital Tied Up in Dead Stock</p>
              <p className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                रू {total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Inventory unsold for 60+ days · opportunity cost</p>
            </div>
            <div className="space-y-2">
              {thresholdData.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-muted-foreground w-20">{t.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${total > 0 ? (t.value / total) * 100 : 0}%`, backgroundColor: t.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-24 text-right">रू {t.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right: by-category bars */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Category</p>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No dead stock detected 🎉</p>
            ) : (
              byCategory.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate">{cat.category || "Uncategorized"}</span>
                    <span className="text-muted-foreground">रू {cat.total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-700"
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
  );
}

// ── Feature 3: Predictive Velocity Restocking ─────────────────────────────────
function VelocityTable({ items }: { items: VelocityItem[] }) {
  const urgency = (days: number) => {
    if (days <= 7) return { bg: "bg-red-50 dark:bg-red-950/30", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", label: "Critical" };
    if (days <= 14) return { bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "Low" };
    return { bg: "hover:bg-muted/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "OK" };
  };

  return (
    <Card id="view_velocity" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Predictive Velocity Restocking
          </CardTitle>
          <span className="text-xs text-muted-foreground">Based on 30-day avg. sales</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No velocity data yet — start recording sales to see predictions here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Avg/day</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Days Left</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => {
                  const u = urgency(item.estimated_days_to_stockout);
                  return (
                    <tr key={i} className={cn("transition-colors", u.bg)}>
                      <td className="px-4 py-3 font-medium truncate max-w-[160px]">{item.product_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{item.category_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.stock_quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {Number(item.avg_daily_sales).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {item.estimated_days_to_stockout >= 9999 ? "∞" : item.estimated_days_to_stockout}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", u.badge)}>
                          {u.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Feature 4: Market Basket Analysis ────────────────────────────────────────
function BasketWidget({ pairs }: { pairs: BasketPair[] }) {
  const maxFreq = Math.max(...pairs.map((p) => p.pair_frequency), 1);

  return (
    <Card id="view_basket" className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          Market Basket Analysis
          <span className="text-xs font-normal text-muted-foreground">· last 90 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pairs.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Not enough multi-item orders yet.</p>
            <p className="text-xs mt-1">Pairs appear after customers buy 2+ products in the same transaction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pairs.map((pair, i) => {
              const pct = Math.round((pair.pair_frequency / maxFreq) * 100);
              return (
                <div key={i} className="group flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all">
                  {/* Rank badge */}
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {/* Product A */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{pair.product_a_name}</p>
                  </div>
                  {/* Link icon */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">{pair.pair_frequency}×</span>
                  </div>
                  {/* Product B */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold truncate text-foreground">{pair.product_b_name}</p>
                  </div>
                  {/* Frequency bar */}
                  <div className="w-16 shrink-0">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(to right, ${PRIMARY}, ${PRIMARY_DARK})` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground text-center pt-1">
              Consider bundling top pairs for higher average order value
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Feature 5: Traffic Heatmap ────────────────────────────────────────────────
function TrafficHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number } | null>(null);

  // Build lookup: [day][hour] = count. ISO DOW: 1=Mon, 7=Sun → index 0–6
  const matrix = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    cells.forEach((c) => {
      const dayIdx = c.day_of_week - 1; // ISO DOW 1-7 → 0-6
      if (dayIdx >= 0 && dayIdx < 7 && c.hour_of_day >= 0 && c.hour_of_day < 24) {
        m[dayIdx][c.hour_of_day] = c.transaction_count;
      }
    });
    return m;
  }, [cells]);

  const maxCount = useMemo(() => Math.max(...cells.map((c) => c.transaction_count), 1), [cells]);

  const cellColor = (count: number): string => {
    if (count === 0) return "hsl(183, 10%, 94%)";
    const intensity = count / maxCount;
    // Interpolate from light teal to deep teal
    const l = Math.round(92 - intensity * 55);
    return `hsl(183, 70%, ${l}%)`;
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            Store Traffic Patterns
            <span className="text-xs font-normal text-muted-foreground">· last 30 days</span>
          </CardTitle>
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 1.0].map((v, i) => (
                <div key={i} className="h-3 w-4 rounded-sm" style={{ backgroundColor: cellColor(v * maxCount) }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cells.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No traffic data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">
              {/* Column headers - days */}
              <div className="flex mb-1 ml-12">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
                ))}
              </div>

              {/* Rows = hours */}
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex items-center mb-0.5">
                  {/* Hour label */}
                  <div className="w-12 text-right pr-2 text-[10px] text-muted-foreground shrink-0">
                    {hour % 2 === 0 ? HOUR_LABELS[hour] : ""}
                  </div>
                  {/* Day cells */}
                  {Array.from({ length: 7 }, (_, day) => {
                    const count = matrix[day][hour];
                    const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;
                    return (
                      <TooltipProvider key={day} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex-1 h-4 mx-0.5 rounded-sm cursor-pointer transition-all duration-100",
                                isHovered ? "ring-1 ring-primary ring-offset-1 scale-110" : ""
                              )}
                              style={{ backgroundColor: cellColor(count) }}
                              onMouseEnter={() => setHoveredCell({ day, hour, count })}
                              onMouseLeave={() => setHoveredCell(null)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{DAY_LABELS[day]}, {HOUR_LABELS[hour]}</p>
                            <p className="text-muted-foreground">{count} transaction{count !== 1 ? "s" : ""}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
  return (
    <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBg ?? "bg-primary/10")}>
            {icon}
          </div>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", valueColor ?? "text-foreground")}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reports() {
  const [dateRange, setDateRange] = useState("month");

  const handleExportPDF = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportPDF(dateRange);
      toast.success("Downloading PDF report…");
    });
  };

  const handleExportCSV = () => {
    import("@/services/reportService").then((service) => {
      service.exportReportCSV(dateRange);
      toast.success("Downloading CSV report…");
    });
  };

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["reportStats", dateRange],
    queryFn: () => getReportStats(dateRange),
    staleTime: 2 * 60 * 1000, // 2 min
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Crunching your numbers…</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load report data. Try refreshing the page.</p>
      </div>
    );
  }

  const {
    sales, inventory, debts, profit,
    insights, dead_stock, velocity, basket_pairs, traffic_heatmap
  } = stats;

  const totalSalesVal = Number(sales.total) || 0;
  const cashSalesVal = Number(sales.cash) || 0;
  const creditSalesVal = Number(sales.credit) || 0;
  const totalInventoryValue = Number(inventory.total_value) || 0;
  const totalOutstanding = Number(debts.total_outstanding) || 0;

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" data-tour="reports-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prescriptive insights to drive action, not just analysis</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 h-8 text-xs" data-tour="reports-date-range">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-8 text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* ── Feature 1: Daily Insights Feed ── */}
      {insights && insights.length > 0 && <InsightsFeed insights={insights} />}

      {/* ── KPI Strip ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KPICard
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          label="Total Sales"
          value={`रू ${totalSalesVal.toLocaleString()}`}
          sub={`${sales.count} transactions`}
          iconBg="bg-primary/10"
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Gross Profit"
          value={`रू ${Number(profit.gross_profit).toLocaleString()}`}
          sub={`${profit.total_revenue > 0 ? Math.round((Number(profit.gross_profit) / Number(profit.total_revenue)) * 100) : 0}% margin`}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          valueColor="text-emerald-600"
        />
        <KPICard
          icon={<Package className="h-4 w-4 text-sky-600" />}
          label="Inventory Value"
          value={`रू ${totalInventoryValue.toLocaleString()}`}
          sub={`${inventory.total_products} products`}
          iconBg="bg-sky-50 dark:bg-sky-900/20"
        />
        <KPICard
          icon={<Users className="h-4 w-4 text-red-500" />}
          label="Outstanding Debt"
          value={`रू ${totalOutstanding.toLocaleString()}`}
          sub={`${debts.total_debtors} debtors`}
          iconBg="bg-red-50 dark:bg-red-900/20"
          valueColor="text-red-600"
        />
      </div>

      {/* ── Feature 2: Dead Stock + Feature 3: Velocity (side by side on lg) ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DeadStockWidget deadStock={dead_stock} />
        <BasketWidget pairs={basket_pairs ?? []} />
      </div>

      {/* ── Feature 3: Velocity Table ── */}
      <VelocityTable items={velocity ?? []} />

      {/* ── Feature 5: Traffic Heatmap ── */}
      <TrafficHeatmap cells={traffic_heatmap ?? []} />

      {/* ── Existing Analytics Tabs ── */}
      <Tabs defaultValue="sales" className="space-y-4" data-tour="reports-tabs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Detailed Analytics</h2>
          <TabsList className="grid grid-cols-3 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="sales" className="rounded-lg flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="h-3.5 w-3.5" /> Sales
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-3.5 w-3.5" /> Inventory
            </TabsTrigger>
            <TabsTrigger value="debtors" className="rounded-lg flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5" /> Debtors
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary to-teal-700 text-white">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-xs font-medium">Gross Profit</p>
                    <p className="text-2xl font-bold mt-1">रू {Number(profit.gross_profit).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                        {profit.total_revenue > 0 ? Math.round((Number(profit.gross_profit) / Number(profit.total_revenue)) * 100) : 0}% Margin
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="pt-5 space-y-4">
                {[
                  { label: "Cash Sales", value: cashSalesVal, pct: totalSalesVal > 0 ? Math.round((cashSalesVal / totalSalesVal) * 100) : 0, color: "bg-teal-500" },
                  { label: "Credit Sales", value: creditSalesVal, pct: totalSalesVal > 0 ? Math.round((creditSalesVal / totalSalesVal) * 100) : 0, color: "bg-amber-500" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{row.label}</p>
                      <p className="text-lg font-bold">रू {row.value.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{row.pct}%</span>
                      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sales Trend Chart */}
          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <ComposedChart data={sales.daily_trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="sale_date"
                      axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => {
                        try { return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
                        catch { return v; }
                      }}
                    />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => `रू${v}`}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => [`रू ${v.toLocaleString()}`, "Sales"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "none", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                    />
                    <Bar dataKey="daily_total" fill={`${PRIMARY}30`} radius={[4, 4, 0, 0]} barSize={32} />
                    <Line type="monotone" dataKey="daily_total" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(sales.recent ?? []).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{sale.customer_name || "Walk-in Customer"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.sale_date).toLocaleString("en-NP")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">रू {Number(sale.total_amount).toLocaleString()}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{sale.sales_type}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <KPICard icon={<Package className="h-4 w-4 text-primary" />} label="Total Products" value={String(inventory.total_products)} sub="In inventory" />
            <KPICard icon={<BarChart3 className="h-4 w-4 text-sky-600" />} label="Inventory Value" value={`रू ${totalInventoryValue.toLocaleString()}`} sub="At cost price" iconBg="bg-sky-50 dark:bg-sky-900/20" />
            <KPICard icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} label="Low Stock Items" value={String(inventory.low_stock)} sub="Need restock" iconBg="bg-amber-50 dark:bg-amber-900/20" valueColor="text-amber-600" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Stock by Category Pie */}
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Stock by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={inventory.stock_by_category ?? []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="product_count">
                        {(inventory.stock_by_category ?? []).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v: number) => [`${v} products`, "Count"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                  {(inventory.stock_by_category ?? []).map((e, idx) => (
                    <div key={e.category_name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{e.category_name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={sales.top_products ?? []} margin={{ left: 4, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="product_name" type="category" width={90} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="total_quantity" fill={PRIMARY} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Category */}
          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={inventory.revenue_by_category ?? []} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="category_name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `रू${v}`} />
                    <RechartsTooltip formatter={(v: number) => [`रू ${v.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="total_revenue" radius={[4, 4, 0, 0]} barSize={44}>
                      {(inventory.revenue_by_category ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debtors Tab */}
        <TabsContent value="debtors" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <KPICard icon={<TrendingUp className="h-4 w-4 text-red-500" />} label="Total Outstanding" value={`रू ${totalOutstanding.toLocaleString()}`} sub="To be collected" iconBg="bg-red-50 dark:bg-red-900/20" valueColor="text-red-600" />
            <KPICard icon={<Users className="h-4 w-4 text-primary" />} label="Total Debtors" value={String(debts.total_debtors)} sub="Active customers" />
            <KPICard icon={<BarChart3 className="h-4 w-4 text-sky-600" />} label="Average Debt" value={`रू ${debts.total_debtors > 0 ? Math.round(totalOutstanding / Number(debts.total_debtors)).toLocaleString() : 0}`} sub="Per customer" iconBg="bg-sky-50 dark:bg-sky-900/20" />
          </div>

          <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Debtors</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(debts.top_debtors || []).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: PRIMARY }}>
                      {d.customer_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{d.customer_phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">रू {Number(d.total_debt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.last_transaction ? new Date(d.last_transaction).toLocaleDateString("en-NP") : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
