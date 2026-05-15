import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, MapPin, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { inventoryService, DiscoveredSupplier } from "@/services/inventory";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryDialogProps {
    category?: { id: string, name: string, description: string };
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function CategoryDialog({ category, onSuccess, children }: CategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const isEdit = !!category;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
            };

            if (isEdit && category) {
                await inventoryService.updateCategory(category.id, data);
                toast.success("Category updated successfully");
            } else {
                await inventoryService.createCategory(data);
                toast.success("Category created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["categories"] });
            if (isEdit && category) {
                queryClient.invalidateQueries({ queryKey: ["category", category.id] });
            }

            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Failed to update category" : "Failed to create category");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[2px] hover:bg-[#1A1A1A]">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
                    <DialogDescription className="text-[11px] text-[#555555] uppercase tracking-[0.5px]">
                        {isEdit ? "Update category details." : "Create a new category for your products."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Name</Label>
                        <Input id="name" name="name" defaultValue={category?.name} required placeholder="e.g. Electronics" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] focus:ring-[#DA291C] focus:border-[#DA291C] text-sm text-white placeholder:text-[#555555]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Description</Label>
                        <Input id="description" name="description" defaultValue={category?.description} required placeholder="Category description" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] focus:ring-[#DA291C] focus:border-[#DA291C] text-sm text-white placeholder:text-[#555555]" />
                    </div>
                    <Button type="submit" className="w-full bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]" disabled={loading}>
                        {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Category" : "Create Category")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface SupplierDialogProps {
    supplier?: { id: string, name: string, address: string, phone_number: string, email: string };
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function SupplierDialog({ supplier, onSuccess, children }: SupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const isEdit = !!supplier;
    const [activeTab, setActiveTab] = useState(isEdit ? "manual" : "discover");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLocation, setSearchLocation] = useState("Nepal");
    const [searching, setSearching] = useState(false);
    const [discoveredSuppliers, setDiscoveredSuppliers] = useState<DiscoveredSupplier[]>([]);
    const queryClient = useQueryClient();

    // Listen for prefill events from FindSuppliers page
    useEffect(() => {
        const handlePrefill = (event: CustomEvent<DiscoveredSupplier>) => {
            const data = event.detail;
            // Open the dialog and switch to manual tab
            setOpen(true);
            setActiveTab("manual");
            
            // Wait for dialog to open, then fill the form
            setTimeout(() => {
                const nameInput = document.getElementById("name") as HTMLInputElement;
                const addressInput = document.getElementById("address") as HTMLInputElement;
                const phoneInput = document.getElementById("phone_number") as HTMLInputElement;
                const emailInput = document.getElementById("email") as HTMLInputElement;
                
                if (nameInput) nameInput.value = data.name;
                if (addressInput) addressInput.value = data.address;
                if (phoneInput) phoneInput.value = data.phone;
                if (emailInput) emailInput.value = "";
                
                toast.info("Supplier details filled. Add email and submit.");
            }, 200);
        };

        window.addEventListener("prefill-supplier", handlePrefill as EventListener);
        return () => {
            window.removeEventListener("prefill-supplier", handlePrefill as EventListener);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                phone_number: formData.get("phone_number") as string,
                email: formData.get("email") as string,
            };

            if (isEdit && supplier) {
                await inventoryService.updateSupplier(supplier.id, data);
                toast.success("Supplier updated successfully");
            } else {
                await inventoryService.createSupplier(data);
                toast.success("Supplier created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            if (isEdit && supplier) {
                queryClient.invalidateQueries({ queryKey: ["supplier", supplier.id] });
            }

            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(isEdit ? "Failed to update supplier" : "Failed to create supplier");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSuppliers = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a search term");
            return;
        }

        setSearching(true);
        try {
            const results = await inventoryService.findSuppliers(searchQuery, searchLocation);
            setDiscoveredSuppliers(results);
            if (results.length === 0) {
                toast.info("No suppliers found. Try different keywords.");
            } else {
                toast.success(`Found ${results.length} suppliers!`);
            }
        } catch (error) {
            toast.error("Failed to search suppliers");
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const handleUseDiscoveredSupplier = (supplier: DiscoveredSupplier) => {
        // Pre-fill the manual form with discovered supplier data
        setActiveTab("manual");
        // We'll use a timeout to ensure the tab switch happens first
        setTimeout(() => {
            const nameInput = document.getElementById("name") as HTMLInputElement;
            const addressInput = document.getElementById("address") as HTMLInputElement;
            const phoneInput = document.getElementById("phone_number") as HTMLInputElement;
            const emailInput = document.getElementById("email") as HTMLInputElement;
            
            if (nameInput) nameInput.value = supplier.name;
            if (addressInput) addressInput.value = supplier.address;
            if (phoneInput) phoneInput.value = supplier.phone;
            if (emailInput) emailInput.value = "";
            
            toast.info("Supplier details filled. Add email and submit.");
        }, 100);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[2px] hover:bg-[#1A1A1A]">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-bold text-white uppercase tracking-[1px]">{isEdit ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
                    <DialogDescription className="text-[11px] text-[#555555] uppercase tracking-[0.5px]">
                        {isEdit ? "Update supplier details." : "Discover new suppliers or add manually."}
                    </DialogDescription>
                </DialogHeader>
                
                {!isEdit ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 bg-[#111111] rounded-[2px]">
                            <TabsTrigger value="discover" className="text-[11px] font-bold uppercase tracking-[0.5px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Discover</TabsTrigger>
                            <TabsTrigger value="manual" className="text-[11px] font-bold uppercase tracking-[0.5px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Manual Entry</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="discover" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-query" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Search Suppliers</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="search-query"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="e.g., shirt, electronics, groceries"
                                        onKeyDown={(e) => e.key === "Enter" && handleSearchSuppliers()}
                                        className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]"
                                    />
                                    <Button onClick={handleSearchSuppliers} disabled={searching} className="bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]">
                                        <Search className="h-4 w-4 mr-2" />
                                        {searching ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="search-location" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Location</Label>
                                <Input
                                    id="search-location"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="City, Country"
                                    className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]"
                                />
                            </div>

                            {discoveredSuppliers.length > 0 && (
                                <div className="space-y-3 max-h-96 overflow-y-auto mt-4">
                                    <Label className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Found Suppliers ({discoveredSuppliers.length})</Label>
                                    {discoveredSuppliers.map((supplier, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-[#1A1A1A] rounded-[2px] bg-[#111111] p-4 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                                            onClick={() => handleUseDiscoveredSupplier(supplier)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-[13px] text-white uppercase tracking-tight">{supplier.name}</h4>
                                                    <div className="flex items-center gap-1 mt-1 text-[11px] text-[#888888]">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{supplier.address}</span>
                                                    </div>
                                                    {supplier.phone && (
                                                        <p className="text-[11px] text-[#888888] mt-1">{supplier.phone}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {supplier.rating > 0 && (
                                                            <div className="flex items-center gap-1 text-[11px] text-[#888888]">
                                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                                <span>{supplier.rating}</span>
                                                                <span className="text-[#555555]">({supplier.reviews} reviews)</span>
                                                            </div>
                                                        )}
                                                        {supplier.category && (
                                                            <span className="text-[10px] bg-[#1A1A1A] text-[#888888] px-2 py-1 rounded-[2px] uppercase font-bold tracking-[0.5px]">
                                                                {supplier.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUseDiscoveredSupplier(supplier);
                                                    }}
                                                    className="border-[#1A1A1A] bg-[#0A0A0A] text-white text-[10px] uppercase font-bold tracking-[0.5px] hover:bg-[#1A1A1A] rounded-[2px]"
                                                >
                                                    Use
                                                </Button>
                                            </div>
                                            {supplier.website && (
                                                <a
                                                    href={supplier.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] text-[#DA291C] hover:underline mt-2 uppercase tracking-[0.5px] font-bold"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Visit Website <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="manual" className="mt-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Name</Label>
                                    <Input id="name" name="name" defaultValue={supplier?.name} required placeholder="Supplier Name" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Address</Label>
                                    <Input id="address" name="address" defaultValue={supplier?.address} required placeholder="Address" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Phone</Label>
                                    <Input id="phone_number" name="phone_number" defaultValue={supplier?.phone_number} required placeholder="Phone Number" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Email</Label>
                                    <Input id="email" name="email" type="email" defaultValue={supplier?.email} required placeholder="Email" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                                </div>
                                <Button type="submit" className="w-full bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]" disabled={loading}>
                                    {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Supplier" : "Create Supplier")}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Name</Label>
                            <Input id="name" name="name" defaultValue={supplier?.name} required placeholder="Supplier Name" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Address</Label>
                            <Input id="address" name="address" defaultValue={supplier?.address} required placeholder="Address" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone_number" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Phone</Label>
                            <Input id="phone_number" name="phone_number" defaultValue={supplier?.phone_number} required placeholder="Phone Number" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-black text-[#555555]">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={supplier?.email} required placeholder="Email" className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-sm text-white placeholder:text-[#555555]" />
                        </div>
                        <Button type="submit" className="w-full bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]" disabled={loading}>
                            {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Supplier" : "Create Supplier")}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
