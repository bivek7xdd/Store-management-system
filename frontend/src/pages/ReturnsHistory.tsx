import { useState, useEffect } from "react";
import { 
  History, Search, Filter, ArrowLeft, RefreshCcw, 
  ChevronDown, ChevronRight, User, Calendar, 
  Banknote, CreditCard, Smartphone, ShieldCheck, 
  ShieldAlert, AlertTriangle, PackageCheck, PackageX,
  ArrowUpRight, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { returnsService } from "@/services/returns";
import { Return, ReturnItem } from "@/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ReturnsHistory = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const data = await returnsService.getReturnsHistory();
      setReturns(data || []);
    } catch (error) {
      toast.error("Failed to fetch returns history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(ret => 
    ret.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.sale_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#111111] rounded-[2px] transition-colors border border-[#303030]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <RefreshCcw className="w-6 h-6 text-[#DA291C]" />
              Returns History
            </h1>
            <p className="text-[#888888] text-sm mt-1">
              View and manage processed product returns and refunds.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#000000] border border-[#1A1A1A] p-4 rounded-[2px]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
          <input 
            type="text" 
            placeholder="Search by customer or sale ID..."
            className="w-full bg-[#0A0A0A] border border-[#303030] rounded-[2px] pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#DA291C] transition-colors text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#303030] rounded-[2px] text-sm hover:bg-[#1A1A1A] transition-colors whitespace-nowrap">
          <Filter className="w-4 h-4 text-[#DA291C]" />
          Filter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#000000] border border-[#1A1A1A] p-5 rounded-[2px] space-y-2">
          <p className="text-[#888888] text-xs uppercase tracking-wider font-medium">Total Returns</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">{returns.length}</p>
            <RefreshCcw className="w-5 h-5 text-[#DA291C]/50" />
          </div>
        </div>
        <div className="bg-[#000000] border border-[#1A1A1A] p-5 rounded-[2px] space-y-2">
          <p className="text-[#888888] text-xs uppercase tracking-wider font-medium">Total Refunded</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">रू {returns.reduce((acc, r) => acc + Number(r.refund_amount), 0).toLocaleString()}</p>
            <Banknote className="w-5 h-5 text-green-500/50" />
          </div>
        </div>
        <div className="bg-[#000000] border border-[#1A1A1A] p-5 rounded-[2px] space-y-2">
          <p className="text-[#888888] text-xs uppercase tracking-wider font-medium">This Month</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-white">
              {returns.filter(r => {
                const date = parseISO(r.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
            <Calendar className="w-5 h-5 text-blue-500/50" />
          </div>
        </div>
      </div>

      {/* Main Table/List */}
      <div className="bg-[#000000] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-[#555555]">
            <Loader2 className="w-8 h-8 animate-spin text-[#DA291C]" />
            <p className="text-sm font-medium">Fetching returns history...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-[#555555]">
            <History className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">No returns found matching your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {filteredReturns.map((ret) => (
              <ReturnItemComponent key={ret.id} returnData={ret} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ReturnItemComponent = ({ returnData }: { returnData: Return }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchItems = async () => {
    if (loaded) return;
    setLoadingItems(true);
    try {
      const data = await returnsService.getReturnDetails(returnData.id);
      setItems(data || []);
      setLoaded(true);
    } catch {
      toast.error("Failed to load return items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    if (open) fetchItems();
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return <Banknote className="w-3.5 h-3.5" />;
      case 'credit': return <CreditCard className="w-3.5 h-3.5" />;
      case 'online': return <Smartphone className="w-3.5 h-3.5" />;
      default: return <Banknote className="w-3.5 h-3.5" />;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <div className="p-4 hover:bg-[#0A0A0A] transition-colors cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#555555] uppercase tracking-[1px]">ID: {returnData.id.slice(0, 8)}</span>
                  <span className="h-1 w-1 rounded-full bg-[#303030]" />
                  <span className="text-[10px] font-medium text-[#888888]">{format(parseISO(returnData.created_at), "MMM d, yyyy HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3.5 h-3.5 text-[#DA291C]" />
                  <h4 className="font-bold text-white text-[14px] truncate">
                    {returnData.customer_name || "Guest Customer"}
                  </h4>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pr-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] uppercase tracking-wider text-[#555555] font-medium">Refund Method</p>
                <div className="flex items-center gap-1.5 text-white font-medium text-[13px] capitalize mt-0.5">
                  {getPaymentIcon(returnData.refund_method)}
                  {returnData.refund_method}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <p className="text-[10px] uppercase tracking-wider text-[#555555] font-medium">Amount</p>
                <p className="text-[#DA291C] font-bold text-[16px] mt-0.5">रू {Number(returnData.refund_amount).toLocaleString()}</p>
              </div>

              <ChevronRight className={cn(
                "w-4 h-4 text-[#303030] transition-transform duration-200 group-hover:text-white",
                isOpen && "rotate-90"
              )} />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="bg-[#050505] border-t border-[#1A1A1A]">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            {/* Details Section */}
            <div className="flex-1 space-y-6">
              <div>
                <h5 className="text-[11px] font-bold text-[#555555] uppercase tracking-[2px] mb-4">Returned Items</h5>
                {loadingItems ? (
                  <div className="flex items-center gap-3 text-[#555555] py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading items...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-[2px]">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-[2px] flex items-center justify-center",
                            item.condition === 'resellable' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {item.condition === 'resellable' ? <PackageCheck className="w-4 h-4" /> : <PackageX className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white">{item.product_name}</p>
                            <p className="text-[10px] text-[#555555] uppercase tracking-wider">{item.variant_sku || "Standard"} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block",
                            item.condition === 'resellable' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                          )}>
                            {item.condition}
                          </div>
                          <p className="text-[11px] text-[#888888] mt-1 italic">"{item.reason}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-64 space-y-4">
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-4 rounded-[2px] space-y-4">
                <div>
                  <p className="text-[10px] uppercase text-[#555555] font-bold tracking-wider mb-1">Related Sale</p>
                  <button 
                    onClick={() => navigate(`/sales/history?search=${returnData.sale_id}`)}
                    className="text-white font-medium text-[12px] hover:text-[#DA291C] transition-colors flex items-center gap-2"
                  >
                    Sale #{returnData.sale_id.slice(0, 8)}
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#555555] font-bold tracking-wider mb-1">Sale Total</p>
                  <p className="text-white font-bold text-[14px]">रू {Number(returnData.sale_total || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-[#DA291C]/5 border border-[#DA291C]/20 p-4 rounded-[2px]">
                <div className="flex items-center gap-2 text-[#DA291C] mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Processed Verified</span>
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  This return has been logged and stock levels have been adjusted automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ReturnsHistory;
