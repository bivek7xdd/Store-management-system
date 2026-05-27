import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Loader2, Package, AlertTriangle } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    draft: { bg: "bg-[#1A1A1A]", text: "text-[#888888]", border: "border-[#303030]", label: "Draft" },
    ordered: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-800", label: "Ordered" },
    partially_received: { bg: "bg-amber-900/20", text: "text-amber-400", border: "border-amber-800", label: "Partial Receive" },
    received: { bg: "bg-emerald-900/20", text: "text-emerald-400", border: "border-emerald-800", label: "Received" },
    cancelled: { bg: "bg-[#DA291C]/10", text: "text-[#DA291C]", border: "border-[#DA291C]/30", label: "Cancelled" },
};

export default function PurchaseOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: order, isLoading } = useQuery({
        queryKey: ["purchase-order", id],
        queryFn: () => purchaseOrderService.get(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (!order) {
        return <div className="p-6 text-[#888888]">Order not found</div>;
    }

    const items = order.items_json ? JSON.parse(order.items_json) : [];
    const style = STATUS_STYLES[order.status] || STATUS_STYLES.draft;

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/inventory/purchase-orders")} className="rounded-[2px]">
                    <ArrowLeft className="h-5 w-5 text-[#888888]" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Purchase Order</h1>
                        <Badge className={`${style.bg} ${style.text} ${style.border} rounded-[2px]`}>{style.label}</Badge>
                    </div>
                    <p className="text-[#888888] text-sm mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                {order.status === "ordered" && (
                    <Button onClick={() => navigate(`/inventory/purchase-orders/${id}/receive`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-[2px]">
                        <Truck className="h-4 w-4 mr-2" /> Receive
                    </Button>
                )}
            </div>

            {order.notes && (
                <p className="text-[#888888] text-sm mb-4 bg-[#111111] p-3 rounded-[2px]">{order.notes}</p>
            )}

            <Card className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]">
                <CardHeader>
                    <CardTitle className="text-white text-sm">Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {items.map((item: any) => {
                            return (
                                <div key={item.id} className="flex items-center gap-4 bg-[#111111] p-3 rounded-[2px]">
                                    <Package className="h-5 w-5 text-[#555555]" />
                                    <div className="flex-1">
                                        <p className="text-white text-sm">{item.product_name}</p>
                                        <p className="text-[#555555] text-xs">Supplier: {item.supplier_name}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        <p className="text-[#888888]">
                                            Ordered: <span className="text-white">{item.ordered_quantity}</span>
                                        </p>
                                        <p className="text-emerald-400">
                                            Received: <span className="text-white">{item.received_quantity}</span>
                                        </p>
                                        {item.damaged_quantity > 0 && (
                                            <p className="text-[#DA291C] flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Damaged: {item.damaged_quantity}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#888888] text-xs">Unit cost</p>
                                        <p className="text-white text-sm">${parseFloat(item.unit_cost).toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="mt-4 text-right">
                <p className="text-[#888888] text-sm">Total: <span className="text-white font-bold text-lg">${Number(order.total_cost).toFixed(2)}</span></p>
            </div>
        </div>
    );
}
