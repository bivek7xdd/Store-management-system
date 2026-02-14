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
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists, if not use Input
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { debtService, Debt } from "@/services/debts";
import { salesService } from "@/services/sales"; // For getting customers
import { Plus, Pencil } from "lucide-react";

interface DebtDialogProps {
    debt?: Debt;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function DebtDialog({ debt, onSuccess, children }: DebtDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]); // Using any for simplicity as Customer type isn't exported from sales.ts clearly
    const queryClient = useQueryClient();
    const isEdit = !!debt;

    useEffect(() => {
        if (open) {
            loadCustomers();
        }
    }, [open]);

    const loadCustomers = async () => {
        try {
            // Check if salesService.getCustomers returns what we expect
            // sales.ts: getCustomers returns Promise<any[]> (implicitly)
            // It calls api.get('customers')
            const data = await salesService.getCustomers();
            if (Array.isArray(data)) {
                setCustomers(data);
            } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                setCustomers(data.data);
            } else {
                // Fallback or assuming array
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
            const status = formData.get("status") as string; // For edit

            if (isEdit && debt) {
                // Update
                const updateData: any = {};
                if (amountOwed !== parseFloat(debt.amount_owed)) updateData.amount_owed = amountOwed;
                if (dueDate !== (debt.due_date ? new Date(debt.due_date).toISOString().split('T')[0] : '')) updateData.due_date = dueDate;
                if (notes !== debt.notes) updateData.notes = notes;
                if (status && status !== debt.status) updateData.status = status;

                // Also allow updating amount_paid? Maybe strictly for now just these fields.
                // If user wants to pay, use the specific pay action or add a specific field here?
                // Let's keep it simple: manual edit of owed, due date, status, notes.

                await debtService.updateDebt(debt.id, updateData);
                toast.success("Debt updated successfully");
            } else {
                // Create
                await debtService.createDebt({
                    customer_id: customerId,
                    amount_owed: amountOwed,
                    due_date: dueDate,
                    notes: notes,
                });
                toast.success("Debt created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["debts"] });
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Failed to update debt" : "Failed to create debt");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date for input type="date"
    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Debt
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Debt" : "Add New Debt"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update debt details." : "Manually record a new debt for a customer."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer</Label>
                            <Select name="customer_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.phone})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="amount_owed">Amount Owed</Label>
                        <Input
                            id="amount_owed"
                            name="amount_owed"
                            type="number"
                            step="0.01"
                            defaultValue={isEdit ? debt?.amount_owed : ""}
                            required
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                            id="due_date"
                            name="due_date"
                            type="date"
                            defaultValue={isEdit ? formatDate(debt?.due_date) : ""}
                        />
                    </div>

                    {isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={debt?.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="written-off">Written Off</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                            id="notes"
                            name="notes"
                            defaultValue={isEdit ? debt?.notes : ""}
                            placeholder="Optional notes"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Debt" : "Create Debt")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
