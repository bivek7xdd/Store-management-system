import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Pencil, Trash2, TrendingUp, Archive, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDialog } from "@/components/CreateInventoryDialogs";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
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

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!category) return <div className="p-8">Category not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Category Details</h1>
                </div>
                <div className="flex gap-2">
                    {category && (
                        <CategoryDialog category={category}>
                            <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </CategoryDialog>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.product_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Items in this category</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_stock || 0}</div>
                        <p className="text-xs text-muted-foreground">Units available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(stats?.total_value || 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">Inventory value</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Category Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Name</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-8 w-8 bg-teal-100 rounded-md flex items-center justify-center">
                                <Package className="h-4 w-4 text-teal-700" />
                            </div>
                            <span className="text-lg font-medium">{category.name}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1 text-gray-700">{category.description}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Products in {category.name}</h2>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products && products.length > 0 ? (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {product.image_url && product.image_url.Valid ? (
                                                    <img src={product.image_url.String} alt={product.name} className="h-8 w-8 rounded-md object-cover" />
                                                ) : (
                                                    <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                                                        <Package className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                                {product.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const price = typeof product.price === 'number' ? product.price : (product.price.Valid ? product.price.Int64 : 0);
                                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {product.stock_quantity}
                                                {(() => {
                                                    const threshold = typeof product.low_stock_threshold === 'number' ? product.low_stock_threshold : (product.low_stock_threshold.Valid ? product.low_stock_threshold.Int32 : 10);
                                                    if (product.stock_quantity <= threshold) {
                                                        return <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Low</Badge>;
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={(product.status.product_status === 'active' && product.status.valid) ? 'default' : 'secondary'}>
                                                {product.status.product_status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/inventory/products/${product.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No products found in this category.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this category
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                                try {
                                    await inventoryService.deleteCategory(id!);
                                    toast({
                                        title: "Category Deleted",
                                        description: "Category has been successfully deleted.",
                                    });
                                    navigate("/inventory/categories");
                                } catch (error) {
                                    console.error("Failed to delete category", error);
                                    toast({
                                        variant: 'destructive',
                                        title: "Error",
                                        description: "Failed to delete category.",
                                    });
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
