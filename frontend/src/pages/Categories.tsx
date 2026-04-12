import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, MoreVertical, Pencil, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/CreateInventoryDialogs";
import { CategorySkeleton } from "@/components/CategorySkeleton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OfflineStatus } from "@/types";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Categories() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(syncService.getStatus());

    // Initialize sync service and listen for status changes
    useEffect(() => {
        const cleanup = syncService.init();
        const unsubscribe = syncService.onStatusChange((status) => {
            setOfflineStatus(status);
        });

        return () => {
            cleanup();
            unsubscribe();
        };
    }, []);

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ["categories"],
        queryFn: inventoryService.getCategories,
        enabled: isAuthenticated && !authLoading,
    });

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            await inventoryService.deleteCategory(categoryToDelete);
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Category deleted successfully");
        } catch (error: any) {
            console.error("Failed to delete category", error);
            const message = error?.response?.data?.message || "Failed to delete category.";
            toast.error(message);
        } finally {
            setCategoryToDelete(null);
        }
    };

    if (isLoading || authLoading) {
        return (
            <div className="space-y-6">
                {/* Header Mockup */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-500 mt-1">Manage your product categories</p>
                    </div>
                </div>

                {/* Categories Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <CategorySkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load categories</p>
                    <p className="text-gray-500 text-sm">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage your product categories</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Offline Status Indicator */}
                    <OfflineIndicator
                        isOnline={offlineStatus.isOnline}
                        pendingSales={offlineStatus.pendingSales}
                        pendingCategories={offlineStatus.pendingCategories}
                        pendingSuppliers={offlineStatus.pendingSuppliers}
                        isSyncing={offlineStatus.isSyncing}
                        syncError={offlineStatus.syncError}
                        lastSyncTime={offlineStatus.lastSyncTime}
                    />
                    <CategoryDialog>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </CategoryDialog>
                </div>
            </div>

            {/* Offline Mode Banner */}
            {!offlineStatus.isOnline && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                    <WifiOff className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800">
                            Working offline
                        </p>
                        <p className="text-xs text-orange-600">
                            Changes will be saved locally and synced when connection is restored.
                        </p>
                    </div>
                </div>
            )}

            {/* Existing Categories Grid */}
            <div className="space-y-4">

                {categories && categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <Link to={`/inventory/category/${category.id}`} className="flex items-center gap-3 flex-1">
                                        <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                            <FolderOpen className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                                {category.name}
                                            </h3>
                                            {category.description && (
                                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <CategoryDialog category={category}>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                            </CategoryDialog>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => setCategoryToDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <FolderOpen className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-500 mb-6">Create your first category to organize your products</p>
                        <CategoryDialog>
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Category
                            </Button>
                        </CategoryDialog>
                    </div>
                )}
            </div>

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteCategory}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
