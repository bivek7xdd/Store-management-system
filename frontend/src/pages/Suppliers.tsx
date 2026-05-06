import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { syncService } from "@/services/syncService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, Truck, ChevronRight, Phone, Mail, MoreHorizontal, Pencil, Trash2, WifiOff, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "@/components/CreateInventoryDialogs";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OfflineStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

export default function Suppliers() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
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
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Supply Chain</p>
                        <h1 className="text-[22px] font-medium text-white tracking-tight">Vendor Directory</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-[2px] bg-[#1A1A1A]" />
                                <Skeleton className="h-4 w-32 bg-[#1A1A1A]" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full bg-[#1A1A1A]" />
                                <Skeleton className="h-3 w-24 bg-[#1A1A1A]" />
                                <Skeleton className="h-3 w-36 bg-[#1A1A1A]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Truck className="h-10 w-10 text-[#DA291C] mx-auto" />
                    <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Failed to load suppliers</p>
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
                    <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Supply Chain</p>
                    <h1 className="text-[22px] font-medium text-white tracking-tight">Vendor Directory</h1>
                </div>
                <div className="flex items-center gap-3">
                    <OfflineIndicator
                        isOnline={offlineStatus.isOnline}
                        pendingSales={offlineStatus.pendingSales}
                        pendingCategories={offlineStatus.pendingCategories}
                        pendingSuppliers={offlineStatus.pendingSuppliers}
                        isSyncing={offlineStatus.isSyncing}
                        syncError={offlineStatus.syncError}
                        lastSyncTime={offlineStatus.lastSyncTime}
                    />
                    <SupplierDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                        <Button className="h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE] transition-colors">
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add Vendor
                        </Button>
                    </SupplierDialog>
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Vendors</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">{suppliers?.length || 0}</h2>
                        <Truck className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Products</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">
                            {suppliers?.reduce((sum, s) => sum + (s.product_count || 0), 0) || 0}
                        </h2>
                        <Package className="h-5 w-5 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Low Stock Alerts</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">
                            {suppliers?.reduce((sum, s) => sum + (s.low_stock_count ?? 0), 0) || 0}
                        </h2>
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Suppliers Grid */}
            {suppliers && suppliers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
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
                                        <SupplierDialog supplier={supplier} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#CCCCCC] hover:text-white focus:text-white focus:bg-[#1A1A1A] rounded-[1px] cursor-pointer">
                                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                                Edit
                                            </DropdownMenuItem>
                                        </SupplierDialog>
                                        <DropdownMenuItem
                                            className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#DA291C] hover:text-[#DA291C] focus:text-[#DA291C] focus:bg-[#DA291C]/10 rounded-[1px] cursor-pointer"
                                            onClick={() => {
                                                setSupplierToDelete(supplier.id);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Link to={`/inventory/supplier/${supplier.id}`} className="block p-6">
                                <div className="flex items-center gap-3 mb-5 pr-8">
                                    <div className="h-10 w-10 rounded-[2px] bg-[#0A0A0A] border border-[#303030] flex items-center justify-center shrink-0">
                                        <Truck className="h-4 w-4 text-[#DA291C]" />
                                    </div>
                                    <h3 className="font-bold text-[14px] text-white uppercase tracking-tight group-hover:text-[#DA291C] transition-colors truncate">
                                        {supplier.name}
                                    </h3>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px]">
                                        <span className="text-[12px] font-bold text-white">{supplier.product_count || 0}</span>
                                        <span className="text-[9px] uppercase tracking-[1px] text-[#555555] font-black">Products</span>
                                    </div>
                                    {(supplier.low_stock_count ?? 0) > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#DA291C]/10 border border-[#DA291C]/20 rounded-[2px]">
                                            <span className="text-[12px] font-bold text-[#DA291C]">{supplier.low_stock_count}</span>
                                            <span className="text-[9px] uppercase tracking-[1px] text-[#DA291C]/70 font-black">Low Stock</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 border-t border-[#1A1A1A] pt-4">
                                    {supplier.address && (
                                        <p className="text-[11px] text-[#888888] line-clamp-1 flex items-center gap-2">
                                            <span className="h-1 w-1 rounded-full bg-[#555555] shrink-0" />
                                            {supplier.address}
                                        </p>
                                    )}
                                    {supplier.phone_number && (
                                        <div className="flex items-center gap-2 text-[#888888]">
                                            <Phone className="h-3 w-3 text-[#555555] shrink-0" />
                                            <span className="text-[11px]">{supplier.phone_number}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-[#888888]">
                                            <Mail className="h-3 w-3 text-[#555555] shrink-0" />
                                            <span className="text-[11px] truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#111111] rounded-[2px] border border-[#1A1A1A] p-16 text-center">
                    <div className="h-14 w-14 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center mx-auto mb-5">
                        <Truck className="h-7 w-7 text-[#1A1A1A]" />
                    </div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-2">No Vendors Registered</h3>
                    <p className="text-[11px] text-[#555555] uppercase tracking-[0.5px] mb-8">Add your first vendor to track supply chain sources</p>
                    <SupplierDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["suppliers"] })}>
                        <Button className="h-10 px-6 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE] transition-colors">
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add First Vendor
                        </Button>
                    </SupplierDialog>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
                            This action is irreversible. The vendor record and all associated metadata will be permanently removed from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            onClick={handleDelete}
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-6"
                        >
                            Delete Vendor
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
