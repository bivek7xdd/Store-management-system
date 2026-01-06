
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, ChevronRight, User, Phone, ArrowUpRight, ChevronDown, Loader2, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { salesService, Sale, SaleItem } from "@/services/sales";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { startOfDay, subDays, startOfMonth, isAfter } from "date-fns";

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
                const data = await salesService.getSaleDetails(sale.id);
                setItems(data.items || []);
                setLoaded(true);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Create a printable area manually since we aren't using a full-screen dialog
        const printContent = document.getElementById(`print - ${sale.id} `);
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to restore event listeners/React state
    };

    return (
        <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="group">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CollapsibleTrigger asChild>
                    <CardContent className="p-4 sm:p-6 cursor-pointer bg-white relative z-10">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`h - 12 w - 12 rounded - xl flex items - center justify - center shrink - 0 ${sale.sales_type === 'credit' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'
                                    } `}>
                                    {sale.sales_type === 'credit' ? <User className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 line-clamp-1">
                                            {sale.customer_name || "Walk-in Customer"}
                                        </span>
                                        <Badge variant="secondary" className="text-xs font-normal bg-gray-100">
                                            #{sale.id.slice(0, 8)}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(sale.sale_date).toLocaleDateString()}
                                        </span>
                                        {sale.customer_phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {sale.customer_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                        रू {sale.total_amount?.toLocaleString() ?? 0}
                                    </p>
                                    <div className="flex items-center justify-end gap-2 mt-1 mt-0.5">
                                        <Badge variant="outline" className="capitalize">
                                            {sale.sales_type}
                                        </Badge>
                                    </div>
                                </div>
                                {isOpen ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-gray-100 bg-gray-50/50">
                    <div className="p-6" id={`print - ${sale.id} `}>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                {/* Bill Header */}
                                <div className="flex justify-between items-start pb-6 border-b border-gray-100 mb-6">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900">StoreHub</h3>
                                        <p className="text-sm text-gray-500 mt-1">Kathmandu, Nepal</p>
                                        <p className="text-sm text-gray-500">VAT/PAN: 123456789</p>
                                    </div>
                                    <div className="text-right">
                                        <Button variant="outline" size="sm" onClick={handlePrint} className="mb-2 print:hidden">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Print Receipt
                                        </Button>
                                        <p className="text-sm font-medium text-gray-900">Receipt #{sale.id.slice(0, 8)}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(sale.sale_date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Bill To */}
                                {(sale.customer_name || sale.customer_phone) && (
                                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Bill To</span>
                                        <span className="block font-medium text-gray-900">{sale.customer_name || "N/A"}</span>
                                        {sale.customer_phone && <span className="block text-sm text-gray-500">{sale.customer_phone}</span>}
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="rounded-lg border border-gray-200 overflow-hidden mb-6">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Rate</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.product_name}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{item.unit_price.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-medium">{item.total_price.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-medium text-gray-900">
                                                {(sale.total_amount + sale.discount_applied).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Discount</span>
                                            <span className="font-medium text-red-600">
                                                - {sale.discount_applied.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200">
                                            <span className="text-gray-900">Grand Total</span>
                                            <span className="text-teal-700">रू {sale.total_amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};

export default function SalesHistory() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter States
    const [filterType, setFilterType] = useState("all");
    const [filterTime, setFilterTime] = useState("all");

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        // ... (existing fetch logic)
        try {
            setLoading(true);
            const data = await salesService.getSales();
            setSales(data);
        } catch (error) {
            console.error("Failed to fetch sales:", error);
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    const isWithinTimeRange = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        switch (filterTime) {
            case "today":
                return isAfter(date, startOfDay(now));
            case "yesterday": {
                const yesterday = subDays(now, 1);
                const startOfYesterday = startOfDay(yesterday);
                return isAfter(date, startOfYesterday) && date < startOfDay(now);
            }
            case "last7days":
                return isAfter(date, subDays(now, 7));
            case "thisMonth":
                return isAfter(date, startOfMonth(now));
            default:
                return true;
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch =
            (sale.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (sale.customer_phone || "").includes(searchTerm) ||
            sale.id.includes(searchTerm);

        const matchesType = filterType === "all" || sale.sales_type === filterType;
        const matchesTime = isWithinTimeRange(sale.sale_date);

        return matchesSearch && matchesType && matchesTime;
    });

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
                <p className="text-gray-500 mt-1">View and manage past transactions</p>
            </div>

            {/* Search and Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by customer name, phone or Receipt ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-xl border-gray-200"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[140px] h-11 rounded-xl border-gray-200">
                                    <SelectValue placeholder="Sales Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterTime} onValueChange={setFilterTime}>
                                <SelectTrigger className="w-[140px] h-11 rounded-xl border-gray-200">
                                    <SelectValue placeholder="Time Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales List */}
            <div className="space-y-4">
                {filteredSales.length === 0 && !loading ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-500">No sales found matching your filters</p>
                    </div>
                ) : (
                    filteredSales.map((sale) => (
                        <SaleHistoryItem key={sale.id} sale={sale} />
                    ))
                )}
            </div>
        </div>
    );
}

