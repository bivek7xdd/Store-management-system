import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, MoreHorizontal, Pencil, Trash2, WifiOff } from "lucide-react";
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
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Warehouse</p>
                        <h1 className="text-[22px] font-medium text-white tracking-tight">Categories</h1>
                    </div>
                </div>

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
                <div className="text-center space-y-3">
                    <FolderOpen className="h-10 w-10 text-[#DA291C] mx-auto" />
                    <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Failed to load categories</p>
                    <p className="text-[10px] text-[#555555] uppercase tracking-[1px]">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Warehouse</p>
                    <h1 className="text-[22px] font-medium text-white tracking-tight">Categories</h1>
                </div>
                <div className="flex items-center gap-3">
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
                        <Button className="h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE] transition-colors">
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add Category
                        </Button>
                    </CategoryDialog>
                </div>
            </div>

            {/* Offline Mode Banner */}
            {!offlineStatus.isOnline && (
                <div className="border border-[#DA291C]/30 bg-[#DA291C]/5 rounded-[2px] p-4 flex items-center gap-4">
                    <WifiOff className="h-5 w-5 text-[#DA291C]" />
                    <div className="flex-1">
                        <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Offline Mode Active</p>
                        <p className="text-[11px] text-[#DA291C] uppercase tracking-[0.5px] mt-0.5 opacity-80">
                            Changes will sync on reconnection.
                        </p>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            {categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group bg-[#111111] rounded-[2px] border border-[#1A1A1A] hover:border-[#303030] transition-all duration-200 relative overflow-hidden"
                        >
                            {/* Action Menu */}
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-7 w-7 rounded-[2px] border border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-center text-[#888888] hover:text-white hover:border-[#303030] transition-colors">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] min-w-[140px]">
                                        <CategoryDialog category={category}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#CCCCCC] hover:text-white focus:text-white focus:bg-[#1A1A1A] rounded-[1px] cursor-pointer">
                                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                                Edit
                                            </DropdownMenuItem>
                                        </CategoryDialog>
                                        <DropdownMenuItem
                                            className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#DA291C] hover:text-[#DA291C] focus:text-[#DA291C] focus:bg-[#DA291C]/10 rounded-[1px] cursor-pointer"
                                            onClick={() => setCategoryToDelete(category.id)}
                                        >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Link to={`/inventory/category/${category.id}`} className="block p-6">
                                <div className="flex items-center gap-3 mb-4 pr-8">
                                    <div className="h-10 w-10 rounded-[2px] bg-[#0A0A0A] border border-[#303030] flex items-center justify-center shrink-0">
                                        <FolderOpen className="h-4 w-4 text-[#DA291C]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[14px] text-white uppercase tracking-tight group-hover:text-[#DA291C] transition-colors truncate">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-[11px] text-[#888888] line-clamp-1 mt-0.5">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#111111] rounded-[2px] border border-[#1A1A1A] p-16 text-center">
                    <div className="h-14 w-14 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mx-auto mb-5">
                        <FolderOpen className="h-7 w-7 text-[#1A1A1A]" />
                    </div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-2">No Categories Created</h3>
                    <p className="text-[11px] text-[#555555] uppercase tracking-[0.5px] mb-8">Create your first category to organize your products</p>
                    <CategoryDialog>
                        <Button className="h-10 px-6 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE] transition-colors">
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Create Category
                        </Button>
                    </CategoryDialog>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
                            This action is irreversible. The category and all associated metadata will be permanently removed from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-6"
                            onClick={handleDeleteCategory}
                        >
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
