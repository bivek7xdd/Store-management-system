import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil, Trash2, TrendingUp, Archive, DollarSign, Calendar } from "lucide-react";
import { CategoryDialog } from "@/components/CreateInventoryDialogs";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: category, isLoading: categoryLoading } = useQuery({
        queryKey: ["category", id],
        queryFn: () => inventoryService.getCategory(id!),
        enabled: !!id,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["category-stats", id],
        queryFn: () => inventoryService.getCategoryStats(id!),
        enabled: !!id,
    });

    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ["category-products", id],
        queryFn: () => inventoryService.getCategoryProducts(id!),
        enabled: !!id,
    });

    const isLoading = categoryLoading || statsLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-[2px] bg-[#1A1A1A]" />
                    <div>
                        <Skeleton className="h-6 w-48 bg-[#1A1A1A]" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6 space-y-3">
                            <Skeleton className="h-4 w-32 bg-[#1A1A1A]" />
                            <Skeleton className="h-8 w-20 bg-[#1A1A1A]" />
                        </div>
                    ))}
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6 space-y-4">
                    <Skeleton className="h-5 w-40 bg-[#1A1A1A]" />
                    <Skeleton className="h-4 w-full bg-[#1A1A1A]" />
                    <Skeleton className="h-4 w-3/4 bg-[#1A1A1A]" />
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Package className="h-10 w-10 text-[#DA291C] mx-auto" />
                    <p className="text-[12px] font-bold text-white uppercase tracking-[1px]">Category not found</p>
                    <Button
                        onClick={() => navigate("/inventory/categories")}
                        className="h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE]"
                    >
                        Back to Categories
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-[2px] border border-[#1A1A1A] bg-[#111111] flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Warehouse</p>
                        <h1 className="text-[22px] font-medium text-white tracking-tight">{category.name}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <CategoryDialog category={category}>
                        <Button className="h-9 px-4 rounded-[2px] border border-[#1A1A1A] bg-[#111111] text-[#CCCCCC] text-[11px] font-bold uppercase tracking-[1px] hover:text-white hover:bg-[#1A1A1A] transition-colors">
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                        </Button>
                    </CategoryDialog>
                    <Button
                        className="h-9 px-4 rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[11px] font-bold uppercase tracking-[1px] transition-colors"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Products</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">{stats?.product_count || 0}</h2>
                        <Archive className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Stock</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">{stats?.total_stock || 0}</h2>
                        <Package className="h-5 w-5 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Total Value</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-white">
                            रू{Number(stats?.total_value || 0).toLocaleString()}
                        </h2>
                        <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Category Information */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px] p-6">
                <h2 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-4">Category Information</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[2px] bg-[#0A0A0A] border border-[#303030] flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-[#DA291C]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black">Name</p>
                            <p className="text-[14px] font-bold text-white uppercase tracking-tight">{category.name}</p>
                        </div>
                    </div>
                    {category.description && (
                        <div className="border-t border-[#1A1A1A] pt-4">
                            <p className="text-[10px] text-[#555555] uppercase tracking-widest font-black mb-2">Description</p>
                            <p className="text-[12px] text-[#888888] leading-relaxed">{category.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="space-y-4">
                <h2 className="text-[13px] font-bold text-white uppercase tracking-[1px]">Products in {category.name}</h2>
                <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] overflow-hidden">
                    <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
                        {["Product", "Price", "Stock", "Status", ""].map(h => (
                            <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#555555]">{h}</span>
                        ))}
                    </div>

                    <div className="divide-y divide-[#1A1A1A]">
                        {products && products.length > 0 ? (
                            products.map((product) => (
                                <div key={product.id} className="group p-6 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center hover:bg-[#0A0A0A] transition-colors">
                                    <div className="flex items-center gap-3">
                                        {product.image_url && product.image_url.Valid ? (
                                            <img src={product.image_url.String} alt={product.name} className="h-10 w-10 rounded-[2px] object-cover border border-[#1A1A1A]" />
                                        ) : (
                                            <div className="h-10 w-10 bg-[#1A1A1A] rounded-[2px] flex items-center justify-center">
                                                <Package className="h-4 w-4 text-[#555555]" />
                                            </div>
                                        )}
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{product.name}</p>
                                    </div>

                                    <div className="text-[13px] font-bold text-white">
                                        रू{(() => {
                                            const price = typeof product.price === 'number' ? product.price : (product.price.Valid ? product.price.Int64 : 0);
                                            return Number(price).toLocaleString();
                                        })()}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold text-white">{product.stock_quantity}</span>
                                        {(() => {
                                            const threshold = typeof product.low_stock_threshold === 'number' ? product.low_stock_threshold : (product.low_stock_threshold.Valid ? product.low_stock_threshold.Int32 : 10);
                                            if (product.stock_quantity <= threshold) {
                                                return <Badge className="rounded-[2px] text-[10px] font-black uppercase bg-[#DA291C]/10 text-[#DA291C] border border-[#DA291C]/20">Low</Badge>;
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <Badge className={`rounded-[2px] text-[10px] uppercase font-black tracking-tighter ${(product.status.product_status === 'active' && product.status.valid) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[#1A1A1A] text-[#888888]'}`}>
                                            {product.status.product_status || 'Active'}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-end">
                                        <Link
                                            to={`/inventory/products/${product.id}`}
                                            className="text-[10px] text-[#555555] hover:text-white uppercase tracking-[1px] font-bold transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <Package className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-[2px] text-[#555555]">No Products Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-[#888888] leading-relaxed">
                            This action is irreversible. The category and all associated products will be permanently removed from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px] px-6"
                            onClick={async () => {
                                try {
                                    await inventoryService.deleteCategory(id!);
                                    toast.success("Category deleted successfully");
                                    navigate("/inventory/categories");
                                } catch (error) {
                                    console.error("Failed to delete category", error);
                                    toast.error("Failed to delete category");
                                }
                            }}
                        >
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
