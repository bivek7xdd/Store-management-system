import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, ChevronRight, Loader2, Sparkles, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCategoryDialog } from "@/components/CreateInventoryDialogs";
import { CategorySkeleton } from "@/components/CategorySkeleton";
import { BUSINESS_CATEGORIES } from "@/data/businessCategories";
import categoryPreferencesService from "@/services/categoryPreferences";
import { toast } from "@/components/ui/use-toast";

export default function Categories() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [suggestedCategories, setSuggestedCategories] = useState<{ name: string, description: string }[]>([]);
    const [addingCategory, setAddingCategory] = useState<string | null>(null);

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ["categories"],
        queryFn: inventoryService.getCategories,
        enabled: isAuthenticated && !authLoading,
    });

    useEffect(() => {
        const prefs = categoryPreferencesService.retrieve();
        if (prefs && prefs.product_subcategories && prefs.product_subcategories.length > 0) {
            // Flatten all subcategories from all BUSINESS_CATEGORIES
            const allSubs = BUSINESS_CATEGORIES.flatMap(cat =>
                cat.subcategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    parentName: cat.name
                }))
            );

            // Filter for selected ones
            const selectedIDs = prefs.product_subcategories;
            const selected = allSubs.filter(sub => selectedIDs.includes(sub.id));

            // Map to category shape
            const suggestions = selected.map(sub => ({
                name: sub.name,
                description: `${sub.parentName} Category`
            }));

            setSuggestedCategories(suggestions);
        }
    }, []);

    const handleAddSuggested = async (category: { name: string, description: string }) => {
        setAddingCategory(category.name);
        try {
            await inventoryService.createCategory(category);
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast({
                title: "Category Added",
                description: `${category.name} has been added to your categories.`,
            });
        } catch (err) {
            console.error("Failed to add category", err);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to add category. Please try again.",
            });
        } finally {
            setAddingCategory(null);
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

    // Filter out suggestions that already exist in the user's categories
    const visibleSuggestions = suggestedCategories.filter(s =>
        !categories?.some(c => c.name.toLowerCase() === s.name.toLowerCase())
    );

    return (
        <div className="space-y-8">
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

            {/* Recommended Categories Section */}
            {visibleSuggestions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-teal-700">
                        <Sparkles className="h-4 w-4" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider">Recommended For You</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleSuggestions.map((category) => (
                            <div
                                key={category.name}
                                className="group relative bg-teal-50/40 rounded-xl border border-dashed border-teal-200 p-5 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-teal-100/50 flex items-center justify-center text-teal-600">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {category.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleAddSuggested(category)}
                                    disabled={addingCategory === category.name}
                                    className="w-full bg-white text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white hover:border-transparent transition-all duration-200"
                                    size="sm"
                                >
                                    {addingCategory === category.name ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Add Category
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing Categories Grid */}
            <div className="space-y-4">
                {visibleSuggestions.length > 0 && (
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Categories</h2>
                )}

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
                    visibleSuggestions.length === 0 && (
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
                    )
                )}
            </div>
        </div>
    );
}
