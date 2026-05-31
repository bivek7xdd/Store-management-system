import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { inventoryService, StockAdjustment } from "@/services/inventory";
import { format } from "date-fns";

interface StockAdjustmentTableProps {
    refreshKey?: number;
}

const REASON_LABELS: Record<string, string> = {
    physical_count: "Physical Count",
    damaged: "Damaged",
    expired: "Expired",
    theft: "Theft",
    correction: "Correction",
    return: "Return",
    other: "Other",
};

export function StockAdjustmentTable({ refreshKey }: StockAdjustmentTableProps) {
    const { data: adjustments = [], isLoading } = useQuery({
        queryKey: ["stockAdjustments", refreshKey],
        queryFn: () => inventoryService.listStockAdjustments(100, 0),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (adjustments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                <Package className="h-8 w-8 text-[#303030] mb-4" />
                <p className="text-[14px] font-medium text-white mb-1">No adjustments yet</p>
                <p className="text-[12px] text-[#888888]">
                    Stock adjustments will appear here when you create them.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Date</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Product</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Quantity</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Previous</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">New</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Reason</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {adjustments.map((adj: StockAdjustment) => (
                        <TableRow key={adj.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                            <TableCell className="text-[12px] text-[#CCCCCC]">
                                {format(new Date(adj.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-[12px] text-white font-medium">
                                {adj.product_name}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={`text-[12px] font-bold ${
                                        adj.adjustment_quantity > 0 ? "text-emerald-400" : "text-[#DA291C]"
                                    }`}
                                >
                                    {adj.adjustment_quantity > 0 ? "+" : ""}
                                    {adj.adjustment_quantity}
                                </span>
                            </TableCell>
                            <TableCell className="text-[12px] text-[#888888]">
                                {adj.previous_quantity}
                            </TableCell>
                            <TableCell className="text-[12px] text-white">
                                {adj.new_quantity}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className="bg-[#1A1A1A] text-[#CCCCCC] text-[10px] uppercase"
                                >
                                    {REASON_LABELS[adj.reason] || adj.reason}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-[12px] text-[#888888] max-w-[150px] truncate">
                                {adj.notes || "—"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}