import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or use Input
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventory";
import { useQueryClient } from "@tanstack/react-query";

interface CategoryDialogProps {
    category?: { id: string, name: string, description: string };
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function CategoryDialog({ category, onSuccess, children }: CategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const isEdit = !!category;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
            };

            if (isEdit && category) {
                await inventoryService.updateCategory(category.id, data);
                toast.success("Category updated successfully");
            } else {
                await inventoryService.createCategory(data);
                toast.success("Category created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["categories"] });
            if (isEdit && category) {
                queryClient.invalidateQueries({ queryKey: ["category", category.id] });
            }

            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Failed to update category" : "Failed to create category");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-gray-100">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update category details." : "Create a new category for your products."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={category?.name} required placeholder="e.g. Electronics" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" defaultValue={category?.description} required placeholder="Category description" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Category" : "Create Category")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface SupplierDialogProps {
    supplier?: { id: string, name: string, address: string, phone_number: string, email: string };
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function SupplierDialog({ supplier, onSuccess, children }: SupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const isEdit = !!supplier;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                phone_number: formData.get("phone_number") as string,
                email: formData.get("email") as string,
            };

            if (isEdit && supplier) {
                await inventoryService.updateSupplier(supplier.id, data);
                toast.success("Supplier updated successfully");
            } else {
                await inventoryService.createSupplier(data);
                toast.success("Supplier created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            if (isEdit && supplier) {
                queryClient.invalidateQueries({ queryKey: ["supplier", supplier.id] });
            }

            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Failed to update supplier" : "Failed to create supplier");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-gray-100">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update supplier details." : "Add a new supplier to your list."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={supplier?.name} required placeholder="Supplier Name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" defaultValue={supplier?.address} required placeholder="Address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone</Label>
                        <Input id="phone_number" name="phone_number" defaultValue={supplier?.phone_number} required placeholder="Phone Number" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={supplier?.email} required placeholder="Email" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Supplier" : "Create Supplier")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
