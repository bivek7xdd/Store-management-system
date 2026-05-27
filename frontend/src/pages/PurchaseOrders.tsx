import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { Button } from "@/components/ui/button";
import { Plus, Eye, ShoppingCart, Trash2, Loader2, Clock, CheckCircle2, XCircle, Truck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { PurchaseOrderSupplier } from "@/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    draft: { bg: "bg-[#1A1A1A]", text: "text-[#888888]", border: "border-[#303030]", label: "Draft" },
    ordered: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-800", label: "Ordered" },
    partially_received: { bg: "bg-amber-900/20", text: "text-amber-400", border: "border-amber-800", label: "Partial Receive" },
    received: { bg: "bg-emerald-900/20", text: "text-emerald-400", border: "border-emerald-800", label: "Received" },
    cancelled: { bg: "bg-[#DA291C]/10", text: "text-[#DA291C]", border: "border-[#DA291C]/30", label: "Cancelled" },
};

const STATUS_ICONS: Record<string, typeof Clock> = {
    draft: Clock,
    ordered: Truck,
    partially_received: AlertTriangle,
    received: CheckCircle2,
    cancelled: XCircle,
};

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: purchaseOrderService.list,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => purchaseOrderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            toast.success("Order deleted");
        },
        onError: () => toast.error("Failed to delete order"),
    });

    const placeOrderMutation = useMutation({
        mutationFn: (id: string) => purchaseOrderService.updateStatus(id, "ordered"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            toast.success("Order placed");
        },
        onError: () => toast.error("Failed to place order"),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    const parseSuppliers = (jsonStr?: string): PurchaseOrderSupplier[] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr); } catch { return []; }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
                    <p className="text-[#888888] text-sm mt-1">Track orders placed with suppliers</p>
                </div>
                <Button onClick={() => navigate("/inventory/purchase-orders/new")} className="bg-[#DA291C] hover:bg-[#DA291C]/90 text-white rounded-[2px]">
                    <Plus className="h-4 w-4 mr-2" /> New Order
                </Button>
            </div>

            <div className="grid gap-3">
                {orders?.map((order) => {
                    const suppliers = parseSuppliers(order.suppliers_json);
                    const style = STATUS_STYLES[order.status] || STATUS_STYLES.draft;
                    const StatusIcon = STATUS_ICONS[order.status] || Clock;

                    return (
                        <Card key={order.id} className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-[2px] ${style.bg}`}>
                                            <StatusIcon className={`h-5 w-5 ${style.text}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">
                                                    {suppliers.map(s => s.name).join(", ") || "Order"}
                                                </span>
                                                <Badge className={`${style.bg} ${style.text} ${style.border} rounded-[2px] text-[11px]`}>
                                                    {style.label}
                                                </Badge>
                                            </div>
                                            <p className="text-[#888888] text-xs mt-1">
                                                {new Date(order.created_at).toLocaleDateString()} · रू {Number(order.total_cost).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {order.status === "draft" && (
                                            <>
                                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 rounded-[2px]"
                                                    onClick={() => placeOrderMutation.mutate(order.id)}>
                                                    <Truck className="h-4 w-4 mr-1" /> Place Order
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-[#DA291C] hover:text-[#DA291C]/80 rounded-[2px]"
                                                    onClick={() => deleteMutation.mutate(order.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {order.status === "ordered" && (
                                            <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 rounded-[2px]"
                                                onClick={() => navigate(`/inventory/purchase-orders/${order.id}/receive`)}>
                                                <Truck className="h-4 w-4 mr-1" /> Receive
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-[#888888] hover:text-white rounded-[2px]"
                                            onClick={() => navigate(`/inventory/purchase-orders/${order.id}`)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {(!orders || orders.length === 0) && (
                    <div className="text-center py-12 text-[#555555]">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No purchase orders yet</p>
                        <Button variant="outline" className="mt-4 border-[#303030] text-[#888888] rounded-[2px]"
                            onClick={() => navigate("/inventory/purchase-orders/new")}>
                            <Plus className="h-4 w-4 mr-2" /> Create First Order
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
