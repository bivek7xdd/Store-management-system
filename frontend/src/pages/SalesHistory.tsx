
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, ChevronRight, User, Phone, ArrowUpRight, ChevronDown, Loader2, Printer, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { salesService, Sale, SaleItem } from "@/services/sales";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { startOfDay, subDays, startOfMonth, isAfter, isValid } from "date-fns";

const safeDate = (dateString: string | undefined): Date => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isValid(date) ? date : new Date();
};

const SaleHistoryItem = ({ sale }: { sale: Sale }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open && !loaded) {
            setLoading(true);
            try {
                const data = await salesService.getSaleDetails(String(sale.id));
                setItems(data.items || []);
                setLoaded(true);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePrintThermal = (e: React.MouseEvent) => {
        e.stopPropagation();
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (!printWindow) return;

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt #${String(sale.id).slice(0, 8)}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.4;
                        width: 80mm;
                        padding: 8mm 4mm;
                        background: white;
                        color: black;
                    }
                    .receipt {
                        width: 100%;
                    }
                    .center {
                        text-align: center;
                    }
                    .bold {
                        font-weight: bold;
                    }
                    .store-name {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    .store-info {
                        font-size: 11px;
                        color: #333;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 8px 0;
                    }
                    .double-divider {
                        border-top: 2px solid #000;
                        margin: 8px 0;
                    }
                    .receipt-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        margin: 4px 0;
                    }
                    .items-header {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        font-size: 11px;
                        padding: 4px 0;
                    }
                    .item-row {
                        margin: 6px 0;
                    }
                    .item-name {
                        font-size: 12px;
                        margin-bottom: 2px;
                    }
                    .item-detail {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #333;
                        padding-left: 8px;
                    }
                    .totals {
                        margin-top: 8px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                        margin: 4px 0;
                    }
                    .grand-total {
                        font-size: 14px;
                        font-weight: bold;
                        padding: 6px 0;
                    }
                    .footer {
                        margin-top: 16px;
                        text-align: center;
                        font-size: 11px;
                    }
                    .barcode {
                        font-family: 'Libre Barcode 39', cursive;
                        font-size: 32px;
                        margin: 8px 0;
                    }
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="center">
                        <div class="store-name">STOREHUB</div>
                        <div class="store-info">Kathmandu, Nepal</div>
                        <div class="store-info">Tel: 01-1234567</div>
                        <div class="store-info">VAT/PAN: 123456789</div>
                    </div>
                    <div class="double-divider"></div>
                    <div class="receipt-info">
                        <span>Receipt #:</span>
                        <span>${String(sale.id).slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div class="receipt-info">
                        <span>Date:</span>
                        <span>${new Date(sale.sale_date).toLocaleDateString()}</span>
                    </div>
                    <div class="receipt-info">
                        <span>Time:</span>
                        <span>${safeDate(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="receipt-info">
                        <span>Type:</span>
                        <span>${sale.sales_type.toUpperCase()}</span>
                    </div>
                    ${sale.customer_name ? `
                    <div class="receipt-info">
                        <span>Customer:</span>
                        <span>${sale.customer_name}</span>
                    </div>
                    ` : ''}
                    ${sale.customer_phone ? `
                    <div class="receipt-info">
                        <span>Phone:</span>
                        <span>${sale.customer_phone}</span>
                    </div>
                    ` : ''}
                    <div class="divider"></div>
                    <div class="items-header">
                        <span>ITEM</span>
                        <span>AMOUNT</span>
                    </div>
                    <div class="divider"></div>
                    ${items.map(item => `
                    <div class="item-row">
                        <div class="item-name">${item.product_name}</div>
                        <div class="item-detail">
                            <span>${item.quantity} x Rs.${item.unit_price.toLocaleString()}</span>
                            <span>Rs.${item.total_price.toLocaleString()}</span>
                        </div>
                    </div>
                    `).join('')}
                    <div class="divider"></div>
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>Rs.${(sale.total_amount + sale.discount_applied).toLocaleString()}</span>
                        </div>
                        ${sale.discount_applied > 0 ? `
                        <div class="total-row">
                            <span>Discount:</span>
                            <span>-Rs.${sale.discount_applied.toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="double-divider"></div>
                    <div class="total-row grand-total">
                        <span>GRAND TOTAL:</span>
                        <span>Rs.${sale.total_amount.toLocaleString()}</span>
                    </div>
                    <div class="double-divider"></div>
                    <div class="footer">
                        <div class="barcode">*${String(sale.id).slice(0, 8).toUpperCase()}*</div>
                        <p>--------------------------------</p>
                        <p class="bold">Thank you for your purchase!</p>
                        <p>Please come again</p>
                        <p style="margin-top: 8px; font-size: 10px;">Goods once sold cannot be returned</p>
                        <p style="font-size: 10px;">Powered by StoreHub</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    };

    const handlePrintA4 = (e: React.MouseEvent) => {
        e.stopPropagation();
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt #${String(sale.id).slice(0, 8)}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        background: #f5f5f5;
                        padding: 40px;
                        color: #333;
                    }
                    .receipt-container {
                        max-width: 500px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .store-name {
                        font-size: 28px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin-bottom: 8px;
                    }
                    .store-info {
                        font-size: 13px;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 30px;
                    }
                    .receipt-meta {
                        display: flex;
                        justify-content: space-between;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e5e7eb;
                        margin-bottom: 20px;
                    }
                    .receipt-meta-item {
                        text-align: center;
                    }
                    .receipt-meta-label {
                        font-size: 11px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 4px;
                    }
                    .receipt-meta-value {
                        font-size: 14px;
                        font-weight: 600;
                        color: #111827;
                    }
                    .customer-info {
                        background: #f9fafb;
                        padding: 16px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .customer-label {
                        font-size: 11px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 4px;
                    }
                    .customer-name {
                        font-size: 16px;
                        font-weight: 600;
                    }
                    .customer-phone {
                        font-size: 14px;
                        color: #6b7280;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .items-table th {
                        background: #f9fafb;
                        padding: 12px;
                        text-align: left;
                        font-size: 12px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .items-table th:last-child {
                        text-align: right;
                    }
                    .items-table td {
                        padding: 14px 12px;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .items-table td:last-child {
                        text-align: right;
                        font-weight: 600;
                    }
                    .item-name {
                        font-weight: 500;
                    }
                    .item-qty {
                        color: #6b7280;
                        font-size: 13px;
                    }
                    .totals {
                        border-top: 2px solid #e5e7eb;
                        padding-top: 16px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 14px;
                    }
                    .total-row.discount {
                        color: #dc2626;
                    }
                    .total-row.grand-total {
                        font-size: 20px;
                        font-weight: bold;
                        padding: 16px 0;
                        border-top: 2px solid #e5e7eb;
                        margin-top: 8px;
                        color: #0d9488;
                    }
                    .footer {
                        text-align: center;
                        padding: 24px 30px;
                        background: #f9fafb;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer-thanks {
                        font-size: 16px;
                        font-weight: 600;
                        color: #111827;
                        margin-bottom: 4px;
                    }
                    .footer-message {
                        font-size: 13px;
                        color: #6b7280;
                    }
                    .footer-policy {
                        font-size: 11px;
                        color: #9ca3af;
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid #e5e7eb;
                    }
                    @media print {
                        body {
                            background: white;
                            padding: 0;
                        }
                        .receipt-container {
                            box-shadow: none;
                            max-width: 100%;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <div class="store-name">STOREHUB</div>
                        <div class="store-info">Kathmandu, Nepal • Tel: 01-1234567</div>
                        <div class="store-info">VAT/PAN: 123456789</div>
                    </div>
                    <div class="content">
                        <div class="receipt-meta">
                            <div class="receipt-meta-item">
                                <div class="receipt-meta-label">Receipt No.</div>
                                <div class="receipt-meta-value">#${String(sale.id).slice(0, 8).toUpperCase()}</div>
                            </div>
                            <div class="receipt-meta-item">
                                <div class="receipt-meta-label">Date</div>
                                <div class="receipt-meta-value">${safeDate(sale.sale_date).toLocaleDateString()}</div>
                            </div>
                            <div class="receipt-meta-item">
                                <div class="receipt-meta-label">Time</div>
                                <div class="receipt-meta-value">${safeDate(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div class="receipt-meta-item">
                                <div class="receipt-meta-label">Type</div>
                                <div class="receipt-meta-value">${sale.sales_type.toUpperCase()}</div>
                            </div>
                        </div>
                        ${(sale.customer_name || sale.customer_phone) ? `
                        <div class="customer-info">
                            <div class="customer-label">Bill To</div>
                            <div class="customer-name">${sale.customer_name || 'Walk-in Customer'}</div>
                            ${sale.customer_phone ? `<div class="customer-phone">${sale.customer_phone}</div>` : ''}
                        </div>
                        ` : ''}
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                <tr>
                                    <td>
                                        <div class="item-name">${item.product_name}</div>
                                        <div class="item-qty">${item.quantity} × Rs.${item.unit_price.toLocaleString()}</div>
                                    </td>
                                    <td>Rs.${item.total_price.toLocaleString()}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="totals">
                            <div class="total-row">
                                <span>Subtotal</span>
                                <span>Rs.${(sale.total_amount + sale.discount_applied).toLocaleString()}</span>
                            </div>
                            ${sale.discount_applied > 0 ? `
                            <div class="total-row discount">
                                <span>Discount</span>
                                <span>-Rs.${sale.discount_applied.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            <div class="total-row grand-total">
                                <span>Grand Total</span>
                                <span>Rs.${sale.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class="footer-thanks">Thank you for your purchase!</div>
                        <div class="footer-message">Please visit again</div>
                        <div class="footer-policy">Goods once sold cannot be returned or exchanged.<br>Powered by StoreHub</div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    };

    return (
        <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="group">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CollapsibleTrigger asChild>
                    <CardContent className="p-4 sm:p-6 cursor-pointer bg-white relative z-10">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${sale.sales_type === 'credit' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'
                                    }`}>
                                    {sale.sales_type === 'credit' ? <User className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 line-clamp-1">
                                            {sale.customer_name || "Walk-in Customer"}
                                        </span>
                                        <Badge variant="secondary" className="text-xs font-normal bg-gray-100">
                                            #{String(sale.id).slice(0, 8)}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {safeDate(sale.sale_date).toLocaleDateString()}
                                        </span>
                                        {sale.customer_phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {sale.customer_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                        रू {sale.total_amount?.toLocaleString() ?? 0}
                                    </p>
                                    <div className="flex items-center justify-end gap-2 mt-0.5">
                                        <Badge variant="outline" className="capitalize">
                                            {sale.sales_type}
                                        </Badge>
                                    </div>
                                </div>
                                {isOpen ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-gray-100 bg-gray-50/50">
                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto">
                                {/* Receipt Preview Card */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Receipt Preview - Styled like thermal receipt */}
                                    <div className="p-6 font-mono text-sm bg-gradient-to-b from-gray-50 to-white">
                                        {/* Store Header */}
                                        <div className="text-center mb-4">
                                            <h3 className="font-bold text-lg tracking-wide">STOREHUB</h3>
                                            <p className="text-xs text-gray-600">Kathmandu, Nepal</p>
                                            <p className="text-xs text-gray-600">VAT/PAN: 123456789</p>
                                        </div>

                                        <div className="border-t-2 border-dashed border-gray-300 my-3"></div>

                                        {/* Receipt Info */}
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Receipt #:</span>
                                                <span className="font-medium">{String(sale.id).slice(0, 8).toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Date:</span>
                                                <span>{safeDate(sale.sale_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Type:</span>
                                                <span className="uppercase">{sale.sales_type}</span>
                                            </div>
                                            {sale.customer_name && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Customer:</span>
                                                    <span>{sale.customer_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-dashed border-gray-300 my-3"></div>

                                        {/* Items */}
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <div key={item.product_id} className="text-xs">
                                                    <div className="font-medium truncate">{item.product_name}</div>
                                                    <div className="flex justify-between text-gray-600 pl-2">
                                                        <span>{item.quantity} x Rs.{item.unit_price.toLocaleString()}</span>
                                                        <span className="font-medium text-gray-900">Rs.{item.total_price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-dashed border-gray-300 my-3"></div>

                                        {/* Totals */}
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>Rs.{((sale.total_amount || 0) + (sale.discount_applied || 0)).toLocaleString()}</span>
                                            </div>
                                            {sale.discount_applied > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span>Discount:</span>
                                                    <span>-Rs.{(sale.discount_applied || 0).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t-2 border-dashed border-gray-300 my-3"></div>

                                        <div className="flex justify-between font-bold text-sm">
                                            <span>TOTAL:</span>
                                            <span>Rs.{(sale.total_amount || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="border-t-2 border-dashed border-gray-300 my-3"></div>

                                        {/* Footer */}
                                        <div className="text-center text-xs text-gray-500 mt-4">
                                            <p className="font-medium text-gray-700">Thank you for your purchase!</p>
                                            <p>Please come again</p>
                                        </div>
                                    </div>

                                    {/* Print Buttons */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                                        <div className="flex gap-2">
                                            <Button onClick={handlePrintThermal} variant="outline" className="flex-1">
                                                <Printer className="h-4 w-4 mr-2" />
                                                Thermal (80mm)
                                            </Button>
                                            <Button onClick={handlePrintA4} className="flex-1 bg-teal-600 hover:bg-teal-700">
                                                <FileText className="h-4 w-4 mr-2" />
                                                A4 / PDF
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">Choose thermal for POS printers, A4 for regular paper or PDF</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};

export default function SalesHistory() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter States
    const [filterType, setFilterType] = useState("all");
    const [filterTime, setFilterTime] = useState("all");

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        // ... (existing fetch logic)
        try {
            setLoading(true);
            const data = await salesService.getSales();
            setSales(data);
        } catch (error) {
            console.error("Failed to fetch sales:", error);
            toast.error("Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    const isWithinTimeRange = (dateString: string) => {
        if (!dateString) return true;
        const date = new Date(dateString);
        if (!isValid(date)) return true;
        const now = new Date();

        switch (filterTime) {
            case "today":
                return isAfter(date, startOfDay(now));
            case "yesterday": {
                const yesterday = subDays(now, 1);
                const startOfYesterday = startOfDay(yesterday);
                return isAfter(date, startOfYesterday) && date < startOfDay(now);
            }
            case "last7days":
                return isAfter(date, subDays(now, 7));
            case "thisMonth":
                return isAfter(date, startOfMonth(now));
            default:
                return true;
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch =
            (sale.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (sale.customer_phone || "").includes(searchTerm) ||
            String(sale.id).includes(searchTerm);

        const matchesType = filterType === "all" || sale.sales_type === filterType;
        const matchesTime = isWithinTimeRange(sale.sale_date);

        return matchesSearch && matchesType && matchesTime;
    });

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
                <p className="text-gray-500 mt-1">View and manage past transactions</p>
            </div>

            {/* Search and Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by customer name, phone or Receipt ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-xl border-gray-200"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[140px] h-11 rounded-xl border-gray-200">
                                    <SelectValue placeholder="Sales Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterTime} onValueChange={setFilterTime}>
                                <SelectTrigger className="w-[140px] h-11 rounded-xl border-gray-200">
                                    <SelectValue placeholder="Time Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales List */}
            <div className="space-y-4">
                {filteredSales.length === 0 && !loading ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-500">No sales found matching your filters</p>
                    </div>
                ) : (
                    filteredSales.map((sale) => (
                        <SaleHistoryItem key={String(sale.id)} sale={sale} />
                    ))
                )}
            </div>
        </div>
    );
}

