import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCategoryDialog } from "@/components/CreateInventoryDialogs";
import { CategorySkeleton } from "@/components/CategorySkeleton";

export default function Categories() {
    const { isAuthenticated, loading: authLoading } = useAuth();

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ["categories"],
        queryFn: inventoryService.getCategories,
        enabled: isAuthenticated && !authLoading,
    });

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage your product categories</p>
                </div>
                <CreateCategoryDialog>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                    </Button>
                </CreateCategoryDialog>
            </div>

            {/* Categories Grid */}
            {categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/inventory/category/${category.id}`}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
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
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-6">Create your first category to organize your products</p>
                    <CreateCategoryDialog>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Category
                        </Button>
                    </CreateCategoryDialog>
                </div>
            )}
        </div>
    );
}
