import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    MapPin,
    Phone,
    Globe,
    Star,
    ExternalLink,
    Plus,
    ArrowLeft,
    Building2,
} from "lucide-react";
import { toast } from "sonner";
import { inventoryService, DiscoveredSupplier } from "@/services/inventory";
import { SupplierDialog } from "@/components/CreateInventoryDialogs";

export default function FindSuppliers() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLocation, setSearchLocation] = useState("Nepal");
    const [searching, setSearching] = useState(false);
    const [suppliers, setSuppliers] = useState<DiscoveredSupplier[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            toast.error("Please enter a search term");
            return;
        }

        setSearching(true);
        setHasSearched(true);
        setSuppliers([]);

        try {
            const results = await inventoryService.findSuppliers(
                searchQuery,
                searchLocation || "Nepal"
            );

            setSuppliers(results);

            if (results.length === 0) {
                toast.info("No suppliers found. Try different keywords or location.");
            } else {
                toast.success(`Found ${results.length} suppliers!`);
            }
        } catch (error: any) {
            console.error("Search error:", error);
            const errorMessage = error?.response?.data?.message || "Failed to search suppliers";
            toast.error(errorMessage);
        } finally {
            setSearching(false);
        }
    };

    const handleUseSupplier = (supplier: DiscoveredSupplier) => {
        // Open the supplier dialog with pre-filled data
        // We'll use a custom event to pass the data
        window.dispatchEvent(
            new CustomEvent("prefill-supplier", {
                detail: supplier,
            })
        );
        navigate("/inventory/suppliers");
    };

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Suppliers</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Find Suppliers</h1>
                    <p className="text-[#888888] text-sm mt-1">
                        Discover wholesale suppliers near you
                    </p>
                </div>
            </div>

            {/* Search Form */}
            <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-[14px]">
                        <Search className="h-5 w-5 text-[#DA291C]" />
                        Search for Suppliers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-query" className="text-[#888888] text-[11px] uppercase tracking-[1px] font-bold">Product or Category</Label>
                                <Input
                                    id="search-query"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="e.g., shirt, electronics, groceries"
                                    required
                                    className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-white text-[13px] focus:border-[#DA291C] placeholder:text-[#555555]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="search-location" className="text-[#888888] text-[11px] uppercase tracking-[1px] font-bold">Location</Label>
                                <Input
                                    id="search-location"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="City, Country"
                                    className="bg-[#111111] border-[#1A1A1A] rounded-[2px] text-white text-[13px] focus:border-[#DA291C] placeholder:text-[#555555]"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={searching}
                            className="w-full md:w-auto bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {searching ? "Searching..." : "Search Suppliers"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            {hasSearched && (
                <div className="space-y-4">
                    {searching ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
                                    <CardContent className="p-6 space-y-3">
                                        <Skeleton className="h-6 w-3/4 bg-[#1A1A1A]" />
                                        <Skeleton className="h-4 w-full bg-[#1A1A1A]" />
                                        <Skeleton className="h-4 w-1/2 bg-[#1A1A1A]" />
                                        <Skeleton className="h-8 w-20 bg-[#1A1A1A]" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : suppliers.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-[16px] font-bold text-white">
                                    Found {suppliers.length} Suppliers
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliers.map((supplier, index) => (
                                    <Card
                                        key={index}
                                        className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] hover:border-[#DA291C]/40 transition-all cursor-pointer"
                                        onClick={() => handleUseSupplier(supplier)}
                                    >
                                        <CardContent className="p-6 space-y-4">
                                            {/* Header */}
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-semibold text-[14px] text-white line-clamp-2">
                                                        {supplier.name}
                                                    </h3>
                                                    <Building2 className="h-5 w-5 text-[#DA291C] flex-shrink-0 ml-2" />
                                                </div>

                                                {supplier.category && (
                                                    <Badge variant="secondary" className="text-[10px] bg-[#DA291C]/10 text-[#DA291C] border-[#DA291C]/20 rounded-[2px]">
                                                        {supplier.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Rating */}
                                            {supplier.rating > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium text-sm text-white">
                                                            {supplier.rating}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-[#888888]">
                                                        ({supplier.reviews} reviews)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="space-y-2 text-sm">
                                                {supplier.address && (
                                                    <div className="flex items-start gap-2 text-[#888888]">
                                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">
                                                            {supplier.address}
                                                        </span>
                                                    </div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-2 text-[#888888]">
                                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                                        <span>{supplier.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-9 rounded-[2px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUseSupplier(supplier);
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Use This Supplier
                                                </Button>
                                                {supplier.website && (
                                                    <a
                                                        href={supplier.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 w-9 p-0 border-[#1A1A1A] text-[#888888] rounded-[2px]"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
                            <CardContent className="p-12 text-center">
                                <Search className="h-16 w-16 mx-auto text-[#303030] mb-4" />
                                <h3 className="text-[16px] font-bold text-white mb-2">
                                    No Suppliers Found
                                </h3>
                                <p className="text-[#888888] text-sm mb-4">
                                    Try different search keywords or change the location
                                </p>
                                <div className="space-y-2 text-sm text-[#666666]">
                                    <p>Tips:</p>
                                    <ul className="text-left inline-block">
                                        <li>• Use general terms: "shirt", "electronics", "groceries"</li>
                                        <li>• Try "wholesale" + product name</li>
                                        <li>• Change location to a different city</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!hasSearched && (
                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
                    <CardContent className="p-12 text-center">
                        <Building2 className="h-20 w-20 mx-auto text-[#DA291C]/30 mb-6" />
                        <h3 className="text-[18px] font-bold text-white mb-3">
                            Find Wholesale Suppliers
                        </h3>
                        <p className="text-[#888888] text-sm mb-6 max-w-md mx-auto">
                            Search for suppliers near you using our discovery tool.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                            <div className="p-4 bg-[#DA291C]/10 rounded-[2px] border border-[#DA291C]/20">
                                <Search className="h-6 w-6 mx-auto text-[#DA291C] mb-2" />
                                <p className="font-medium text-white">Search</p>
                                <p className="text-[#888888] text-xs">Enter product category</p>
                            </div>
                            <div className="p-4 bg-[#DA291C]/10 rounded-[2px] border border-[#DA291C]/20">
                                <MapPin className="h-6 w-6 mx-auto text-[#DA291C] mb-2" />
                                <p className="font-medium text-white">Location</p>
                                <p className="text-[#888888] text-xs">Set your preferred area</p>
                            </div>
                            <div className="p-4 bg-[#DA291C]/10 rounded-[2px] border border-[#DA291C]/20">
                                <Star className="h-6 w-6 mx-auto text-[#DA291C] mb-2" />
                                <p className="font-medium text-white">Discover</p>
                                <p className="text-[#888888] text-xs">Browse rated suppliers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
