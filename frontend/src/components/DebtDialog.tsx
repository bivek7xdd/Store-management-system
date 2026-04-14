import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { debtService, Debt } from "@/services/debts";
import { salesService } from "@/services/sales";
import {
    Plus, Pencil, User, Calendar, DollarSign, Notebook,
    CheckCircle2, UserPlus, ChevronDown,
} from "lucide-react";

interface DebtDialogProps {
    debt?: Debt;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

type CustomerMode = "existing" | "new";

function FieldLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <label className="flex items-center gap-1.5 text-[11px] font-normal text-[#888888] uppercase tracking-[1px] mb-2">
            <Icon className="h-3 w-3" />
            {label}
        </label>
    );
}

const inputCls = "w-full h-[38px] bg-transparent border border-[#303030] rounded-[2px] px-3 text-[13px] text-white placeholder:text-[#555555] focus:outline-none focus:border-[#1EAEDB] transition-colors";
const textareaCls = "w-full bg-transparent border border-[#303030] rounded-[2px] px-3 py-2.5 text-[13px] text-white placeholder:text-[#555555] focus:outline-none focus:border-[#1EAEDB] transition-colors resize-none min-h-[80px]";

export function DebtDialog({ debt, onSuccess, children }: DebtDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");
    const queryClient = useQueryClient();
    const isEdit = !!debt;

    useEffect(() => {
        if (open) loadCustomers();
    }, [open]);

    const loadCustomers = async () => {
        try {
            const data = await salesService.getCustomers();
            if (Array.isArray(data)) setCustomers(data);
            else if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) setCustomers(data.data);
            else setCustomers([]);
        } catch {
            toast.error("Failed to load customers list");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const amountOwed = parseFloat(formData.get("amount_owed") as string);
            const dueDate = formData.get("due_date") as string;
            const notes = formData.get("notes") as string;
            const status = formData.get("status") as string;

            if (isEdit && debt) {
                const updateData: any = {};
                if (amountOwed !== parseFloat(debt.amount_owed)) updateData.amount_owed = amountOwed;
                if (dueDate !== (debt.due_date ? new Date(debt.due_date).toISOString().split("T")[0] : "")) updateData.due_date = dueDate;
                if (notes !== debt.notes) updateData.notes = notes;
                if (status && status !== debt.status) updateData.status = status;
                await debtService.updateDebt(debt.id, updateData);
                toast.success("Debt record updated");
            } else {
                if (customerMode === "existing") {
                    const customerId = formData.get("customer_id") as string;
                    if (!customerId) { toast.error("Please select a customer"); return; }
                    await debtService.createDebt({ customer_id: customerId, amount_owed: amountOwed, due_date: dueDate, notes });
                } else {
                    // New customer — name + phone passed directly
                    const newName = (formData.get("new_customer_name") as string)?.trim();
                    const newPhone = (formData.get("new_customer_phone") as string)?.trim();
                    if (!newName) { toast.error("Please enter a customer name"); return; }
                    await debtService.createDebt({
                        customer_name: newName,
                        customer_phone: newPhone || undefined,
                        amount_owed: amountOwed,
                        due_date: dueDate,
                        notes,
                    } as any);
                }
                toast.success("New debt account created");
            }

            queryClient.invalidateQueries({ queryKey: ["debts"] });
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Update failed" : "Creation failed");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        try { return new Date(dateString).toISOString().split("T")[0]; } catch { return ""; }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <button className="h-[34px] px-4 rounded-[2px] bg-[#DA291C] text-white text-[12px] uppercase tracking-[1px] flex items-center gap-2 hover:bg-[#B01E0A] transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                        Create Debt
                    </button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-0 border border-[#1A1A1A] bg-[#0A0A0A] rounded-[2px] shadow-2xl shadow-black/60 overflow-hidden gap-0">
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-[#1A1A1A]">
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`h-8 w-8 rounded-[2px] flex items-center justify-center ${isEdit ? "bg-blue-900/30" : "bg-[#DA291C]/10"}`}>
                            {isEdit
                                ? <Pencil className="h-4 w-4 text-blue-400" />
                                : <Plus className="h-4 w-4 text-[#DA291C]" />
                            }
                        </div>
                        <div>
                            <DialogTitle className="text-[15px] font-medium text-white">
                                {isEdit ? "Edit Record" : "New Debt Entry"}
                            </DialogTitle>
                            <p className="text-[12px] text-[#555555]">
                                {isEdit ? "Modify credit terms for this account" : "Record a new credit transaction"}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                    {/* Customer Section */}
                    {!isEdit && (
                        <div>
                            {/* Mode Toggle */}
                            <div className="flex items-center gap-1 bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-0.5 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCustomerMode("existing")}
                                    className={`flex-1 flex items-center justify-center gap-2 h-7 rounded-[2px] text-[11px] uppercase tracking-[0.8px] transition-all ${
                                        customerMode === "existing"
                                            ? "bg-[#DA291C] text-white"
                                            : "text-[#888888] hover:text-white"
                                    }`}
                                >
                                    <User className="w-3 h-3" /> Existing Customer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomerMode("new")}
                                    className={`flex-1 flex items-center justify-center gap-2 h-7 rounded-[2px] text-[11px] uppercase tracking-[0.8px] transition-all ${
                                        customerMode === "new"
                                            ? "bg-[#DA291C] text-white"
                                            : "text-[#888888] hover:text-white"
                                    }`}
                                >
                                    <UserPlus className="w-3 h-3" /> New Customer
                                </button>
                            </div>

                            {customerMode === "existing" ? (
                                <div>
                                    <FieldLabel icon={User} label="Select Customer" />
                                    <Select name="customer_id">
                                        <SelectTrigger className="h-[38px] rounded-[2px] border border-[#303030] bg-transparent text-[13px] text-white focus:ring-0 focus:ring-offset-0 focus:border-[#1EAEDB] transition-colors">
                                            <SelectValue placeholder="Choose a customer..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111111] border-[#303030] rounded-[2px] text-white">
                                            {customers.length > 0 ? (
                                                customers.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                        className="text-[13px] text-[#AAAAAA] focus:bg-[#1A1A1A] focus:text-white"
                                                    >
                                                        {c.name}
                                                        {c.phone && <span className="text-[11px] text-[#555555] ml-2">({c.phone})</span>}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-[12px] text-[#555555]">No customers found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <FieldLabel icon={User} label="Customer Name" />
                                        <input
                                            name="new_customer_name"
                                            type="text"
                                            placeholder="Full name"
                                            required={customerMode === "new"}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel icon={User} label="Phone Number (optional)" />
                                        <input
                                            name="new_customer_phone"
                                            type="tel"
                                            placeholder="98XXXXXXXX"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Amount + Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={DollarSign} label="Amount Due" />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#555555]">रू</span>
                                <input
                                    name="amount_owed"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={isEdit ? debt?.amount_owed : ""}
                                    required
                                    placeholder="0.00"
                                    className={`${inputCls} pl-7`}
                                />
                            </div>
                        </div>
                        <div>
                            <FieldLabel icon={Calendar} label="Due Date" />
                            <input
                                name="due_date"
                                type="date"
                                defaultValue={isEdit ? formatDate(debt?.due_date) : ""}
                                className={`${inputCls} [color-scheme:dark]`}
                            />
                        </div>
                    </div>

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div>
                            <FieldLabel icon={CheckCircle2} label="Account Status" />
                            <Select name="status" defaultValue={debt?.status}>
                                <SelectTrigger className="h-[38px] rounded-[2px] border border-[#303030] bg-transparent text-[13px] text-white focus:ring-0 focus:ring-offset-0 focus:border-[#1EAEDB] transition-colors">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-[#303030] rounded-[2px] text-white">
                                    <SelectItem value="pending" className="text-[13px] text-[#AAAAAA] focus:bg-[#1A1A1A] focus:text-white">Pending Collection</SelectItem>
                                    <SelectItem value="paid" className="text-[13px] text-[#AAAAAA] focus:bg-[#1A1A1A] focus:text-white">Fully Settled</SelectItem>
                                    <SelectItem value="written-off" className="text-[13px] text-[#DA291C] focus:bg-[#DA291C]/10 focus:text-[#DA291C]">Written Off</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <FieldLabel icon={Notebook} label="Internal Notes" />
                        <textarea
                            name="notes"
                            defaultValue={isEdit ? debt?.notes : ""}
                            placeholder="Any additional context for this debt..."
                            className={textareaCls}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-[#1A1A1A]">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-[38px] rounded-[2px] border border-[#303030] text-[12px] text-[#888888] hover:text-white uppercase tracking-[1px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-[38px] rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[12px] uppercase tracking-[1px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : isEdit ? "Update Record" : "Save Debt"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
