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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-10 w-10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Find Suppliers</h1>
                    <p className="text-gray-500 mt-1">
                        Discover wholesale suppliers near you using Serper API
                    </p>
                </div>
            </div>

            {/* Search Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-teal-600" />
                        Search for Suppliers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-query">Product or Category</Label>
                                <Input
                                    id="search-query"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="e.g., shirt, electronics, groceries"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="search-location">Location</Label>
                                <Input
                                    id="search-location"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={searching}
                            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700"
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
                                <Card key={i}>
                                    <CardContent className="p-6 space-y-3">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-8 w-20" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : suppliers.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Found {suppliers.length} Suppliers
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliers.map((supplier, index) => (
                                    <Card
                                        key={index}
                                        className="hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => handleUseSupplier(supplier)}
                                    >
                                        <CardContent className="p-6 space-y-4">
                                            {/* Header */}
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                                                        {supplier.name}
                                                    </h3>
                                                    <Building2 className="h-5 w-5 text-teal-600 flex-shrink-0 ml-2" />
                                                </div>

                                                {supplier.category && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {supplier.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Rating */}
                                            {supplier.rating > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium text-sm">
                                                            {supplier.rating}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        ({supplier.reviews} reviews)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="space-y-2 text-sm">
                                                {supplier.address && (
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">
                                                            {supplier.address}
                                                        </span>
                                                    </div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                                        <span>{supplier.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-teal-600 hover:bg-teal-700"
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
                                                            className="h-9 w-9 p-0"
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
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No Suppliers Found
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Try different search keywords or change the location
                                </p>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <p>💡 Tips:</p>
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
                <Card>
                    <CardContent className="p-12 text-center">
                        <Building2 className="h-20 w-20 mx-auto text-teal-200 mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Find Wholesale Suppliers
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Search for suppliers in your area using our powerful discovery tool.
                            Find verified businesses with ratings, reviews, and contact information.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                            <div className="p-4 bg-teal-50 rounded-lg">
                                <Search className="h-6 w-6 mx-auto text-teal-600 mb-2" />
                                <p className="font-medium text-gray-900">Search</p>
                                <p className="text-gray-500">Enter product category</p>
                            </div>
                            <div className="p-4 bg-teal-50 rounded-lg">
                                <MapPin className="h-6 w-6 mx-auto text-teal-600 mb-2" />
                                <p className="font-medium text-gray-900">Location</p>
                                <p className="text-gray-500">Set your preferred area</p>
                            </div>
                            <div className="p-4 bg-teal-50 rounded-lg">
                                <Star className="h-6 w-6 mx-auto text-teal-600 mb-2" />
                                <p className="font-medium text-gray-900">Discover</p>
                                <p className="text-gray-500">Browse rated suppliers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
