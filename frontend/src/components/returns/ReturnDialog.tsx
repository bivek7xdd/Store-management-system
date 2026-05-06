import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sale, SaleItem, PendingReturnItem } from '../../types';
import { ReturnReasonSelect } from './ReturnReasonSelect';
import { returnsService } from '../../services/returns';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnDialogProps {
  visible: boolean;
  onHide: () => void;
  sale: Sale | null;
  onSuccess: () => void;
  isOnline: boolean;
}

export const ReturnDialog: React.FC<ReturnDialogProps> = ({ visible, onHide, sale, onSuccess, isOnline }) => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: { quantity: number; reason: string; condition: string } }>({});
  const [refundMethod, setRefundMethod] = useState<string>('cash');
  const [loading, setLoading] = useState(false);

  if (!sale) return null;

  const handleItemToggle = (item: SaleItem, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => ({
        ...prev,
        [item.product_id]: { quantity: 1, reason: '', condition: 'resellable' }
      }));
    } else {
      const newItems = { ...selectedItems };
      delete newItems[item.product_id];
      setSelectedItems(newItems);
    }
  };

  const calculateTotalRefund = () => {
    let total = 0;
    if (!sale) return 0;
    Object.keys(selectedItems).forEach(productId => {
      const saleItem = sale.items.find(i => i.product_id === productId);
      if (saleItem) {
        total += saleItem.unit_price * selectedItems[productId].quantity;
      }
    });
    // Proportionally deduct discount if applicable
    if (sale.discount_applied > 0 && sale.total > 0) {
      const discountRatio = sale.discount_applied / (sale.total + sale.discount_applied);
      total = total - (total * discountRatio);
    }
    return total;
  };

  const handleProcessReturn = async () => {
    if (!sale) return;
    const itemsToReturn: PendingReturnItem[] = Object.keys(selectedItems).map(productId => {
      const saleItem = sale.items.find(i => i.product_id === productId);
      return {
        sale_item_id: saleItem?.id || productId,
        quantity: selectedItems[productId].quantity,
        reason: selectedItems[productId].reason,
        condition: selectedItems[productId].condition
      };
    });

    if (itemsToReturn.length === 0) return;
    if (itemsToReturn.some(i => !i.reason)) {
      alert("Please select a reason for all returned items.");
      return;
    }

    setLoading(true);
    try {
      await returnsService.processReturn(
        String(sale.id),
        calculateTotalRefund(),
        refundMethod,
        itemsToReturn,
        isOnline
      );
      onSuccess();
      onHide();
    } catch (error) {
      console.error(error);
      alert("Failed to process return.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-black text-black dark:text-white border border-[#DA291C] shadow-2xl shadow-red-500/10 rounded-[2px] p-0 overflow-hidden">
        <DialogHeader className="bg-white dark:bg-black text-black dark:text-white border-b border-black dark:border-white p-4">
          <DialogTitle className="text-xl font-bold">Process Return</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-4">Select Items to Return</h3>
              <div className="space-y-4">
                {sale?.items.map(item => {
                  const saleDate = parseISO(sale.sale_date);
                  const today = new Date();
                  const daysSinceSale = differenceInDays(today, saleDate);
                  const warrantyDays = item.warranty_days || 0;
                  const isExpired = daysSinceSale > warrantyDays;
                  const daysLeft = Math.max(0, warrantyDays - daysSinceSale);

                  return (
                    <div key={item.product_id} className={cn(
                      "flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border rounded-[2px] transition-colors",
                      isExpired ? "border-red-500/30 bg-red-500/5 opacity-80" : "border-black dark:border-white"
                    )}>
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-black dark:accent-white disabled:opacity-30"
                          checked={!!selectedItems[item.product_id]}
                          onChange={(e) => handleItemToggle(item, e.target.checked)}
                          disabled={isExpired}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{item.product_name}</p>
                            {warrantyDays > 0 && (
                              <div className={cn(
                                "flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold",
                                isExpired ? "bg-red-500 text-white" : "bg-green-500 text-white"
                              )}>
                                {isExpired ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                                {isExpired ? "Expired" : `${daysLeft}d left`}
                              </div>
                            )}
                          </div>
                          <p className="text-sm opacity-70">Sold: {item.quantity} @ Rs {item.unit_price}</p>
                        </div>
                      </div>

                      {selectedItems[item.product_id] && (
                        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full md:w-auto">
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={selectedItems[item.product_id].quantity}
                            onChange={(e) => setSelectedItems(prev => ({
                              ...prev,
                              [item.product_id]: { ...prev[item.product_id], quantity: parseInt(e.target.value) || 1 }
                            }))}
                            className="w-full sm:w-20 px-3 py-2 border border-black dark:border-white bg-transparent rounded-[2px] focus:outline-none"
                          />
                          <div className="flex-1">
                            <ReturnReasonSelect
                              value={selectedItems[item.product_id].reason}
                              onChange={(val) => setSelectedItems(prev => ({
                                ...prev,
                                [item.product_id]: { ...prev[item.product_id], reason: val, condition: val === 'damaged' ? 'defective' : 'resellable' }
                              }))}
                            />
                          </div>
                        </div>
                      )}

                      {isExpired && (
                        <div className="flex items-center gap-1 text-[11px] text-red-500 font-bold uppercase tracking-tight">
                          <AlertCircle size={14} />
                          Warranty Period Over
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-black dark:border-white gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label className="font-medium">Refund Method:</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="px-4 py-2 border border-black dark:border-white bg-transparent rounded-[2px] focus:outline-none text-black dark:text-white"
                >
                  <option value="cash" className="bg-white dark:bg-black">Cash</option>
                  <option value="credit" className="bg-white dark:bg-black">Store Credit</option>
                  <option value="online" className="bg-white dark:bg-black">Online Reversal</option>
                </select>
              </div>

              <div className="text-right w-full md:w-auto">
                <p className="text-sm opacity-70">Total Refund</p>
                <p className="text-2xl font-bold">Rs {calculateTotalRefund().toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={onHide}
                className="px-6 py-2 border border-black dark:border-white text-black dark:text-white rounded-[2px] hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={loading || Object.keys(selectedItems).length === 0}
                className="px-6 py-2 bg-[#DA291C] text-white rounded-[2px] hover:bg-opacity-90 disabled:opacity-50 transition-colors font-bold"
              >
                {loading ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
