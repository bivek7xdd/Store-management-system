import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, Truck, ChevronRight, Loader2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSupplierDialog } from "@/components/CreateInventoryDialogs";

export default function Suppliers() {
    const { isAuthenticated, loading: authLoading } = useAuth();

    const { data: suppliers, isLoading, error } = useQuery({
        queryKey: ["suppliers"],
        queryFn: inventoryService.getSuppliers,
        enabled: isAuthenticated && !authLoading,
    });

    if (isLoading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
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
                <CreateSupplierDialog>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </Button>
                </CreateSupplierDialog>
            </div>

            {/* Suppliers Grid */}
            {suppliers && suppliers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => (
                        <Link
                            key={supplier.id}
                            to={`/inventory/supplier/${supplier.id}`}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Truck className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                        {supplier.name}
                                    </h3>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                            <div className="space-y-2 text-sm">
                                {supplier.address && (
                                    <p className="text-gray-600">{supplier.address}</p>
                                )}
                                {supplier.phone_number && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{supplier.phone_number}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Truck className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers yet</h3>
                    <p className="text-gray-500 mb-6">Add your first supplier to track your product sources</p>
                    <CreateSupplierDialog>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Supplier
                        </Button>
                    </CreateSupplierDialog>
                </div>
            )}
        </div>
    );
}
