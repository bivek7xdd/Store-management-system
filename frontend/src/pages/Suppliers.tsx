import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, Truck, ChevronRight, Phone, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "@/components/CreateInventoryDialogs";
import { SupplierSkeleton } from "@/components/SupplierSkeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // Assuming sonner is used as in other files
// If use-toast is used, import that instead. The refactored SupplierDialog uses sonner.
// Checking CategoryDetails.tsx, it uses use-toast. But CreateInventoryDialogs uses sonner.
// Ideally consistent. I'll stick to sonner for now as per SupplierDialog.

export default function Suppliers() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

    const { data: suppliers, isLoading, error } = useQuery({
        queryKey: ["suppliers"],
        queryFn: inventoryService.getSuppliers,
        enabled: isAuthenticated && !authLoading,
    });

    const handleDelete = async () => {
        if (!supplierToDelete) return;

        try {
            await inventoryService.deleteSupplier(supplierToDelete);
            toast.success("Supplier deleted successfully");
            setSupplierToDelete(null);
            setDeleteDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete supplier");
        }
    };

    if (isLoading || authLoading) {
        return (
            <div className="space-y-6">
                {/* Header Mockup */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                        <p className="text-gray-500 mt-1">Manage your product suppliers</p>
                    </div>
                </div>

                {/* Suppliers Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <SupplierSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load suppliers</p>
                    <p className="text-gray-500 text-sm">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Manage your product suppliers</p>
                </div>
                <SupplierDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </Button>
                </SupplierDialog>
            </div>

            {/* Suppliers Grid */}
            {suppliers && suppliers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200 relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <SupplierDialog supplier={supplier} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        </SupplierDialog>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                                setSupplierToDelete(supplier.id);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Link to={`/inventory/supplier/${supplier.id}`} className="block">
                                <div className="flex items-start justify-between mb-3 pr-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                            <Truck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                            {supplier.name}
                                        </h3>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-colors opacity-100 group-hover:opacity-0" />
                                </div>
                                <div className="space-y-4 text-sm mt-4">
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-100">
                                            <span className="text-teal-600 font-bold">{supplier.product_count || 0}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Products</span>
                                        </div>
                                        {(supplier.low_stock_count ?? 0) > 0 && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg font-medium border border-red-100 animate-pulse">
                                                <span className="font-bold">{supplier.low_stock_count}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">Low Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 border-t border-gray-50 pt-3">
                                        {supplier.address && (
                                            <p className="text-gray-500 line-clamp-1 flex items-center gap-2">
                                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                                {supplier.address}
                                            </p>
                                        )}
                                        {supplier.phone_number && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{supplier.phone_number}</span>
                                            </div>
                                        )}
                                        {supplier.email && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="truncate">{supplier.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Truck className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers yet</h3>
                    <p className="text-gray-500 mb-6">Add your first supplier to track your product sources</p>
                    <SupplierDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Supplier
                        </Button>
                    </SupplierDialog>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the supplier
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
