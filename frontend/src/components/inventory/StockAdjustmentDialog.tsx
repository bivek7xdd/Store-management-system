import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, CreateStockAdjustmentData } from "@/services/inventory";
import { Product } from "@/types";

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
}

const REASONS = [
    { value: "physical_count", label: "Physical Count" },
    { value: "damaged", label: "Damaged" },
    { value: "expired", label: "Expired" },
    { value: "theft", label: "Theft" },
    { value: "correction", label: "Correction" },
    { value: "return", label: "Return" },
    { value: "other", label: "Other" },
];

export function StockAdjustmentDialog({ open, onOpenChange, products }: StockAdjustmentDialogProps) {
    const [productId, setProductId] = useState("");
    const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: CreateStockAdjustmentData) => inventoryService.createStockAdjustment(data),
        onSuccess: () => {
            toast.success("Stock adjustment created successfully");
            onOpenChange(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create adjustment");
        },
    });

    const resetForm = () => {
        setProductId("");
        setAdjustmentQuantity("");
        setReason("");
        setNotes("");
        setFormErrors({});
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!productId) errors.product_id = "product is required";
        if (!adjustmentQuantity || parseInt(adjustmentQuantity) === 0) {
            errors.adjustment_quantity = "quantity cannot be zero";
        }
        if (!reason) errors.reason = "reason is required";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        createMutation.mutate({
            product_id: productId,
            adjustment_quantity: parseInt(adjustmentQuantity),
            reason,
            notes: notes || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#0A0A0A] border border-[#1A1A1A]">
                <DialogHeader>
                    <DialogTitle className="text-white">Create Stock Adjustment</DialogTitle>
                    <DialogDescription className="text-[#888888]">
                        Adjust stock quantity for a product. Use positive numbers to add stock, negative to remove.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[#888888]">Product *</Label>
                        <Select value={productId} onValueChange={setProductId}>
                            <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="text-white">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.product_id && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.product_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Adjustment Quantity *</Label>
                        <Input
                            type="number"
                            value={adjustmentQuantity}
                            onChange={(e) => setAdjustmentQuantity(e.target.value)}
                            placeholder="+10 to add, -5 to remove"
                            className="bg-[#111111] border-[#1A1A1A] text-white"
                        />
                        {formErrors.adjustment_quantity && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.adjustment_quantity}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Reason *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="bg-[#111111] border-[#1A1A1A] text-white">
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                                {REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value} className="text-white">
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.reason && (
                            <p className="text-[11px] text-[#DA291C]">{formErrors.reason}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#888888]">Notes (optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes..."
                            className="bg-[#111111] border-[#1A1A1A] text-white"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-[#1A1A1A] text-[#888888]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Create Adjustment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}