import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salesService, Sale, SaleItem } from "@/services/sales";
import { useEffect, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaleDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleId: string | null;
}

export function SaleDetailsDialog({ open, onOpenChange, saleId }: SaleDetailsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [sale, setSale] = useState<Sale | null>(null);
    const [items, setItems] = useState<SaleItem[]>([]);

    useEffect(() => {
        if (open && saleId) {
            setLoading(true);
            salesService.getSaleDetails(saleId)
                .then((data) => {
                    setSale(data.sale);
                    setItems(data.items || []);
                })
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setSale(null);
            setItems([]);
        }
    }, [open, saleId]);

    const handlePrint = () => {
        window.print();
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle>Sale Details / Receipt</DialogTitle>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : sale ? (
                    <div className="space-y-6 pt-4" id="printable-receipt">
                        {/* Store Info & Date */}
                        <div className="flex justify-between pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-lg">StoreHub</h3>
                                <p className="text-sm text-gray-500">Kathmandu, Nepal</p>
                                <p className="text-sm text-gray-500">VAT/PAN: 123456789</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">Receipt #{sale.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(sale.sale_date).toLocaleDateString()} {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-sm font-medium mt-1 capitalize">{sale.sales_type} Sale</p>
                            </div>
                        </div>

                        {/* Customer Info at top if exists */}
                        {(sale.customer_name || sale.customer_phone) && (
                            <div className="text-sm bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold block text-gray-700">Bill To:</span>
                                <span className="block font-medium">{sale.customer_name || "N/A"}</span>
                                {sale.customer_phone && <span className="block text-gray-500">{sale.customer_phone}</span>}
                            </div>
                        )}

                        {/* Items Table */}
                        <Table>
                            <TableHeader>
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
                                        <TableCell className="text-right">
                                            {item.unit_price.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {item.total_price.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Totals */}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <div className="w-48 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">
                                        {(sale.total_amount + sale.discount_applied).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="font-medium text-red-500">
                                        - {sale.discount_applied.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                    <span>Grand Total</span>
                                    <span>रू {sale.total_amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-8 pb-4 text-xs text-gray-400">
                            <p>Thank you for your business!</p>
                            <p>Powered by StoreHub</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Details unavailable
                    </div>
                )}
            </DialogContent>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    div[role="dialog"] {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                    }
                }
            `}</style>
        </Dialog>
    );
}
