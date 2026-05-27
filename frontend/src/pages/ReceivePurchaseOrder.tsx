import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Truck } from "lucide-react";
import { toast } from "sonner";

interface SupplierPaymentEntry {
    supplierId: string;
    supplierName: string;
    totalDue: number;
    paymentAmount: number;
    paymentMethod: string;
    paymentNotes: string;
}

export default function ReceivePurchaseOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ["purchase-order", id],
        queryFn: () => purchaseOrderService.get(id!),
        enabled: !!id,
    });

    const [receives, setReceives] = useState<Record<string, { received: number; damaged: number }>>({});
    const [payments, setPayments] = useState<Record<string, SupplierPaymentEntry>>({});

    const receiveMutation = useMutation({
        mutationFn: () => {
            const items = Object.entries(receives).map(([itemId, vals]) => ({
                item_id: itemId,
                received_quantity: vals.received,
                damaged_quantity: vals.damaged,
            }));

            const paymentsArr = Object.values(payments).filter(p => p.totalDue > 0);

            return purchaseOrderService.receive(id!, { items, payments: paymentsArr });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
            toast.success("Receiving completed");
            navigate(`/inventory/purchase-orders/${id}`);
        },
        onError: () => toast.error("Failed to process receiving"),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    const items = order?.items_json ? JSON.parse(order.items_json) : [];
    const groupedBySupplier: Record<string, any[]> = {};
    items.forEach((item: any) => {
        if (!groupedBySupplier[item.supplier_id]) groupedBySupplier[item.supplier_id] = [];
        groupedBySupplier[item.supplier_id].push(item);
    });

    // Initialize receive state for each item
    if (Object.keys(receives).length === 0 && items.length > 0) {
        const initReceives: Record<string, { received: number; damaged: number }> = {};
        const initPayments: Record<string, SupplierPaymentEntry> = {};
        items.forEach((item: any) => {
            initReceives[item.id] = { received: 0, damaged: 0 };
        });
        Object.entries(groupedBySupplier).forEach(([supplierId, supplierItems]) => {
            const total = supplierItems.reduce((sum: number, i: any) =>
                sum + (i.ordered_quantity - i.received_quantity - i.damaged_quantity) * parseFloat(i.unit_cost), 0);
            initPayments[supplierId] = {
                supplierId,
                supplierName: supplierItems[0].supplier_name,
                totalDue: total,
                paymentAmount: 0,
                paymentMethod: "cash",
                paymentNotes: "",
            };
        });
        setReceives(initReceives);
        setPayments(initPayments);
    }

    const updateReceive = (itemId: string, field: 'received' | 'damaged', value: number) => {
        setReceives(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: Math.max(0, value) }
        }));
    };

    const updatePayment = (supplierId: string, field: keyof SupplierPaymentEntry, value: any) => {
        setPayments(prev => ({
            ...prev,
            [supplierId]: { ...prev[supplierId], [field]: value }
        }));
    };

    const allValid = Object.entries(groupedBySupplier).every(([_, supplierItems]) => {
        return supplierItems.every((item: any) => {
            const rcv = receives[item.id];
            if (!rcv) return false;
            const remaining = item.ordered_quantity - item.received_quantity - item.damaged_quantity;
            return (rcv.received + rcv.damaged) <= remaining;
        });
    });

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/purchase-orders/${id}`)} className="rounded-[2px]">
                    <ArrowLeft className="h-5 w-5 text-[#888888]" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Receive Order</h1>
                    <p className="text-[#888888] text-sm mt-1">Tick off what arrived and handle payments</p>
                </div>
            </div>

            {Object.entries(groupedBySupplier).map(([supplierId, supplierItems]) => (
                <Card key={supplierId} className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Truck className="h-4 w-4 text-[#DA291C]" />
                            {supplierItems[0].supplier_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {supplierItems.map((item: any) => {
                                const remaining = item.ordered_quantity - item.received_quantity - item.damaged_quantity;
                                const rcv = receives[item.id] || { received: 0, damaged: 0 };
                                const overReceive = (rcv.received + rcv.damaged) > remaining;

                                return (
                                    <div key={item.id} className="flex items-center gap-4 bg-[#111111] p-3 rounded-[2px]">
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{item.product_name}</p>
                                            <p className="text-[#555555] text-xs">Ordered: {item.ordered_quantity} · Previously received: {item.received_quantity} · Remaining: {remaining}</p>
                                            <p className="text-[#555555] text-xs">Unit cost: ${parseFloat(item.unit_cost).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <label className="text-[#888888] text-[10px] block mb-0.5">Good</label>
                                                <Input type="number" min={0} max={remaining} value={rcv.received}
                                                    onChange={e => updateReceive(item.id, 'received', parseInt(e.target.value) || 0)}
                                                    className="w-20 bg-[#0A0A0A] border-[#1A1A1A] text-white rounded-[2px] text-sm h-8" />
                                            </div>
                                            <div>
                                                <label className="text-[#888888] text-[10px] block mb-0.5">Damaged</label>
                                                <Input type="number" min={0} max={remaining - rcv.received} value={rcv.damaged}
                                                    onChange={e => updateReceive(item.id, 'damaged', parseInt(e.target.value) || 0)}
                                                    className="w-20 bg-[#0A0A0A] border-[#1A1A1A] text-white rounded-[2px] text-sm h-8" />
                                            </div>
                                        </div>
                                        {overReceive && (
                                            <AlertTriangle className="h-4 w-4 text-[#DA291C]" />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Payment section per supplier */}
                            {payments[supplierId] && (
                                <div className="border-t border-[#1A1A1A] pt-3 mt-3">
                                    <p className="text-[#888888] text-xs mb-2">
                                        Total due for {payments[supplierId].supplierName}: <span className="text-white font-medium">${payments[supplierId].totalDue.toFixed(2)}</span>
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="text-[#888888] text-[10px] block mb-0.5">Pay Amount</label>
                                            <Input type="number" min={0} max={payments[supplierId].totalDue} step="0.01"
                                                value={payments[supplierId].paymentAmount}
                                                onChange={e => updatePayment(supplierId, 'paymentAmount', parseFloat(e.target.value) || 0)}
                                                className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-sm h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[#888888] text-[10px] block mb-0.5">Method</label>
                                            <Select value={payments[supplierId].paymentMethod}
                                                onValueChange={v => updatePayment(supplierId, 'paymentMethod', v)}>
                                                <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-sm h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#111111] border-[#303030] text-white">
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="esewa">eSewa</SelectItem>
                                                    <SelectItem value="khalti">Khalti</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1A1A1A]">
                <Button variant="outline" onClick={() => navigate(`/inventory/purchase-orders/${id}`)}
                    className="border-[#303030] text-[#888888] rounded-[2px]">
                    Cancel
                </Button>
                <Button onClick={() => receiveMutation.mutate()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2px]"
                    disabled={receiveMutation.isPending || !allValid}>
                    {receiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Complete Receiving
                </Button>
            </div>
        </div>
    );
}
