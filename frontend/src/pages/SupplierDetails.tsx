import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { getSupplierPayableSummary, recordSupplierPayment, SupplierPayable } from "@/services/supplierPayableService";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Truck, 
    Pencil, 
    Trash2, 
    Package, 
    AlertTriangle, 
    TrendingUp, 
    Mail, 
    Phone, 
    MapPin, 
    Plus,
    Search,
    ExternalLink,
    Loader2,
    Building2,
    Wallet,
    CreditCard,
    Copy
} from "lucide-react";
import { SupplierDialog } from "@/components/CreateInventoryDialogs";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/services/api";

// Helper to extract numeric values from pgtype
const getNumericValue = (value: number | { Int64?: number; Int32?: number; String?: string }): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') {
        if ('Int64' in value) return value.Int64 || 0;
        if ('Int32' in value) return value.Int32 || 0;
        if ('String' in value) return parseFloat(value.String) || 0;
    }
    return 0;
};

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentNotes, setPaymentNotes] = useState("");

    const { data: supplier, isLoading: supplierLoading } = useQuery({
        queryKey: ["supplier", id],
        queryFn: () => inventoryService.getSupplier(id!),
        enabled: !!id,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["supplier-stats", id],
        queryFn: () => inventoryService.getSupplierStats(id!),
        enabled: !!id,
    });

    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ["supplier-products", id],
        queryFn: () => inventoryService.getSupplierProducts(id!),
        enabled: !!id,
    });

    const { data: payableSummary } = useQuery({
        queryKey: ["supplierPayableSummary"],
        queryFn: getSupplierPayableSummary,
    });

    const { data: allPayables } = useQuery({
        queryKey: ["supplierPayables"],
        queryFn: () => {
                return api.get("/supplier-payables").then((r) => 
                    r.data.data as SupplierPayable[]);
        },
    });

    const supplierPayables = allPayables?.filter((p: SupplierPayable) => p.supplier_id === id) || [];
    const supplierOutstanding = supplierPayables.reduce((sum: number, p: SupplierPayable) => sum + (Number(p.amount_owed) - Number(p.amount_paid)), 0);

    const paymentMutation = useMutation({
        mutationFn: (data: { payable_id: string; amount: number; method: string; notes: string }) =>
            recordSupplierPayment(data.payable_id, {
                amount: data.amount,
                payment_method: data.method,
                notes: data.notes,
            }),
        onSuccess: () => {
            toast.success("Payment recorded successfully");
            queryClient.invalidateQueries({ queryKey: ["supplierPayables"] });
            queryClient.invalidateQueries({ queryKey: ["supplierPayableSummary"] });
            setPaymentDialogOpen(false);
            setPaymentAmount("");
            setPaymentMethod("cash");
            setPaymentNotes("");
        },
        onError: () => {
            toast.error("Failed to record payment");
        },
    });

    const handleDelete = async () => {
        if (!id) return;
        try {
            await inventoryService.deleteSupplier(id);
            toast.success("Supplier deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            navigate("/inventory/suppliers");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete supplier");
        }
    };

    const filteredProducts = products?.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof p.barcode === 'string' ? p.barcode : p.barcode?.String || "").includes(searchTerm)
    );

    if (supplierLoading || statsLoading || productsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 text-[#DA291C] animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#888888]">Loading Vendor Intel</span>
            </div>
        );
    }

    if (!supplier) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Truck className="h-10 w-10 text-[#1A1A1A]" />
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#555555]">Vendor Not Found</span>
        </div>
    );

    const statsCards = [
        {
            title: "Total Products",
            value: stats?.product_count || 0,
            icon: Package,
            accent: "text-[#DA291C]",
        },
        {
            title: "Inventory Value",
            value: `रू ${getNumericValue(stats?.total_value).toLocaleString()}`,
            icon: TrendingUp,
            accent: "text-emerald-500",
        },
        {
            title: "Low Stock Items",
            value: stats?.low_stock_count || 0,
            icon: AlertTriangle,
            accent: "text-amber-500",
        }
    ];

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate("/inventory/suppliers")}
                        className="h-9 w-9 rounded-[2px] border border-[#1A1A1A] bg-[#111111] flex items-center justify-center text-[#888888] hover:text-white hover:border-[#303030] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Vendor Profile</p>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[22px] font-medium text-white tracking-tight">{supplier.name}</h1>
                            <Badge className="rounded-[2px] bg-[#DA291C] text-white text-[9px] font-black uppercase tracking-[1px] border-none px-2 py-0.5 h-auto">
                                Vendor
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SupplierDialog supplier={supplier} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["supplier", id] })}>
                        <Button className="h-9 px-4 rounded-[2px] border border-[#1A1A1A] bg-transparent text-[#CCCCCC] text-[10px] font-bold uppercase tracking-[1px] hover:bg-[#1A1A1A] hover:text-white transition-colors">
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit Profile
                        </Button>
                    </SupplierDialog>
                    <Button 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="h-9 px-4 rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] font-bold uppercase tracking-[1px] transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Remove
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats and Contact */}
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {statsCards.map((stat) => (
                            <div
                                key={stat.title}
                                className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6 group hover:border-[#303030] transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">{stat.title}</p>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`${stat.accent} group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Information */}
                    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                        <div className="p-5 border-b border-[#1A1A1A] flex items-center gap-3">
                            <div className="h-7 w-7 bg-[#0A0A0A] border border-[#303030] rounded-[2px] flex items-center justify-center">
                                <Truck className="h-3.5 w-3.5 text-[#DA291C]" />
                            </div>
                            <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Contact Intel</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                                    <Mail className="h-3.5 w-3.5 text-[#555555]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Email Address</p>
                                    {supplier.email ? (
                                        <a href={`mailto:${supplier.email}`} className="text-[12px] text-[#DA291C] hover:underline font-medium break-all">
                                            {supplier.email}
                                        </a>
                                    ) : (
                                        <span className="text-[12px] text-[#333333] italic">Not provided</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                                    <Phone className="h-3.5 w-3.5 text-[#555555]" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Phone Number</p>
                                    {supplier.phone_number ? (
                                        <a href={`tel:${supplier.phone_number}`} className="text-[12px] text-white font-medium">
                                            {supplier.phone_number}
                                        </a>
                                    ) : (
                                        <span className="text-[12px] text-[#333333] italic">Not provided</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="h-8 w-8 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                                    <MapPin className="h-3.5 w-3.5 text-[#555555]" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Office Address</p>
                                    <p className="text-[12px] text-[#AAAAAA] leading-relaxed font-medium">
                                        {supplier.address || <span className="text-[#333333] italic">No address recorded</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank / Payment Details */}
                    {((supplier)?.bank_name || (supplier)?.account_number || (supplier)?.esewa_id || (supplier)?.khalti_id) && (
                        <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                            <div className="p-5 border-b border-[#1A1A1A] flex items-center gap-3">
                                <div className="h-7 w-7 bg-[#0A0A0A] border border-[#303030] rounded-[2px] flex items-center justify-center">
                                    <Building2 className="h-3.5 w-3.5 text-[#DA291C]" />
                                </div>
                                <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Payment Details</p>
                            </div>
                            <div className="p-6 space-y-5">
                                {(supplier)?.bank_name && (
                                    <div>
                                        <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Bank</p>
                                        <p className="text-[12px] text-white font-medium">{(supplier).bank_name}</p>
                                        {(supplier)?.branch && <p className="text-[11px] text-[#888888] mt-0.5">{(supplier).branch}</p>}
                                    </div>
                                )}
                                {(supplier)?.account_name && (
                                    <div>
                                        <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Account Name</p>
                                        <p className="text-[12px] text-white font-medium">{(supplier).account_name}</p>
                                    </div>
                                )}
                                {(supplier)?.account_number && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Account Number</p>
                                            <p className="text-[12px] text-white font-mono font-medium">{(supplier).account_number}</p>
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText((supplier).account_number); toast.success("Copied"); }}
                                            className="p-1.5 hover:bg-[#1A1A1A] rounded-[2px] text-[#555555] hover:text-white transition-colors">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                {(supplier)?.swift_code && (
                                    <div>
                                        <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">SWIFT Code</p>
                                        <p className="text-[12px] text-white font-mono font-medium">{(supplier).swift_code}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1A1A1A]">
                                    {(supplier)?.esewa_id && (
                                        <div>
                                            <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">eSewa</p>
                                            <p className="text-[12px] text-emerald-400 font-medium">{(supplier).esewa_id}</p>
                                        </div>
                                    )}
                                    {(supplier)?.khalti_id && (
                                        <div>
                                            <p className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1">Khalti</p>
                                            <p className="text-[12px] text-purple-400 font-medium">{(supplier).khalti_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Associated Products */}
                <div className="lg:col-span-2">
                    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden flex flex-col min-h-[500px]">
                        {/* Products Header */}
                        <div className="p-5 border-b border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Associated Products</p>
                                <p className="text-[10px] text-[#555555] uppercase tracking-[0.5px] mt-0.5">All items sourced from this vendor</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555555]" />
                                <input
                                    placeholder="SEARCH BY NAME OR BARCODE..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] text-[10px] font-bold uppercase tracking-[1px] text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="flex-grow overflow-auto">
                            {filteredProducts && filteredProducts.length > 0 ? (
                                <div>
                                    {/* Table Header */}
                                    <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 px-6 py-3 bg-[#0A0A0A] border-b border-[#1A1A1A] sticky top-0 z-10">
                                        {["Product", "Stock", "Price", ""].map(h => (
                                            <span key={h} className={`text-[9px] font-black uppercase tracking-widest text-[#555555] ${h === 'Price' ? 'text-right' : ''}`}>{h}</span>
                                        ))}
                                    </div>

                                    {/* Table Rows */}
                                    <div className="divide-y divide-[#1A1A1A]">
                                        {filteredProducts.map((product) => {
                                            const isLowStock = product.stock_quantity <= getNumericValue(product.low_stock_threshold);
                                            return (
                                                <div key={product.id} className="group grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center hover:bg-[#0A0A0A] transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-white uppercase tracking-tight group-hover:text-[#DA291C] transition-colors">{product.name}</span>
                                                        <span className="text-[10px] text-[#555555] font-medium">{typeof product.barcode === 'string' ? product.barcode : product.barcode?.String || "No Barcode"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[13px] font-bold ${isLowStock ? "text-amber-500" : "text-white"}`}>
                                                            {product.stock_quantity}
                                                        </span>
                                                        {isLowStock && (
                                                            <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] uppercase font-black py-0 h-4 rounded-[1px]">Low</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-mono text-[13px] text-white font-bold">रू {getNumericValue(product.price).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Link 
                                                            to="/inventory"
                                                            className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#555555] hover:text-[#DA291C] hover:border-[#DA291C]/30 transition-colors"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-16 text-center h-full">
                                    <div className="h-14 w-14 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mb-5">
                                        <Package className="h-7 w-7 text-[#1A1A1A]" />
                                    </div>
                                    <h3 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-2">No Products Found</h3>
                                    <p className="text-[11px] text-[#555555] uppercase tracking-[0.5px] max-w-xs">
                                        {searchTerm ? `No products match "${searchTerm}"` : "This vendor hasn't been associated with any products yet."}
                                    </p>
                                    {!searchTerm && (
                                        <Button 
                                            asChild
                                            className="mt-6 h-9 px-5 rounded-[2px] border border-[#1A1A1A] bg-transparent text-[#CCCCCC] text-[10px] font-bold uppercase tracking-[1px] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                                        >
                                            <Link to="/inventory">
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Associate Product
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="lg:col-span-3">
                    <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                        <div className="p-5 border-b border-[#1A1A1A] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Payables & Payment History</p>
                                <p className="text-[10px] text-[#555555] uppercase tracking-[0.5px] mt-0.5">Outstanding invoices and recorded payments</p>
                            </div>
                            {supplierOutstanding > 0 && (
                                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest py-1 h-6 rounded-[2px]">
                                    Outstanding: रू {supplierOutstanding.toLocaleString()}
                                </Badge>
                            )}
                        </div>

                        {supplierPayables.length > 0 ? (
                            <div>
                                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-3 bg-[#0A0A0A] border-b border-[#1A1A1A]">
                                    {["Invoice", "Total", "Paid", "Owed", "Status", ""].map(h => (
                                        <span key={h} className={`text-[9px] font-black uppercase tracking-widest text-[#555555] ${h === 'Total' || h === 'Paid' || h === 'Owed' ? 'text-right' : ''}`}>{h}</span>
                                    ))}
                                </div>
                                <div className="divide-y divide-[#1A1A1A]">
                                    {supplierPayables.map((payable: SupplierPayable) => {
                                        const owed = Number(payable.amount_owed) - Number(payable.amount_paid);
                                        const isPaid = owed <= 0;
                                        return (
                                            <div key={payable.id} className="group grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center hover:bg-[#0A0A0A] transition-colors">
                                                <div>
                                                    <span className="text-[13px] font-bold text-white uppercase tracking-tight">{payable.invoice_number || `INV-${payable.id.substring(0, 8)}`}</span>
                                                    <p className="text-[10px] text-[#555555] mt-0.5">{payable.description || "No description"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono text-[13px] text-white font-bold">रू {Number(payable.amount_owed).toLocaleString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono text-[13px] text-emerald-400 font-bold">रू {Number(payable.amount_paid).toLocaleString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-mono text-[13px] font-bold ${owed > 0 ? 'text-amber-400' : 'text-[#333333]'}`}>रू {owed.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <Badge className={`text-[8px] uppercase font-black py-0 h-5 rounded-[1px] ${isPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                        {isPaid ? "Paid" : "Pending"}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-end">
                                                    {!isPaid && (
                                                        <button
                                                            onClick={() => { setSelectedPayable(payable); setPaymentDialogOpen(true); }}
                                                            className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] flex items-center justify-center text-[#555555] hover:text-[#DA291C] hover:border-[#DA291C]/30 transition-colors"
                                                        >
                                                            <Wallet className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-16 text-center">
                                <div className="h-14 w-14 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mb-5">
                                    <CreditCard className="h-7 w-7 text-[#1A1A1A]" />
                                </div>
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-2">No Payables Recorded</h3>
                                <p className="text-[11px] text-[#555555] uppercase tracking-[0.5px]">No invoices or payment records found for this supplier.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Delete Vendor?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
                            This will permanently remove <span className="font-bold text-white">{supplier.name}</span> from your records. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            onClick={handleDelete}
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-6"
                        >
                            Delete Vendor
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
                setPaymentDialogOpen(open);
                if (!open) {
                    setPaymentAmount("");
                    setPaymentMethod("cash");
                    setPaymentNotes("");
                }
            }}>
                <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Record Payment</DialogTitle>
                        <DialogDescription className="text-[12px] text-[#888888]">
                            {selectedPayable && `Invoice: ${selectedPayable.invoice_number || 'N/A'} | Outstanding: रू ${(Number(selectedPayable.amount_owed) - Number(selectedPayable.amount_paid)).toLocaleString()}`}
                        </DialogDescription>
                    </DialogHeader> 
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1.5 block">Amount (रू)</label>
                            <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" step="0.01"
                                max={selectedPayable ? Number(selectedPayable.amount_owed) - Number(selectedPayable.amount_paid) : 0}
                                className="w-full h-10 px-4 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[12px] font-bold text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors"
                                placeholder="Enter payment amount" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1.5 block">Payment Method</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-full h-10 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[12px] font-bold text-white focus:outline-none focus:border-[#DA291C]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="esewa">eSewa</SelectItem>
                                    <SelectItem value="khalti">Khalti</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-[#555555] uppercase tracking-[1.5px] mb-1.5 block">Notes (Optional)</label>
                            <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2}
                                className="w-full px-4 py-2 bg-[#111111] border border-[#1A1A1A] rounded-[2px] text-[12px] text-white placeholder:text-[#333333] focus:outline-none focus:border-[#DA291C] transition-colors resize-none"
                                placeholder="Reference number, remarks..." />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={() => setPaymentDialogOpen(false)}
                            className="flex-1 bg-transparent border border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (!selectedPayable || !paymentAmount) return;
                            paymentMutation.mutate({
                                payable_id: selectedPayable.id,
                                amount: Number(paymentAmount),
                                method: paymentMethod,
                                notes: paymentNotes,
                            });
                        }} disabled={paymentMutation.isPending || !paymentAmount}
                            className="flex-1 bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            {paymentMutation.isPending ? "Recording..." : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
