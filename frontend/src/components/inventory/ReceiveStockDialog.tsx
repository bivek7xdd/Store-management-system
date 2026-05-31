import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, Product, CreateProductBatchData } from "@/services/inventory";

interface ReceiveStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReceiveStockDialog({ open, onOpenChange }: ReceiveStockDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [batchForm, setBatchForm] = useState<CreateProductBatchData>({
        batch_number: "",
        quantity: 0,
    });
    const [step, setStep] = useState<"search" | "batch" | "new">("search");

    const queryClient = useQueryClient();

    // Search products
    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ["products", searchTerm],
        queryFn: () => {
            if (searchTerm.length < 2) return [];
            return inventoryService.searchProducts(searchTerm, 20);
        },
        enabled: searchTerm.length >= 2,
    });

    // Create batch mutation
    const createBatchMutation = useMutation({
        mutationFn: async ({ productId, data }: { productId: string; data: CreateProductBatchData }) => {
            return inventoryService.createProductBatch(productId, data);
        },
        onSuccess: () => {
            toast.success("Batch added successfully");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            resetAndClose();
        },
        onError: () => {
            toast.error("Failed to add batch");
        },
    });

    const resetAndClose = () => {
        setSearchTerm("");
        setSelectedProduct(null);
        setBatchForm({ batch_number: "", quantity: 0 });
        setStep("search");
        onOpenChange(false);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setStep("batch");
    };

    const handleCreateNew = () => {
        setStep("new");
    };

    const handleSubmitBatch = () => {
        if (!selectedProduct || !batchForm.batch_number) return;
        createBatchMutation.mutate({ productId: selectedProduct.id, data: batchForm });
    };

    const handleCreateNewProduct = async () => {
        // This would open the full product creation form
        // For now, just close and let user use the regular Add Product flow
        toast.info("Use 'Add Product' to create a new product with batches");
        resetAndClose();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-[#0A0A0A] border border-[#1A1A1A]">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#DA291C]" />
                        Receive Stock
                    </DialogTitle>
                    <DialogDescription className="text-[#888888]">
                        Search for a product to add a batch, or create a new product.
                    </DialogDescription>
                </DialogHeader>

                {step === "search" && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search product by name or barcode..."
                                className="pl-10 bg-[#111111] border-[#1A1A1A] text-white"
                                autoFocus
                            />
                        </div>

                        {isSearching && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
                            </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                            <div className="border border-[#1A1A1A] rounded-[2px] max-h-[300px] overflow-y-auto">
                                {searchResults.map((product: Product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className="w-full px-4 py-3 text-left hover:bg-[#1A1A1A] border-b border-[#1A1A1A] last:border-0 transition-colors"
                                    >
                                        <div className="font-medium text-white text-[13px]">{product.name}</div>
                                        <div className="text-[11px] text-[#888888]">
                                            Stock: {product.stock_quantity} | Price: रू {product.price}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-[#888888] mb-4">No products found</p>
                                <Button
                                    onClick={handleCreateNew}
                                    className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Product
                                </Button>
                            </div>
                        )}

                        {searchTerm.length < 2 && (
                            <div className="text-center py-8">
                                <p className="text-[12px] text-[#555555]">Type at least 2 characters to search</p>
                            </div>
                        )}
                    </div>
                )}

                {step === "batch" && selectedProduct && (
                    <div className="space-y-4">
                        <div className="p-3 bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                            <div className="font-medium text-white">{selectedProduct.name}</div>
                            <div className="text-[11px] text-[#888888]">
                                Current stock: {selectedProduct.stock_quantity} units
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#888888]">Batch Number *</Label>
                            <Input
                                value={batchForm.batch_number}
                                onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                                placeholder="e.g., BATCH-001"
                                className="bg-[#111111] border-[#1A1A1A] text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-[#888888]">Manufacturing Date</Label>
                                <Input
                                    type="date"
                                    value={batchForm.manufacturing_date || ""}
                                    onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })}
                                    className="bg-[#111111] border-[#1A1A1A] text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#888888]">Expiry Date</Label>
                                <Input
                                    type="date"
                                    value={batchForm.expiry_date || ""}
                                    onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                                    className="bg-[#111111] border-[#1A1A1A] text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#888888]">Quantity Received *</Label>
                            <Input
                                type="number"
                                value={batchForm.quantity}
                                onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) || 0 })}
                                className="bg-[#111111] border-[#1A1A1A] text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#888888]">Notes</Label>
                            <Input
                                value={batchForm.notes || ""}
                                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                                placeholder="Optional notes..."
                                className="bg-[#111111] border-[#1A1A1A] text-white"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("search")}
                                className="border-[#1A1A1A] text-[#888888]"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitBatch}
                                disabled={!batchForm.batch_number || createBatchMutation.isPending}
                                className="flex-1 bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                            >
                                {createBatchMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Add Batch
                            </Button>
                        </div>
                    </div>
                )}

                {step === "new" && (
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <Package className="h-12 w-12 text-[#303030] mx-auto mb-4" />
                            <p className="text-white mb-2">Product not found?</p>
                            <p className="text-[12px] text-[#888888] mb-4">
                                Create a new product first, then add batches.
                            </p>
                            <Button
                                onClick={handleCreateNewProduct}
                                className="bg-[#DA291C] hover:bg-[#B01E0A] text-white"
                            >
                                Go to Add Product
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
