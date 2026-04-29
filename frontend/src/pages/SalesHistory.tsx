
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Calendar, ChevronDown, ChevronRight, ChevronLeft, User, Phone,
  ArrowUpRight, Loader2, Printer, FileText, X, RefreshCw,
  Banknote, CreditCard, Smartphone, Filter
} from "lucide-react";
import { salesService, Sale, SaleItem } from "@/services/sales";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isAfter, isValid, startOfDay, subDays, startOfMonth, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const safeDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isValid(date) ? date : new Date();
};

const formatDate = (dateString: string | undefined) =>
  safeDate(dateString).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (dateString: string | undefined) =>
  safeDate(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Banknote }> = {
  cash: { label: "Cash", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: Banknote },
  credit: { label: "Credit", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: CreditCard },
  online: { label: "Online", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Smartphone },
  mixed: { label: "Mixed", color: "text-purple-400 border-purple-500/30 bg-purple-500/10", icon: ArrowUpRight },
};

// ---------- Sale Row ----------
const SaleHistoryItem = ({ sale }: { sale: Sale }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !loaded) {
      setLoading(true);
      try {
        const data = await salesService.getSaleDetails(String(sale.id));
        setItems(data.items || []);
        setLoaded(true);
      } catch {
        toast.error("Failed to load receipt details");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintThermal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank", "width=350,height=600");
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html><head><title>Receipt #${String(sale.id).slice(0, 8)}</title>
    <style>@page{size:80mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:12px;line-height:1.4;width:80mm;padding:8mm 4mm;background:white;color:black}
    .c{text-align:center}.b{font-weight:bold}.row{display:flex;justify-content:space-between;font-size:11px;margin:4px 0}
    .div{border-top:1px dashed #000;margin:8px 0}.ddiv{border-top:2px solid #000;margin:8px 0}
    .gt{font-size:14px;font-weight:bold;padding:6px 0}</style></head><body>
    <div class="c"><div class="b" style="font-size:18px">STOREHUB</div>
    <div style="font-size:11px">Kathmandu, Nepal • VAT/PAN: 123456789</div></div>
    <div class="ddiv"></div>
    <div class="row"><span>Receipt #:</span><span>${String(sale.id).slice(0, 8).toUpperCase()}</span></div>
    <div class="row"><span>Date:</span><span>${formatDate(sale.sale_date)}</span></div>
    <div class="row"><span>Time:</span><span>${formatTime(sale.sale_date)}</span></div>
    <div class="row"><span>Type:</span><span>${sale.sales_type.toUpperCase()}</span></div>
    ${sale.customer_name ? `<div class="row"><span>Customer:</span><span>${sale.customer_name}</span></div>` : ""}
    <div class="div"></div>
    <div class="row b"><span>ITEM</span><span>AMOUNT</span></div>
    <div class="div"></div>
    ${items.map(i => {
      const variantSuffix = i.variant_attributes && Object.keys(i.variant_attributes).length > 0 ? ` (${Object.values(i.variant_attributes).join("/")})` : "";
      return `<div style="margin:6px 0"><div>${i.product_name}${variantSuffix}</div>
      <div class="row" style="padding-left:8px;color:#333"><span>${i.quantity} x Rs.${i.unit_price.toLocaleString()}</span><span>Rs.${i.total_price.toLocaleString()}</span></div></div>`;
    }).join("")}
    <div class="div"></div>
    <div class="row"><span>Subtotal:</span><span>Rs.${((sale.total_amount || 0) + (sale.discount_applied || 0)).toLocaleString()}</span></div>
    ${sale.discount_applied > 0 ? `<div class="row"><span>Discount:</span><span>-Rs.${sale.discount_applied.toLocaleString()}</span></div>` : ""}
    ${(sale.amount_paid !== undefined && sale.amount_paid < sale.total_amount) ? `
      <div class="div"></div>
      <div class="row"><span>Amount Paid:</span><span>Rs.${(sale.amount_paid || 0).toLocaleString()}</span></div>
      <div class="row b" style="font-size:13px"><span>Balance Due:</span><span>Rs.${((sale.total_amount || 0) - (sale.amount_paid || 0)).toLocaleString()}</span></div>
    ` : ""}
    <div class="ddiv"></div>
    <div class="row gt"><span>GRAND TOTAL:</span><span>Rs.${(sale.total_amount || 0).toLocaleString()}</span></div>
    <div class="ddiv"></div>
    <div class="c" style="margin-top:16px;font-size:11px"><div class="b">Thank you for your purchase!</div><div>Please come again</div></div>
    </body><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintA4 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html><head><title>Receipt #${String(sale.id).slice(0, 8)}</title>
    <style>@page{size:A4;margin:20mm}*{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:14px;line-height:1.6;background:#f5f5f5;padding:40px;color:#333}
    .wrap{max-width:500px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1);overflow:hidden}
    .hdr{background:linear-gradient(135deg,#1a1a1a,#0a0a0a);color:white;padding:30px;text-align:center}
    .hdr-title{font-size:28px;font-weight:bold;letter-spacing:2px;margin-bottom:8px}
    .hdr-sub{font-size:13px;opacity:.7}
    .body{padding:30px}.meta{display:flex;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #e5e7eb;margin-bottom:20px}
    .meta-item{text-align:center}.meta-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
    .meta-value{font-size:14px;font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f9fafb;padding:12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb}
    th:last-child{text-align:right}td{padding:14px 12px;border-bottom:1px solid #f3f4f6}
    td:last-child{text-align:right;font-weight:600}
    .totals{border-top:2px solid #e5e7eb;padding-top:16px}
    .t-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}
    .gt{font-size:20px;font-weight:bold;padding:16px 0;border-top:2px solid #e5e7eb;margin-top:8px;color:#DA291C}
    .footer{text-align:center;padding:24px 30px;background:#f9fafb;border-top:1px solid #e5e7eb}
    @media print{body{background:white;padding:0}.wrap{box-shadow:none;max-width:100%}}</style></head><body>
    <div class="wrap"><div class="hdr"><div class="hdr-title">STOREHUB</div>
    <div class="hdr-sub">Kathmandu, Nepal • VAT/PAN: 123456789</div></div>
    <div class="body"><div class="meta">
    <div class="meta-item"><div class="meta-label">Receipt No.</div><div class="meta-value">#${String(sale.id).slice(0, 8).toUpperCase()}</div></div>
    <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${formatDate(sale.sale_date)}</div></div>
    <div class="meta-item"><div class="meta-label">Time</div><div class="meta-value">${formatTime(sale.sale_date)}</div></div>
    <div class="meta-item"><div class="meta-label">Type</div><div class="meta-value">${sale.sales_type.toUpperCase()}</div></div>
    </div><table><thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    ${items.map(i => {
      const variantSuffix = i.variant_attributes && Object.keys(i.variant_attributes).length > 0 ? ` <span style="color:#6b7280;font-size:12px">(${Object.values(i.variant_attributes).join("/")})</span>` : "";
      return `<tr><td><div style="font-weight:500">${i.product_name}${variantSuffix}</div><div style="color:#6b7280;font-size:13px">${i.quantity} × Rs.${i.unit_price.toLocaleString()}</div></td><td>Rs.${i.total_price.toLocaleString()}</td></tr>`;
    }).join("")}
    </tbody></table><div class="totals">
    <div class="t-row"><span>Subtotal</span><span>Rs.${((sale.total_amount || 0) + (sale.discount_applied || 0)).toLocaleString()}</span></div>
    ${sale.discount_applied > 0 ? `<div class="t-row" style="color:#dc2626"><span>Discount</span><span>-Rs.${sale.discount_applied.toLocaleString()}</span></div>` : ""}
    <div class="t-row gt"><span>Grand Total</span><span>Rs.${(sale.total_amount || 0).toLocaleString()}</span></div>
    ${(sale.amount_paid !== undefined && sale.amount_paid < sale.total_amount) ? `
      <div class="t-row" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e5e7eb">
        <span style="color:#6b7280">Amount Paid</span>
        <span style="font-weight:600;color:#10b981">Rs.${(sale.amount_paid || 0).toLocaleString()}</span>
      </div>
      <div class="t-row" style="font-size:18px;font-weight:bold;color:#DA291C">
        <span>Balance Due</span>
        <span>Rs.${((sale.total_amount || 0) - (sale.amount_paid || 0)).toLocaleString()}</span>
      </div>
    ` : ""}
    </div></div><div class="footer"><div style="font-size:16px;font-weight:600;margin-bottom:4px">Thank you for your purchase!</div>
    <div style="font-size:13px;color:#6b7280">Goods once sold cannot be returned. Powered by StoreHub</div></div></div>
    </body><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const typeConf = TYPE_CONFIG[sale.sales_type] || TYPE_CONFIG["cash"];
  const TypeIcon = typeConf.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="group">
      <div className={cn(
        "bg-[#111111] border rounded-[2px] overflow-hidden transition-all duration-200",
        isOpen ? "border-[#303030]" : "border-[#1A1A1A] hover:border-[#252525]"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-4 p-5 text-left cursor-pointer">
            {/* Type icon */}
            <div className={cn("h-10 w-10 rounded-[2px] border flex items-center justify-center shrink-0", typeConf.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-[13px] text-white uppercase tracking-tight truncate">
                  {sale.customer_name || "Walk-in Customer"}
                </p>
                <span className="text-[9px] font-bold text-[#888888] border border-[#303030] rounded-[1px] px-1.5 py-0.5 uppercase tracking-[0.5px]">
                  #{String(sale.id).slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#888888]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(sale.sale_date)} · {formatTime(sale.sale_date)}
                </span>
                {sale.customer_phone && (
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <Phone className="h-3 w-3" />
                    {sale.customer_phone}
                  </span>
                )}
              </div>
            </div>

            {/* Amount + type badge */}
            <div className="text-right shrink-0">
              <p className="text-[18px] font-bold text-white tracking-tight">
                रू {(sale.total_amount || 0).toLocaleString()}
              </p>
              <span className={cn("text-[9px] font-bold uppercase tracking-[1px] border rounded-[1px] px-1.5 py-0.5 mt-0.5 inline-block", typeConf.color)}>
                {typeConf.label}
              </span>
            </div>

            {/* Chevron */}
            <div className="shrink-0 ml-2">
              {isOpen
                ? <ChevronDown className="h-4 w-4 text-[#888888]" />
                : <ChevronRight className="h-4 w-4 text-[#555555] group-hover:text-[#888888] transition-colors" />
              }
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-[#1A1A1A] bg-[#0D0D0D] p-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#DA291C]" />
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                {/* Receipt preview */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px]">Transaction Receipt</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><p className="text-[#888888] uppercase tracking-[0.8px]">Receipt ID</p><p className="font-bold text-white mt-0.5">{String(sale.id).slice(0, 8).toUpperCase()}</p></div>
                      <div><p className="text-[#888888] uppercase tracking-[0.8px]">Date / Time</p><p className="font-bold text-white mt-0.5">{formatDate(sale.sale_date)}</p></div>
                      <div><p className="text-[#888888] uppercase tracking-[0.8px]">Payment Mode</p><p className={cn("font-bold mt-0.5 uppercase", typeConf.color.split(" ")[0])}>{sale.sales_type}</p></div>
                      {sale.customer_name && <div><p className="text-[#888888] uppercase tracking-[0.8px]">Customer</p><p className="font-bold text-white mt-0.5 truncate">{sale.customer_name}</p></div>}
                    </div>

                    <div className="border-t border-dashed border-[#303030] my-3" />

                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div key={`${item.product_id}-${idx}`} className="flex items-start justify-between text-[12px]">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-white break-words">
                              {item.product_name}
                              {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && !item.product_name.includes(" - ") && (
                                <span className="text-[#888888] ml-1">
                                  ({Object.values(item.variant_attributes).join(" / ")})
                                </span>
                              )}
                            </p>
                            <p className="text-[#555555] text-[10px] mt-0.5 uppercase tracking-[0.5px]">
                              {item.quantity} × रू {item.unit_price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-bold text-white shrink-0">रू {item.total_price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-[#303030] my-3" />

                    <div className="space-y-1.5 text-[12px]">
                      <div className="flex justify-between text-[#888888]">
                        <span>Subtotal</span>
                        <span>रू {((sale.total_amount || 0) + (sale.discount_applied || 0)).toLocaleString()}</span>
                      </div>
                      {sale.discount_applied > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Discount</span>
                          <span>-रू {(sale.discount_applied || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#303030] pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Grand Total</span>
                        <span className="text-[20px] font-bold text-white">रू {(sale.total_amount || 0).toLocaleString()}</span>
                      </div>
                      
                      {(sale.amount_paid !== undefined && sale.amount_paid < sale.total_amount) && (
                        <div className="pt-2 border-t border-dashed border-[#1A1A1A] space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#888888] uppercase tracking-[1px]">Amount Paid</span>
                            <span className="font-bold text-emerald-400">रू {(sale.amount_paid || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#DA291C] font-bold uppercase tracking-[1px]">Balance Due (Debt)</span>
                            <span className="font-bold text-[#DA291C]">रू {((sale.total_amount || 0) - (sale.amount_paid || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Print buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePrintThermal}
                    className="h-10 border border-[#303030] hover:border-[#555555] text-[#888888] hover:text-white rounded-[2px] text-[11px] font-bold uppercase tracking-[1px] flex items-center justify-center gap-2 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Thermal (80mm)
                  </button>
                  <button
                    onClick={handlePrintA4}
                    className="h-10 bg-[#DA291C] hover:bg-[#B01E0A] text-white rounded-[2px] text-[11px] font-bold uppercase tracking-[1px] flex items-center justify-center gap-2 transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    A4 / PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// ---------- Main Page ----------
export default function SalesHistory() {
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [filterType, setFilterType] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => { fetchSales(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, filterTime, selectedDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await salesService.getSales();
      setSales(data);
    } catch {
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  const isWithinTimeRange = (dateString: string) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    if (!isValid(date)) return true;
    const now = new Date();

    // calendar date takes priority
    if (selectedDate) {
      try {
        return isSameDay(date, parseISO(selectedDate));
      } catch { return false; }
    }

    switch (filterTime) {
      case "today": return isAfter(date, startOfDay(now));
      case "yesterday": {
        const start = startOfDay(subDays(now, 1));
        return isAfter(date, start) && date < startOfDay(now);
      }
      case "last7days": return isAfter(date, subDays(now, 7));
      case "thisMonth": return isAfter(date, startOfMonth(now));
      default: return true;
    }
  };

  const clearDateFilter = () => {
    setSelectedDate("");
    setShowDatePicker(false);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      (sale.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (sale.customer_phone || "").includes(searchTerm) ||
      String(sale.id).includes(searchTerm);
    const matchesType = filterType === "all" || sale.sales_type === filterType;
    const matchesTime = isWithinTimeRange(sale.sale_date);
    return matchesSearch && matchesType && matchesTime;
  });

  // Summary stats
  const totalRevenue = filteredSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
  const cashSales = filteredSales.filter(s => s.sales_type === "cash").length;
  const creditSales = filteredSales.filter(s => s.sales_type === "credit").length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Archive</p>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Sales History</h1>
        </div>
        <button
          onClick={fetchSales}
          className="h-9 w-9 rounded-[2px] border border-[#1A1A1A] bg-[#111111] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Revenue", value: `रू ${totalRevenue.toLocaleString()}`, accent: "text-white" },
          { label: "Cash Sales", value: cashSales, accent: "text-emerald-400" },
          { label: "Credit Sales", value: creditSales, accent: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-4">
            <p className="text-[10px] text-[#888888] uppercase tracking-[1px] mb-2">{stat.label}</p>
            <p className={cn("text-[20px] font-bold", stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-[#888888]" />
          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[1.5px]">Filter Records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              placeholder="Search by name, phone, or receipt ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-transparent border border-[#303030] rounded-[2px] text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#555555] transition-colors"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 bg-[#0A0A0A] border border-[#303030] rounded-[2px] text-[12px] text-[#CCCCCC] uppercase tracking-[0.5px] focus:outline-none focus:border-[#555555] transition-colors appearance-none cursor-pointer min-w-[130px]"
          >
            <option value="all">All Types</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="online">Online</option>
            <option value="mixed">Mixed</option>
          </select>

          {/* Time filter — hidden when calendar date is active */}
          {!selectedDate && (
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="h-10 px-3 bg-[#0A0A0A] border border-[#303030] rounded-[2px] text-[12px] text-[#CCCCCC] uppercase tracking-[0.5px] focus:outline-none focus:border-[#555555] transition-colors appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
            </select>
          )}

          {/* Date picker */}
          <div className="relative">
            {selectedDate ? (
              <div className="h-10 px-3 border border-[#DA291C]/50 bg-[#DA291C]/5 rounded-[2px] flex items-center gap-2 text-[12px] text-[#DA291C] font-bold uppercase tracking-[0.5px]">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <button onClick={clearDateFilter} className="ml-1 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-10 px-3 border border-[#303030] hover:border-[#555555] bg-[#0A0A0A] rounded-[2px] flex items-center gap-2 text-[12px] text-[#888888] hover:text-white uppercase tracking-[0.5px] transition-all"
              >
                <Calendar className="h-3.5 w-3.5" />
                Pick Date
              </button>
            )}

            {showDatePicker && !selectedDate && (
              <div className="absolute right-0 top-12 z-50 bg-[#111111] border border-[#303030] rounded-[2px] shadow-2xl p-4 shadow-black/60">
                <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[1px] mb-3">Select Date</p>
                <input
                  type="date"
                  className="h-10 px-3 bg-[#0A0A0A] border border-[#303030] rounded-[2px] text-[13px] text-white focus:outline-none focus:border-[#DA291C] transition-colors [color-scheme:dark] cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setFilterTime("all");
                      setShowDatePicker(false);
                    }
                  }}
                />
                <button onClick={() => setShowDatePicker(false)} className="mt-2 text-[10px] text-[#888888] hover:text-white transition-colors w-full text-center uppercase tracking-[1px]">Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* Active filter indicators */}
        {(selectedDate || filterTime !== "all" || filterType !== "all") && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <p className="text-[10px] text-[#888888] uppercase tracking-[1px]">Active:</p>
            {filterType !== "all" && (
              <span className="text-[10px] font-bold border border-[#303030] rounded-[1px] px-2 py-0.5 text-[#CCCCCC] uppercase tracking-[0.5px]">{filterType}</span>
            )}
            {selectedDate && (
              <span className="text-[10px] font-bold border border-[#DA291C]/30 bg-[#DA291C]/5 rounded-[1px] px-2 py-0.5 text-[#DA291C] uppercase tracking-[0.5px]">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-NP", { day: "2-digit", month: "short" })}
              </span>
            )}
            {filterTime !== "all" && !selectedDate && (
              <span className="text-[10px] font-bold border border-[#303030] rounded-[1px] px-2 py-0.5 text-[#CCCCCC] uppercase tracking-[0.5px]">{filterTime}</span>
            )}
            <button
              onClick={() => { setFilterType("all"); setFilterTime("all"); clearDateFilter(); }}
              className="text-[10px] text-[#DA291C] hover:underline uppercase tracking-[0.5px]"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Result count + pagination info */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">
            {filteredSales.length} transaction{filteredSales.length !== 1 ? "s" : ""} found
          </p>
          {totalPages > 1 && (
            <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      )}

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[74px] bg-[#111111] border border-[#1A1A1A] rounded-[2px] animate-pulse" />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#1A1A1A] rounded-[2px]">
          <Search className="h-8 w-8 text-[#303030] mb-4" />
          <p className="text-[14px] font-medium text-white mb-1">No Transactions Found</p>
          <p className="text-[12px] text-[#888888] text-center max-w-xs">
            {selectedDate ? `No sales recorded on ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-NP", { day: "2-digit", month: "long", year: "numeric" })}.` : "Try adjusting your search or filter criteria."}
          </p>
          {(searchTerm || filterType !== "all" || filterTime !== "all" || selectedDate) && (
            <button
              onClick={() => { setSearchTerm(""); setFilterType("all"); setFilterTime("all"); clearDateFilter(); }}
              className="mt-4 text-[11px] text-[#DA291C] uppercase tracking-[1px] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedSales.map((sale) => (
              <SaleHistoryItem key={String(sale.id)} sale={sale} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
              <p className="text-[11px] text-[#888888] uppercase tracking-[1px]">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)} of {filteredSales.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="w-8 text-center text-[#888888] text-[12px]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={cn(
                          "h-8 w-8 rounded-[2px] text-[12px] font-bold transition-colors",
                          currentPage === p
                            ? "bg-[#DA291C] text-white border border-[#DA291C]"
                            : "border border-[#1A1A1A] text-[#888888] hover:text-white hover:bg-[#1A1A1A]"
                        )}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
