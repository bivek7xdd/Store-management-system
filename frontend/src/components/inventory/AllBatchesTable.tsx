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
import { inventoryService, ProductBatch } from "@/services/inventory";
import { format } from "date-fns";

const getTextValue = (value: { String?: string; Valid?: boolean } | string | undefined): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'Valid' in value && value.Valid) return value.String || '';
    return '';
};

export function AllBatchesTable() {
    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: () => inventoryService.getProducts(200),
    });

    const { data: allBatches = [], isLoading: batchesLoading } = useQuery({
        queryKey: ["allBatches"],
        queryFn: async () => {
            const batches: (ProductBatch & { product_name?: string })[] = [];
            for (const product of products) {
                const productBatches = await inventoryService.listProductBatches(product.id);
                for (const batch of productBatches) {
                    batches.push({
                        ...batch,
                        product_name: product.name,
                    });
                }
            }
            return batches.sort((a, b) => {
                const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
                const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
                return dateA - dateB;
            });
        },
        enabled: products.length > 0,
    });

    if (productsLoading || batchesLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
        );
    }

    if (allBatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#1A1A1A] rounded-[2px]">
                <Package className="h-8 w-8 text-[#303030] mb-4" />
                <p className="text-[14px] font-medium text-white mb-1">No batches yet</p>
                <p className="text-[12px] text-[#888888]">
                    Add batches to products to track batch details.
                </p>
            </div>
        );
    }

    const getExpiryStatus = (expiryDate: string | undefined) => {
        if (!expiryDate) return null;
        const daysUntil = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return { label: "Expired", color: "bg-red-500/10 text-red-400 border-red-500/20" };
        if (daysUntil <= 30) return { label: `${daysUntil}d`, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
        return null;
    };

    return (
        <div className="border border-[#1A1A1A] rounded-[2px] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[#1A1A1A] hover:bg-transparent">
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Product</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Batch #</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Mfg Date</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Expiry Date</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px] text-right">Quantity</TableHead>
                        <TableHead className="text-[11px] text-[#888888] uppercase tracking-[1px]">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allBatches.map((batch) => {
                        const expiryStatus = getExpiryStatus(batch.expiry_date);
                        return (
                            <TableRow key={batch.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                                <TableCell className="text-[12px] text-white font-medium">
                                    {getTextValue(batch.product_name)}
                                </TableCell>
                                <TableCell className="text-[12px] text-[#CCCCCC]">
                                    {batch.batch_number}
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888]">
                                    {batch.manufacturing_date 
                                        ? format(new Date(batch.manufacturing_date), "MMM d, yyyy")
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-[12px]">
                                    {batch.expiry_date ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#888888]">
                                                {format(new Date(batch.expiry_date), "MMM d, yyyy")}
                                            </span>
                                            {expiryStatus && (
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] ${expiryStatus.color}`}
                                                >
                                                    {expiryStatus.label}
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[#888888]">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-[12px] text-white text-right font-bold">
                                    {batch.quantity}
                                </TableCell>
                                <TableCell className="text-[12px] text-[#888888] max-w-[150px] truncate">
                                    {getTextValue(batch.notes) || "—"}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
