import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or use Input
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventory";
import { useQueryClient } from "@tanstack/react-query";

interface CreateCategoryDialogProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function CreateCategoryDialog({ onSuccess, children }: CreateCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await inventoryService.createCategory({
                name: formData.get("name") as string,
                description: formData.get("description") as string,
            });
            toast.success("Category created successfully");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to create category");
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
                    <DialogTitle>Add Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" required placeholder="e.g. Electronics" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" required placeholder="Category description" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Category"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface CreateSupplierDialogProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function CreateSupplierDialog({ onSuccess, children }: CreateSupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await inventoryService.createSupplier({
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                phone_number: formData.get("phone_number") as string,
                email: formData.get("email") as string,
            });
            toast.success("Supplier created successfully");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to create supplier");
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
                    <DialogTitle>Add Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" required placeholder="Supplier Name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" required placeholder="Address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone</Label>
                        <Input id="phone_number" name="phone_number" required placeholder="Phone Number" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="Email" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Supplier"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
