import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Product, Supplier } from "@/types";

interface POItem {
    key: string;
    supplier_id: string;
    product_id: string;
    product_name: string;
    ordered_quantity: number;
    unit_cost: number;
}

export default function EditPurchaseOrder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: order, isLoading: orderLoading } = useQuery({
        queryKey: ["purchase-order", id],
        queryFn: () => purchaseOrderService.get(id!),
        enabled: !!id,
    });

    const { data: suppliers } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => inventoryService.getSuppliers(),
        staleTime: 300000,
        refetchOnWindowFocus: false,
    });

    const { data: products } = useQuery({
        queryKey: ["products"],
        queryFn: () => inventoryService.getProducts(),
        staleTime: 300000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const parseItems = (): POItem[] => {
        if (!order?.items_json) return [{ key: crypto.randomUUID(), supplier_id: "", product_id: "", product_name: "", ordered_quantity: 1, unit_cost: 0 }];
        const parsed = JSON.parse(order.items_json);
        return parsed.map((i: any) => ({
            key: crypto.randomUUID(),
            supplier_id: i.supplier_id || "",
            product_id: i.product_id || "",
            product_name: i.product_name || "",
            ordered_quantity: i.ordered_quantity || 1,
            unit_cost: parseFloat(i.unit_cost) || 0,
        }));
    };

    const [notes, setNotes] = useState("");
    const [expectedDelivery, setExpectedDelivery] = useState("");
    const [items, setItems] = useState<POItem[]>([]);
    const [initialized, setInitialized] = useState(false);

    if (order && !initialized) {
        setNotes(order.notes || "");
        setExpectedDelivery(order.expected_delivery_date
            ? new Date(order.expected_delivery_date).toISOString().split("T")[0]
            : "");
        setItems(parseItems());
        setInitialized(true);
    }

    const updateMutation = useMutation({
        mutationFn: () => {
            const data = {
                notes: notes || undefined,
                expected_delivery_date: expectedDelivery || undefined,
                items: items.map(item => ({
                    supplier_id: item.supplier_id,
                    product_id: item.product_id || undefined,
                    product_name: item.product_name,
                    ordered_quantity: item.ordered_quantity,
                    unit_cost: item.unit_cost,
                })),
            };
            return purchaseOrderService.update(id!, data);
        },
        onSuccess: () => {
            toast.success("Purchase order updated");
            navigate(`/inventory/purchase-orders/${id}`);
        },
        onError: () => toast.error("Failed to update order"),
    });

    const addItem = () => {
        setItems([...items, { key: crypto.randomUUID(), supplier_id: "", product_id: "", product_name: "", ordered_quantity: 1, unit_cost: 0 }]);
    };

    const removeItem = (key: string) => {
        if (items.length <= 1) return;
        setItems(items.filter(i => i.key !== key));
    };

    const updateItem = (key: string, field: keyof POItem, value: any) => {
        setItems(items.map(i => i.key === key ? { ...i, [field]: value } : i));
    };

    const selectProduct = (key: string, product: Product) => {
        setItems(items.map(i =>
            i.key === key ? {
                ...i,
                product_id: product.id,
                product_name: product.name,
                unit_cost: typeof product.cost_price === 'number' ? product.cost_price : 0,
                supplier_id: product.supplier_id || i.supplier_id,
            } : i
        ));
    };

    const totalCost = items.reduce((sum, i) => sum + (i.ordered_quantity * i.unit_cost), 0);

    if (orderLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (order && order.status !== "draft") {
        return (
            <div className="p-6">
                <p className="text-[#DA291C]">Only draft orders can be edited.</p>
                <Button variant="outline" onClick={() => navigate(`/inventory/purchase-orders/${id}`)}
                    className="mt-4 border-[#303030] text-[#888888] rounded-[2px]">
                    Back to Order
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/purchase-orders/${id}`)} className="rounded-[2px]">
                    <ArrowLeft className="h-5 w-5 text-[#888888]" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Edit Purchase Order</h1>
                    <p className="text-[#888888] text-sm mt-1">Update items, costs, or delivery date</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-[#888888] text-xs mb-1 block">Expected Delivery Date</label>
                    <Input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                        className="bg-[#0A0A0A] border-[#1A1A1A] text-white rounded-[2px]" />
                </div>
                <div>
                    <label className="text-[#888888] text-xs mb-1 block">Notes</label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                        className="bg-[#0A0A0A] border-[#1A1A1A] text-white rounded-[2px]" placeholder="Optional notes..." />
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-medium">Items</h2>
                    <Button variant="outline" size="sm" onClick={addItem}
                        className="border-[#303030] text-[#888888] rounded-[2px]">
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                </div>

                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.key} className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 grid grid-cols-5 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-[#888888] text-xs mb-1 block">Product</label>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-3 w-3 text-[#555555]" />
                                                <Input
                                                    placeholder={item.product_id ? "Product selected" : "Search or type name..."}
                                                    value={item.product_name}
                                                    onChange={e => {
                                                        updateItem(item.key, "product_id", "");
                                                        updateItem(item.key, "product_name", e.target.value);
                                                    }}
                                                    className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] pl-7 text-sm"
                                                />
                                            </div>
                                            {!item.product_id && item.product_name && products && (
                                                <div className="mt-1 bg-[#111111] border border-[#1A1A1A] max-h-32 overflow-y-auto rounded-[2px]">
                                                    {products
                                                        .filter((p: Product) => p.name.toLowerCase().includes(item.product_name.toLowerCase()))
                                                        .slice(0, 5)
                                                        .map((p: Product) => (
                                                            <button key={p.id}
                                                                className="block w-full text-left px-3 py-1.5 text-xs text-[#AAAAAA] hover:bg-[#1A1A1A] hover:text-white"
                                                                onClick={() => selectProduct(item.key, p)}>
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[#888888] text-xs mb-1 block">Supplier</label>
                                            <Select value={item.supplier_id} onValueChange={v => updateItem(item.key, "supplier_id", v)}>
                                                <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-sm">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#111111] border-[#303030] text-white">
                                                    {suppliers?.map((s: Supplier) => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-[#888888] text-xs mb-1 block">Qty</label>
                                            <Input type="number" min={1} value={item.ordered_quantity}
                                                onChange={e => updateItem(item.key, "ordered_quantity", parseInt(e.target.value) || 0)}
                                                className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-sm no-spinner" />
                                        </div>
                                        <div>
                                            <label className="text-[#888888] text-xs mb-1 block">Unit Cost</label>
                                            <Input type="number" min={0} step="0.01" value={item.unit_cost}
                                                onChange={e => updateItem(item.key, "unit_cost", parseFloat(e.target.value) || 0)}
                                                className="bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-sm no-spinner" />
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.key)}
                                        className="mt-5 text-[#555555] hover:text-[#DA291C] rounded-[2px]">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-4">
                <div>
                    <span className="text-[#888888] text-sm">Total: </span>
                    <span className="text-white font-bold text-lg">रू {totalCost.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/inventory/purchase-orders/${id}`)}
                        className="border-[#303030] text-[#888888] rounded-[2px]">
                        Cancel
                    </Button>
                    <Button onClick={() => updateMutation.mutate()}
                        className="bg-[#DA291C] hover:bg-[#DA291C]/90 text-white rounded-[2px]"
                        disabled={updateMutation.isPending || items.some(i => !i.supplier_id || !i.product_name || i.ordered_quantity <= 0)}>
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
