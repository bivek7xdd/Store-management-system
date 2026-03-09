import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { debtService, Debt } from "@/services/debts";
import { salesService } from "@/services/sales";
import { Plus, Pencil, User, Calendar, DollarSign, Notebook, CheckCircle2, ChevronRight } from "lucide-react";

interface DebtDialogProps {
    debt?: Debt;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function DebtDialog({ debt, onSuccess, children }: DebtDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const queryClient = useQueryClient();
    const isEdit = !!debt;

    useEffect(() => {
        if (open) {
            loadCustomers();
        }
    }, [open]);

    const loadCustomers = async () => {
        try {
            const data = await salesService.getCustomers();
            if (Array.isArray(data)) {
                setCustomers(data);
            } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                setCustomers(data.data);
            } else {
                setCustomers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to load customers", error);
            toast.error("Failed to load customers list");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const customerId = formData.get("customer_id") as string;
            const amountOwed = parseFloat(formData.get("amount_owed") as string);
            const dueDate = formData.get("due_date") as string;
            const notes = formData.get("notes") as string;
            const status = formData.get("status") as string;

            if (isEdit && debt) {
                const updateData: any = {};
                if (amountOwed !== parseFloat(debt.amount_owed)) updateData.amount_owed = amountOwed;
                if (dueDate !== (debt.due_date ? new Date(debt.due_date).toISOString().split('T')[0] : '')) updateData.due_date = dueDate;
                if (notes !== debt.notes) updateData.notes = notes;
                if (status && status !== debt.status) updateData.status = status;

                await debtService.updateDebt(debt.id, updateData);
                toast.success("Debt record updated");
            } else {
                await debtService.createDebt({
                    customer_id: customerId,
                    amount_owed: amountOwed,
                    due_date: dueDate,
                    notes: notes,
                });
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
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-6 h-11 font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.03] active:scale-[0.97]">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Debt
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 border-0 shadow-2xl overflow-hidden rounded-[32px]">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
                    <div className="h-14 w-14 bg-teal-500/20 rounded-2xl flex items-center justify-center mb-6 border border-teal-500/30 backdrop-blur-sm">
                        {isEdit ? <Pencil className="h-7 w-7 text-teal-400" /> : <Plus className="h-7 w-7 text-teal-400" />}
                    </div>
                    <DialogTitle className="text-3xl font-black tracking-tight">{isEdit ? "Edit Record" : "New Debt Entry"}</DialogTitle>
                    <DialogDescription className="text-gray-400 mt-2 text-base">
                        {isEdit ? "Modify the existing credit terms for this account." : "Record a new credit transaction for one of your customers."}
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!isEdit && (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="customer_id" className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Select Customer
                                </Label>
                                <Select name="customer_id" required>
                                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:ring-teal-500/10 transition-all">
                                        <SelectValue placeholder="Which customer?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        {customers.length > 0 ? (
                                            customers.map((c) => (
                                                <SelectItem key={c.id} value={c.id} className="rounded-lg">
                                                    {c.name} <span className="text-[10px] text-gray-400 ml-1">({c.phone})</span>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-gray-400 italic">No customers found</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="amount_owed" className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <DollarSign className="h-3 w-3" /> Amount Due
                            </Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">रू</span>
                                <Input
                                    id="amount_owed"
                                    name="amount_owed"
                                    type="number"
                                    step="0.01"
                                    defaultValue={isEdit ? debt?.amount_owed : ""}
                                    required
                                    className="h-12 pl-10 rounded-xl border-gray-100 bg-gray-50 font-bold focus:ring-teal-500/10"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date" className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Expected Date
                            </Label>
                            <Input
                                id="due_date"
                                name="due_date"
                                type="date"
                                defaultValue={isEdit ? formatDate(debt?.due_date) : ""}
                                className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:ring-teal-500/10"
                            />
                        </div>

                        {isEdit && (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="status" className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3" /> Account Status
                                </Label>
                                <Select name="status" defaultValue={debt?.status}>
                                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:ring-teal-500/10">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        <SelectItem value="pending" className="rounded-lg">Pending Collection</SelectItem>
                                        <SelectItem value="paid" className="rounded-lg">Fully Settled</SelectItem>
                                        <SelectItem value="written-off" className="rounded-lg text-red-500">Written Off</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes" className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <Notebook className="h-3 w-3" /> Internal Notes
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={isEdit ? debt?.notes : ""}
                                placeholder="Any additional context for this debt..."
                                className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50 focus:ring-teal-500/10 resize-none p-4"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-gray-500">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-[2] h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]" disabled={loading}>
                            {loading ? "Processing..." : (isEdit ? "Update Account" : "Save Record")}
                            {!loading && <ChevronRight className="h-5 w-5 ml-2" />}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
