import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Truck, 
    Pencil, 
    Trash2, 
    Package, 
    AlertTriangle, 
    TrendingUp, 
    Mail, 
    Phone, 
    MapPin, 
    Plus,
    Search,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SupplierDialog } from "@/components/CreateInventoryDialogs";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Helper to extract numeric values from pgtype
const getNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') {
        if ('Int64' in value) return value.Int64 || 0;
        if ('Int32' in value) return value.Int32 || 0;
        if ('String' in value) return parseFloat(value.String) || 0;
    }
    return 0;
};

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: supplier, isLoading: supplierLoading } = useQuery({
        queryKey: ["supplier", id],
        queryFn: () => inventoryService.getSupplier(id!),
        enabled: !!id,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["supplier-stats", id],
        queryFn: () => inventoryService.getSupplierStats(id!),
        enabled: !!id,
    });

    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ["supplier-products", id],
        queryFn: () => inventoryService.getSupplierProducts(id!),
        enabled: !!id,
    });

    const handleDelete = async () => {
        if (!id) return;
        try {
            await inventoryService.deleteSupplier(id);
            toast.success("Supplier deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            navigate("/inventory/suppliers");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete supplier");
        }
    };

    const filteredProducts = products?.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof p.barcode === 'string' ? p.barcode : p.barcode?.String || "").includes(searchTerm)
    );

    if (supplierLoading || statsLoading || productsLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Truck className="h-12 w-12 text-teal-500 animate-bounce" />
                <p className="text-gray-500 font-medium">Gathering supplier intelligence...</p>
            </div>
        );
    }

    if (!supplier) return <div className="p-8 text-center text-gray-500">Supplier not found</div>;

    const statsCards = [
        {
            title: "Total Products",
            value: stats?.product_count || 0,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Inventory Value",
            value: `रू ${getNumericValue(stats?.total_value).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Low Stock Items",
            value: stats?.low_stock_count || 0,
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50"
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header section with glassmorphism style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate("/inventory/suppliers")}
                        className="rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3">Supplier</Badge>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">Vendor Intelligence & Performance Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SupplierDialog supplier={supplier} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["supplier", id] })}>
                        <Button variant="outline" size="sm" className="rounded-lg h-10 border-gray-200">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    </SupplierDialog>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="rounded-lg h-10"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats and Contact */}
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {statsCards.map((stat, index) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                                <h3 className="text-2xl font-bold mt-1 text-gray-900 tracking-tight">{stat.value}</h3>
                                            </div>
                                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact Information Card */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5 text-teal-600" />
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                                    <a href={`mailto:${supplier.email}`} className="text-sm text-blue-600 hover:underline font-medium break-all">
                                        {supplier.email || "Not provided"}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Phone className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</p>
                                    <a href={`tel:${supplier.phone_number}`} className="text-sm text-gray-900 font-medium">
                                        {supplier.phone_number || "Not provided"}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <MapPin className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Office Address</p>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {supplier.address || "No address recorded"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Associated Products List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm min-h-[500px] flex flex-col">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl">Associated Products</CardTitle>
                                    <CardDescription>All items sourced from this supplier</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        placeholder="Search by name or barcode..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-10 rounded-lg border-gray-200 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow overflow-auto">
                            {filteredProducts && filteredProducts.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-gray-50 pointer-events-none sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="font-semibold text-gray-600">Product</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Stock</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Price</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => {
                                            const isLowStock = product.stock_quantity <= getNumericValue(product.low_stock_threshold);
                                            return (
                                                <TableRow key={product.id} className="hover:bg-gray-50 transition-colors group">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">{product.name}</span>
                                                            <span className="text-xs text-gray-400 transition-colors">{typeof product.barcode === 'string' ? product.barcode : product.barcode?.String || "No Barcode"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold ${isLowStock ? "text-amber-600" : "text-gray-700"}`}>
                                                                {product.stock_quantity}
                                                            </span>
                                                            {isLowStock && (
                                                                <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] uppercase font-bold py-0 h-4">Low</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-mono text-gray-900 font-semibold">रू {getNumericValue(product.price).toLocaleString()}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-full">
                                                            <Link to={`/inventory`}>
                                                                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-teal-600" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                                        <Package className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                                    <p className="text-gray-500 max-w-xs mt-1">
                                        {searchTerm ? `No products match "${searchTerm}"` : "This supplier hasn't been associated with any products yet."}
                                    </p>
                                    {!searchTerm && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-6 rounded-lg"
                                            asChild
                                        >
                                            <Link to="/inventory">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Associate First Product
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove <span className="font-bold text-gray-900">{supplier.name}</span> from your records. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="rounded-lg"
                        >
                            Delete Supplier
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
