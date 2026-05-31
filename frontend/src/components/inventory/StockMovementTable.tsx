import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { inventoryService, StockMovement } from "@/services/inventory";
import { format } from "date-fns";

const MOVEMENT_TYPES = [
    { value: "all", label: "All Types" },
    { value: "sale", label: "Sale" },
    { value: "purchase", label: "Purchase" },
    { value: "adjustment", label: "Adjustment" },
    { value: "return", label: "Return" },
];

const TYPE_COLORS: Record<string, string> = {
    sale: "bg-amber-500/10 text-amber-400",
    purchase: "bg-emerald-500/10 text-emerald-400",
    adjustment: "bg-blue-500/10 text-blue-400",
    return: "bg-purple-500/10 text-purple-400",
};

export function StockMovementTable() {
    const [typeFilter, setTypeFilter] = useState("all");

    const { data: movements = [], isLoading } = useQuery({
        queryKey: ["stockMovements"],
        queryFn: () => inventoryService.listStockMovements(100, 0),
    });

    const filteredMovements = typeFilter === "all"
        ? movements
        : movements.filter((m: StockMovement) => m.movement_type === typeFilter);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                <Package className="h-8 w-8 text-[#303030] mb-4" />
                <p className="text-[14px] font-medium text-white mb-1">No movements yet</p>
                <p className="text-[12px] text-[#888888]">
                    Stock movements will appear here as products are sold and received.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-[#111111] border-[#1A1A1A] text-white">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#1A1A1A]">
                        {MOVEMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-white">
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Date</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Product</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Type</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Quantity</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Reference</TableHead>
                            <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovements.map((mov: StockMovement) => (
                            <TableRow key={mov.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                                <TableCell className="text-[12px] text-[#CCCCCC]">
                                    {format(new Date(mov.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-[12px] text-white font-medium">
                                    {mov.product_name}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] uppercase ${TYPE_COLORS[mov.movement_type] || "bg-[#1A1A1A] text-[#888888]"}`}
                                    >
                                        {mov.movement_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`text-[12px] font-bold ${
                                            mov.quantity_change > 0 ? "text-emerald-400" : "text-[#DA291C]"
                                        }`}
                                    >
                                        {mov.quantity_change > 0 ? "+" : ""}
                                        {mov.quantity_change}
                                    </span>
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888]">
                                    {mov.reference_type ? `${mov.reference_type}` : "—"}
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888] max-w-[150px] truncate">
                                    {mov.notes || "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
