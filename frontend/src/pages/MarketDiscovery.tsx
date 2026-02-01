import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    MapPin,
    Phone,
    Globe,
    Building2,
    Navigation,
    AlertCircle,
    Loader2,
    X,
    Mail,
    Clock,
    Star,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons in React/Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Custom icon for user location (blue)
const UserLocationIcon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="32" height="32">
            <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
    `)}`,
    shadowUrl: iconShadow,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

// Custom icon for suppliers (green)
const SupplierIcon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669" width="28" height="28">
            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" fill="#059669"/>
        </svg>
    `)}`,
    shadowUrl: iconShadow,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

L.Marker.prototype.options.icon = DefaultIcon;

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

// Color theme matching the app
const colors = {
    primary: "#0d9488",
    primaryDark: "#115e59",
};

// Types
interface Coordinates {
    lat: number;
    lng: number;
}

interface PlaceResult {
    id: string;
    displayName: string;
    formattedAddress: string;
    phone?: string;
    website?: string;
    email?: string;
    location: Coordinates;
    categories: string[];
    distance?: number; // Distance from user in meters
    relevanceScore?: number; // How well it matches the search
    openingHours?: string[];
    rating?: number;
    priceLevel?: string;
    businessStatus?: string;
    detailsLoaded?: boolean;
}

// Helper component to update map view when location/selection changes
function MapController({ center, zoom }: { center: Coordinates | null, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);
    return null;
}

export default function MarketDiscovery() {
    // State for search and location
    const [searchQuery, setSearchQuery] = useState("");
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [currentMapCenter, setCurrentMapCenter] = useState<Coordinates | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [places, setPlaces] = useState<PlaceResult[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(!!GEOAPIFY_API_KEY);
    const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    /**
     * Get user's current location using browser geolocation API
     * Tries high accuracy first, then falls back to low accuracy
     */
    const getUserLocation = useCallback(() => {
        setIsLoadingLocation(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsLoadingLocation(false);
            return;
        }

        const successHandler = (position: GeolocationPosition) => {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setUserLocation(coords);
            setCurrentMapCenter(coords);
            setIsLoadingLocation(false);
            toast.success("Location detected successfully!");
        };

        const errorHandler = (err: GeolocationPositionError, isHighAccuracy: boolean) => {
            // If high accuracy failed, try low accuracy
            if (isHighAccuracy) {
                console.log("High accuracy location failed, trying low accuracy...");
                navigator.geolocation.getCurrentPosition(
                    successHandler,
                    (retryErr) => errorHandler(retryErr, false),
                    {
                        enableHighAccuracy: false,
                        timeout: 20000,
                        maximumAge: 300000,
                    }
                );
                return;
            }

            setIsLoadingLocation(false);
            let errorMessage = "Failed to get your location";
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    errorMessage = "Location permission denied. Please enable location access.";
                    break;
                case err.POSITION_UNAVAILABLE:
                    errorMessage = "Location information is unavailable.";
                    break;
                case err.TIMEOUT:
                    errorMessage = "Location request timed out. Please try entering your location manually.";
                    break;
            }
            setError(errorMessage);
            toast.error(errorMessage);
        };

        // First try with high accuracy
        navigator.geolocation.getCurrentPosition(
            successHandler,
            (err) => errorHandler(err, true),
            {
                enableHighAccuracy: true,
                timeout: 15000, // 15s timeout for high accuracy
                maximumAge: 300000,
            }
        );
    }, []);

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }, []);

    /**
     * Fetch detailed information for a place using Geoapify Places API
     */
    const fetchPlaceDetails = useCallback(async (place: PlaceResult): Promise<PlaceResult> => {
        if (place.detailsLoaded || !GEOAPIFY_API_KEY) {
            return place;
        }

        setLoadingDetails(place.id);

        try {
            // Try to get more details using the place_id if available
            if (place.id && place.id !== `${place.location.lat}-${place.location.lng}`) {
                const detailsParams = new URLSearchParams({
                    id: place.id,
                    apiKey: GEOAPIFY_API_KEY,
                });

                const detailsResponse = await fetch(`https://api.geoapify.com/v2/place-details?${detailsParams.toString()}`);

                if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    const details = detailsData.features?.[0]?.properties;

                    if (details) {
                        const updatedPlace: PlaceResult = {
                            ...place,
                            phone: details.contact?.phone || place.phone,
                            website: details.website || place.website,
                            email: details.contact?.email,
                            openingHours: details.opening_hours?.periods?.map((period: any) =>
                                `${period.open?.day}: ${period.open?.time || 'Closed'} - ${period.close?.time || 'Open'}`
                            ),
                            rating: details.rating,
                            priceLevel: details.price_level,
                            businessStatus: details.business_status,
                            detailsLoaded: true,
                        };

                        // Update the place in the places array
                        setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p));
                        setLoadingDetails(null);
                        return updatedPlace;
                    }
                }
            }

            // Fallback: try to get additional info using reverse geocoding
            const reverseParams = new URLSearchParams({
                lat: place.location.lat.toString(),
                lon: place.location.lng.toString(),
                apiKey: GEOAPIFY_API_KEY,
            });

            const reverseResponse = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${reverseParams.toString()}`);

            if (reverseResponse.ok) {
                const reverseData = await reverseResponse.json();
                const feature = reverseData.features?.[0];

                if (feature?.properties) {
                    const props = feature.properties;
                    const updatedPlace: PlaceResult = {
                        ...place,
                        phone: props.contact?.phone || place.phone,
                        website: props.website || place.website,
                        email: props.contact?.email,
                        detailsLoaded: true,
                    };

                    setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p));
                    setLoadingDetails(null);
                    return updatedPlace;
                }
            }

            // Mark as loaded even if no additional details found
            const updatedPlace = { ...place, detailsLoaded: true };
            setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p));
            setLoadingDetails(null);
            return updatedPlace;

        } catch (error) {
            console.error("Error fetching place details:", error);
            const updatedPlace = { ...place, detailsLoaded: true };
            setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p));
            setLoadingDetails(null);
            return updatedPlace;
        }
    }, [GEOAPIFY_API_KEY]);

    /**
     * Fetch actual route coordinates using Geoapify Routing API
     */
    const fetchRoute = useCallback(async (destination: Coordinates): Promise<[number, number][] | null> => {
        if (!userLocation || !GEOAPIFY_API_KEY) {
            return null;
        }

        setLoadingRoute(true);

        try {
            const params = new URLSearchParams({
                waypoints: `${userLocation.lat},${userLocation.lng}|${destination.lat},${destination.lng}`,
                mode: 'drive', // Can be 'drive', 'walk', 'bicycle'
                apiKey: GEOAPIFY_API_KEY,
            });

            const response = await fetch(`https://api.geoapify.com/v1/routing?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    const route = data.features[0];
                    if (route.geometry && route.geometry.coordinates) {
                        // Convert coordinates to the format expected by Leaflet [lat, lng]
                        const coordinates: [number, number][] = route.geometry.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
                        setLoadingRoute(false);
                        return coordinates;
                    }
                }
            }
        } catch (error) {
            console.log("Route fetching failed:", error);
        }

        setLoadingRoute(false);
        return null;
    }, [userLocation, GEOAPIFY_API_KEY]);

    /**
     * Handle place selection and fetch route
     */
    const handlePlaceSelect = useCallback(async (place: PlaceResult) => {
        setSelectedPlace(place);
        setRouteCoordinates(null); // Clear previous route

        // Fetch additional details if not already loaded
        if (!place.detailsLoaded) {
            await fetchPlaceDetails(place);
        }

        // Fetch the actual route
        const route = await fetchRoute(place.location);
        if (route) {
            setRouteCoordinates(route);
        }
    }, [fetchPlaceDetails, fetchRoute]);

    /**
     * Calculate relevance score based on name matching and categories
     */
    const calculateRelevanceScore = useCallback((place: any, searchTerm: string): number => {
        let score = 0;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const placeName = (place.properties.name || '').toLowerCase();
        const categories = (place.properties.categories || []).join(' ').toLowerCase();
        const address = (place.properties.formatted || '').toLowerCase();

        // Exact product match in name gets highest score
        if (placeName.includes(lowerSearchTerm)) {
            score += 200;
        }

        // Partial product match in name
        const searchWords = lowerSearchTerm.split(' ');
        searchWords.forEach(word => {
            if (word.length > 2 && placeName.includes(word)) {
                score += 60;
            }
        });

        // Product-specific business type matching - STRICT matching
        const productBusinessTypes = {
            'heater': ['solar', 'heating', 'water heater', 'electric heater', 'gas heater', 'boiler'],
            'paint': ['paint', 'color', 'coating', 'varnish', 'primer'],
            'cement': ['cement', 'concrete', 'mortar', 'building material'],
            'rice': ['rice', 'grain', 'food', 'grocery', 'cereal'],
            'hardware': ['hardware', 'tools', 'nuts', 'bolts', 'screws'],
            'electrical': ['electrical', 'electronics', 'wire', 'cable', 'switch'],
            'plumbing': ['plumbing', 'pipe', 'faucet', 'toilet', 'sink'],
        };

        // Strict product-specific penalties - penalize unrelated product dealers
        const productSpecificPenalties = {
            'heater': ['paint', 'cement', 'rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'furniture'],
            'paint': ['heater', 'heating', 'rice', 'grain', 'food', 'grocery', 'textile', 'clothing'],
            'cement': ['heater', 'heating', 'paint', 'rice', 'grain', 'food', 'grocery', 'textile'],
            'rice': ['heater', 'heating', 'paint', 'cement', 'hardware', 'electrical', 'plumbing'],
            'hardware': ['rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'beauty'],
            'electrical': ['rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'paint'],
        };

        // Apply product-specific matching
        Object.entries(productBusinessTypes).forEach(([product, types]) => {
            if (lowerSearchTerm.includes(product)) {
                types.forEach(type => {
                    if (placeName.includes(type) || categories.includes(type)) {
                        score += 100;
                    }
                });
            }
        });

        // Apply product-specific penalties
        Object.entries(productSpecificPenalties).forEach(([product, penaltyTerms]) => {
            if (lowerSearchTerm.includes(product)) {
                penaltyTerms.forEach(term => {
                    if (placeName.includes(term) || categories.includes(term)) {
                        score -= 150; // Heavy penalty for unrelated products
                    }
                });
            }
        });

        // Only give points for general business terms if they're combined with relevant product terms
        const hasRelevantProductTerm = Object.entries(productBusinessTypes).some(([product, types]) => {
            if (lowerSearchTerm.includes(product)) {
                return types.some(type => placeName.includes(type) || categories.includes(type));
            }
            return false;
        });

        // General business type relevance - only if product-relevant
        if (hasRelevantProductTerm) {
            const relevantCategories = [
                'wholesale', 'distributor', 'supplier', 'trader', 'dealer',
                'merchant', 'vendor', 'store', 'shop', 'market'
            ];

            relevantCategories.forEach(category => {
                if (placeName.includes(category) || categories.includes(category)) {
                    score += 40;
                }
            });
        } else {
            // Give minimal points for general business terms without product relevance
            const relevantCategories = [
                'wholesale', 'distributor', 'supplier', 'trader', 'dealer',
                'merchant', 'vendor', 'store', 'shop', 'market'
            ];

            relevantCategories.forEach(category => {
                if (placeName.includes(category) || categories.includes(category)) {
                    score += 10; // Much lower score
                }
            });
        }

        // Penalize obviously unrelated businesses
        const unrelatedKeywords = [
            'restaurant', 'hotel', 'hospital', 'school', 'bank', 'atm',
            'pharmacy', 'medical', 'clinic', 'beauty', 'salon', 'spa',
            'travel', 'tour', 'insurance', 'real estate', 'lawyer', 'gym', 'fitness'
        ];

        unrelatedKeywords.forEach(keyword => {
            if (placeName.includes(keyword) || categories.includes(keyword)) {
                score -= 100;
            }
        });

        // Penalize car dealers unless searching for automotive products
        if (!lowerSearchTerm.includes('car') && !lowerSearchTerm.includes('auto') && !lowerSearchTerm.includes('vehicle')) {
            if (placeName.includes('dealer') && (placeName.includes('car') || placeName.includes('auto') || placeName.includes('honda') || placeName.includes('toyota') || placeName.includes('subaru'))) {
                score -= 200;
            }
        }

        // Penalize telecom/mobile distributors unless searching for electronics
        if (!lowerSearchTerm.includes('mobile') && !lowerSearchTerm.includes('phone') && !lowerSearchTerm.includes('telecom')) {
            if (placeName.includes('ncell') || placeName.includes('ntc') || placeName.includes('mobile') || placeName.includes('telecom')) {
                score -= 150;
            }
        }

        return Math.max(0, score); // Ensure score doesn't go negative
    }, []);

    /**
     * Test API key capabilities and provide diagnostics
     */
    const testAPICapabilities = useCallback(async () => {
        if (!GEOAPIFY_API_KEY) {
            console.log("❌ No API key configured");
            return;
        }

        console.log("🔍 Testing API capabilities...");

        // Test basic geocoding
        try {
            const testParams = new URLSearchParams({
                text: "Kathmandu Nepal",
                limit: "1",
                apiKey: GEOAPIFY_API_KEY,
            });

            const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${testParams.toString()}`);
            if (response.ok) {
                console.log("✅ Geocoding API: Working");
            } else {
                console.log("❌ Geocoding API: Failed", response.status);
            }
        } catch (error) {
            console.log("❌ Geocoding API: Network error");
        }

        // Test Places API v2
        try {
            const placesParams = new URLSearchParams({
                categories: "building.retail",
                filter: "circle:85.3240,27.7172,1000",
                limit: "1",
                apiKey: GEOAPIFY_API_KEY,
            });

            const response = await fetch(`https://api.geoapify.com/v2/places?${placesParams.toString()}`);
            if (response.ok) {
                console.log("✅ Places API v2: Working");
            } else {
                console.log("❌ Places API v2: Failed", response.status);
                if (response.status === 403) {
                    console.log("💡 Places API v2 requires a paid plan or specific API key permissions");
                }
            }
        } catch (error) {
            console.log("❌ Places API v2: Network error");
        }

        // Test Routing API
        try {
            const routeParams = new URLSearchParams({
                waypoints: "27.7172,85.3240|27.7000,85.3000",
                mode: "drive",
                apiKey: GEOAPIFY_API_KEY,
            });

            const response = await fetch(`https://api.geoapify.com/v1/routing?${routeParams.toString()}`);
            if (response.ok) {
                console.log("✅ Routing API: Working");
            } else {
                console.log("❌ Routing API: Failed", response.status);
            }
        } catch (error) {
            console.log("❌ Routing API: Network error");
        }
    }, [GEOAPIFY_API_KEY]);

    /**
     * Try Places API v2 with correct parameters (if API key supports it)
     */
    const tryPlacesAPIv2 = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        try {
            // Use only well-known, valid categories
            const validCategories = [
                'commercial.shopping_mall',
                'commercial.marketplace',
                'building.retail',
                'commercial.supermarket'
            ];

            const params = new URLSearchParams({
                categories: validCategories.join(','),
                filter: `circle:${userLocation.lng},${userLocation.lat},15000`, // 15km radius
                limit: "20",
                apiKey: GEOAPIFY_API_KEY,
            });

            console.log("Trying Places API v2 with URL:", `https://api.geoapify.com/v2/places?${params.toString()}`);

            const response = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    console.log("✅ Places API v2 success:", data.features.length, "results");
                    results.push(...data.features);
                } else {
                    console.log("⚠️ Places API v2 returned no results");
                }
            } else {
                const errorText = await response.text();
                console.log("❌ Places API v2 failed:", response.status, response.statusText);
                console.log("Error details:", errorText);

                // Provide specific guidance based on error
                if (response.status === 401) {
                    console.log("🔑 API Key issue: Invalid or missing API key");
                } else if (response.status === 403) {
                    console.log("🚫 Permission issue: Places API v2 might not be enabled for your API key");
                    console.log("💡 Solution: Check your Geoapify dashboard and ensure Places API is enabled");
                } else if (response.status === 400) {
                    console.log("📝 Parameter issue: Invalid request parameters");
                    console.log("💡 Check: categories, filter format, or other parameters");
                } else if (response.status === 429) {
                    console.log("⏰ Rate limit: Too many requests");
                }
            }
        } catch (error) {
            console.log("🌐 Places API v2 network error:", error);
        }

        return results;
    }, [userLocation, GEOAPIFY_API_KEY]);

    /**
     * Enhanced business search using reliable geocoding API
     */
    const searchWithPlacesAPI = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        const productCategories: { [key: string]: string[] } = {
            'heater': ['commercial.shopping_mall', 'commercial.marketplace', 'building.retail', 'commercial.hardware_store'],
            'paint': ['commercial.hardware_store', 'building.retail', 'commercial.marketplace'],
            'cement': ['commercial.hardware_store', 'building.retail', 'commercial.marketplace'],
            'hardware': ['commercial.hardware_store', 'building.retail', 'commercial.marketplace'],
            'electrical': ['commercial.electronics', 'building.retail', 'commercial.marketplace'],
            'rice': ['commercial.food', 'commercial.marketplace', 'building.retail'],
        };

        const searchProduct = searchQuery.toLowerCase();
        let categories = ['building.retail', 'commercial.marketplace']; // Default categories

        // Find specific categories for the product
        Object.entries(productCategories).forEach(([product, cats]) => {
            if (searchProduct.includes(product)) {
                categories = [...categories, ...cats];
            }
        });

        try {
            // STRATEGY 1: Try Places API v2 first (with detailed debugging)
            const placesResults = await tryPlacesAPIv2();
            if (placesResults.length > 0) {
                results.push(...placesResults);
                console.log("Using Places API v2 results:", placesResults.length);
            } else {
                console.log("Places API v2 failed, using geocoding fallback");
            }

            // STRATEGY 2: Use geocoding search with business-focused terms
            const businessSearchTerms = [
                `${searchQuery} store`,
                `${searchQuery} shop`,
                `${searchQuery} supplier`,
                `${searchQuery} dealer`,
                `${searchQuery} wholesale`,
            ];

            for (const searchTerm of businessSearchTerms) {
                try {
                    const params = new URLSearchParams({
                        text: searchTerm,
                        filter: `circle:${userLocation.lng},${userLocation.lat},20000`,
                        bias: `circle:${userLocation.lng},${userLocation.lat},3000`,
                        limit: "8",
                        apiKey: GEOAPIFY_API_KEY,
                    });

                    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.features) {
                            results.push(...data.features);
                        }
                    }
                } catch (error) {
                    console.log(`Business search failed for "${searchTerm}":`, error);
                }
            }
        } catch (error) {
            console.log("Business search failed:", error);
        }

        return results;
    }, [userLocation, searchQuery, GEOAPIFY_API_KEY]);

    /**
     * Search using text-based queries with expanded radius
     */
    const searchWithExpandedRadius = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        // More comprehensive search terms
        const expandedSearchTerms = [
            `${searchQuery} supplier Nepal`,
            `${searchQuery} dealer Kathmandu`,
            `${searchQuery} wholesale Nepal`,
            `${searchQuery} distributor`,
            `${searchQuery} store`,
            `${searchQuery} shop`,
            `${searchQuery} market`,
            `wholesale ${searchQuery}`,
            `${searchQuery} trading`,
        ];

        // Add location-specific terms
        const locationTerms = [
            `${searchQuery} Kathmandu`,
            `${searchQuery} Nepal`,
            `${searchQuery} Lalitpur`,
            `${searchQuery} Bhaktapur`,
        ];

        const allTerms = [...expandedSearchTerms, ...locationTerms];

        for (const searchText of allTerms.slice(0, 12)) {
            try {
                const params = new URLSearchParams({
                    text: searchText,
                    filter: `circle:${userLocation.lng},${userLocation.lat},35000`, // Expanded to 35km
                    bias: `circle:${userLocation.lng},${userLocation.lat},8000`,   // 8km bias
                    limit: "6",
                    apiKey: GEOAPIFY_API_KEY,
                });

                const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.features) {
                        results.push(...data.features);
                    }
                }
            } catch (error) {
                console.log(`Expanded search failed for "${searchText}":`, error);
            }
        }

        return results;
    }, [userLocation, searchQuery, GEOAPIFY_API_KEY]);

    /**
     * Search for suppliers using enhanced Geoapify search with better filtering
     */
    const searchWholesaleSuppliers = useCallback(async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a product name to search");
            return;
        }

        if (!userLocation) {
            toast.error("Please enable location access first");
            return;
        }

        if (!GEOAPIFY_API_KEY) {
            setError("Geoapify API key is not configured");
            return;
        }

        setIsSearching(true);
        setError(null);
        setPlaces([]);
        setSelectedPlace(null);

        try {
            let allResults: any[] = [];

            // STRATEGY 1: Use enhanced business-focused geocoding search
            const businessResults = await searchWithPlacesAPI();
            allResults.push(...businessResults);

            // STRATEGY 2: Use expanded radius text search
            const expandedResults = await searchWithExpandedRadius();
            allResults.push(...expandedResults);

            // STRATEGY 3: Original targeted search strategies
            const baseSearchStrategies = [
                `${searchQuery} supplier`,
                `${searchQuery} dealer`,
                `${searchQuery} distributor`,
                `${searchQuery} wholesale`,
                `${searchQuery} store`,
                `${searchQuery} shop`,
            ];

            // Add product-specific search terms
            const productSpecificTerms: { [key: string]: string[] } = {
                'heater': ['solar heater dealer Nepal', 'water heater supplier Kathmandu', 'heating equipment store', 'electrical appliances Nepal'],
                'paint': ['paint shop Nepal', 'color center Kathmandu', 'coating supplier', 'paint dealer Nepal'],
                'cement': ['cement supplier Nepal', 'building materials Kathmandu', 'construction materials dealer', 'cement store Nepal'],
                'rice': ['rice wholesale Nepal', 'grain supplier Kathmandu', 'food distributor Nepal', 'rice mill Nepal'],
                'hardware': ['hardware store Nepal', 'tools supplier Kathmandu', 'building supplies Nepal', 'hardware dealer Nepal'],
                'electrical': ['electrical supplies Nepal', 'electronics dealer Kathmandu', 'appliance store Nepal', 'electrical equipment Nepal'],
            };

            let searchStrategies = [...baseSearchStrategies];

            // Add specific terms if the search query matches known products
            Object.entries(productSpecificTerms).forEach(([product, terms]) => {
                if (searchQuery.toLowerCase().includes(product)) {
                    searchStrategies = [...searchStrategies, ...terms];
                }
            });

            // Try each search strategy
            for (const searchText of searchStrategies.slice(0, 8)) {
                try {
                    const params = new URLSearchParams({
                        text: searchText,
                        filter: `circle:${userLocation.lng},${userLocation.lat},25000`,
                        bias: `circle:${userLocation.lng},${userLocation.lat},5000`,
                        limit: "8",
                        apiKey: GEOAPIFY_API_KEY,
                    });

                    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.features) {
                            allResults.push(...data.features);
                        }
                    }
                } catch (error) {
                    console.log(`Search failed for "${searchText}":`, error);
                }
            }

            // Remove duplicates based on coordinates (within 50m radius)
            const uniqueResults = allResults.filter((result, index, arr) => {
                return !arr.slice(0, index).some(existing => {
                    const distance = calculateDistance(
                        result.properties.lat,
                        result.properties.lon,
                        existing.properties.lat,
                        existing.properties.lon
                    );
                    return distance < 50; // Consider places within 50m as duplicates
                });
            });

            const processedPlaces: PlaceResult[] = uniqueResults
                .map((feature: any) => {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        feature.properties.lat,
                        feature.properties.lon
                    );

                    const relevanceScore = calculateRelevanceScore(feature, searchQuery);

                    return {
                        id: feature.properties.place_id || `${feature.properties.lat}-${feature.properties.lon}`,
                        displayName: feature.properties.name || feature.properties.address_line1 || "Business",
                        formattedAddress: feature.properties.formatted,
                        phone: feature.properties.contact?.phone,
                        website: feature.properties.website,
                        email: feature.properties.contact?.email,
                        location: {
                            lat: feature.properties.lat,
                            lng: feature.properties.lon,
                        },
                        categories: feature.properties.categories || [],
                        distance,
                        relevanceScore,
                    };
                })
                // Filter out results with very low relevance scores
                .filter(place => (place.relevanceScore || 0) > 20) // Lowered threshold for more results
                // Sort by relevance score first, then by distance
                .sort((a, b) => {
                    if (Math.abs((a.relevanceScore || 0) - (b.relevanceScore || 0)) > 15) {
                        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
                    }
                    return (a.distance || 0) - (b.distance || 0);
                })
                // Take top 18 results for more comprehensive coverage
                .slice(0, 18);

            if (processedPlaces.length === 0) {
                // Fallback: Try a very broad search
                console.log("No results found, trying fallback search...");

                const fallbackTerms = [
                    `store ${searchQuery}`,
                    `shop ${searchQuery}`,
                    `${searchQuery}`,
                    `wholesale`,
                    `market`,
                    `trading`,
                ];

                for (const term of fallbackTerms) {
                    try {
                        const params = new URLSearchParams({
                            text: term,
                            filter: `circle:${userLocation.lng},${userLocation.lat},30000`, // 30km radius
                            bias: `circle:${userLocation.lng},${userLocation.lat},10000`,
                            limit: "10",
                            apiKey: GEOAPIFY_API_KEY,
                        });

                        const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);

                        if (response.ok) {
                            const data = await response.json();
                            if (data.features && data.features.length > 0) {
                                allResults.push(...data.features);
                                break; // Stop after first successful fallback
                            }
                        }
                    } catch (error) {
                        console.log(`Fallback search failed for "${term}":`, error);
                    }
                }

                // Reprocess with fallback results
                if (allResults.length > 0) {
                    const fallbackResults = allResults
                        .filter((result, index, arr) => {
                            return !arr.slice(0, index).some(existing => {
                                const distance = calculateDistance(
                                    result.properties.lat,
                                    result.properties.lon,
                                    existing.properties.lat,
                                    existing.properties.lon
                                );
                                return distance < 50;
                            });
                        })
                        .map((feature: any) => {
                            const distance = calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                feature.properties.lat,
                                feature.properties.lon
                            );

                            const relevanceScore = calculateRelevanceScore(feature, searchQuery);

                            return {
                                id: feature.properties.place_id || `${feature.properties.lat}-${feature.properties.lon}`,
                                displayName: feature.properties.name || feature.properties.address_line1 || "Business",
                                formattedAddress: feature.properties.formatted,
                                phone: feature.properties.contact?.phone,
                                website: feature.properties.website,
                                email: feature.properties.contact?.email,
                                location: {
                                    lat: feature.properties.lat,
                                    lng: feature.properties.lon,
                                },
                                categories: feature.properties.categories || [],
                                distance,
                                relevanceScore,
                            };
                        })
                        .filter(place => (place.relevanceScore || 0) > 5) // Very low threshold for fallback
                        .sort((a, b) => (a.distance || 0) - (b.distance || 0)) // Sort by distance for fallback
                        .slice(0, 10);

                    if (fallbackResults.length > 0) {
                        setPlaces(fallbackResults);
                        toast.info(`Found ${fallbackResults.length} general business(es) near you. Results may be less specific to "${searchQuery}".`);
                        return;
                    }
                }

                toast.info(`No suppliers found for "${searchQuery}". Try a broader term like "hardware", "electrical", or "store".`);
            } else {
                toast.success(`Found ${processedPlaces.length} supplier(s) for "${searchQuery}" within ${Math.max(...processedPlaces.map(p => p.distance || 0)) > 1000 ? Math.round(Math.max(...processedPlaces.map(p => p.distance || 0)) / 1000) + 'km' : Math.round(Math.max(...processedPlaces.map(p => p.distance || 0))) + 'm'}`);
            }

            setPlaces(processedPlaces);
        } catch (err) {
            console.error("Search error:", err);
            const errorMessage = err instanceof Error ? err.message : "Search failed";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, userLocation]);

    /**
     * Format distance for display
     */
    const formatDistance = useCallback((distance: number): string => {
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchWholesaleSuppliers();
    };
    /**
     * Default location initialization (Kathmandu)
     */
    useEffect(() => {
        if (!userLocation && !currentMapCenter) {
            // Default to Kathmandu
            setCurrentMapCenter({ lat: 27.7172, lng: 85.324 });
        }
    }, [userLocation, currentMapCenter]);

    // If no API key is configured, show setup instructions
    if (!hasApiKey) {
        return (
            <div className="space-y-6 pb-20 lg:pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Market Discovery</h1>
                    <p className="text-gray-500 mt-1">
                        Find wholesale suppliers near you
                    </p>
                </div>

                <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">Geoapify API Key Required</h3>
                                <p className="text-sm text-gray-600">
                                    To use Market Discovery, you need to configure a Geoapify API key (Free):
                                </p>
                                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
                                    <li>Go to <a href="https://myprojects.geoapify.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Geoapify MyProjects</a></li>
                                    <li>Sign up and create a new project</li>
                                    <li>Copy the <strong>API Key</strong></li>
                                    <li>Add it to your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> file:
                                        <pre className="mt-2 bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                                            VITE_GEOAPIFY_API_KEY=your_api_key_here
                                        </pre>
                                    </li>
                                    <li>Restart the development server</li>
                                </ol>
                                <Button
                                    onClick={() => setHasApiKey(true)}
                                    variant="outline"
                                    className="mt-2"
                                >
                                    I've configured the API key
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Market Discovery</h1>
                <p className="text-gray-500 mt-1">
                    Find wholesale suppliers and distributors near you
                </p>
            </div>

            {/* Search Section */}
            <Card className="border-0 shadow-sm" style={{ background: colors.primaryDark }}>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        {/* Search Input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Enter product name (e.g., Paint, Hardware, Cement, Rice)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white/95 border-0 h-12 text-base"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSearching || !userLocation}
                                className="h-12 px-6 bg-white text-teal-700 hover:bg-white/90"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Search"
                                )}
                            </Button>
                        </div>

                        {/* Location Button */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={getUserLocation}
                                disabled={isLoadingLocation}
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            >
                                {isLoadingLocation ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Navigation className="h-4 w-4 mr-2" />
                                )}
                                {userLocation ? "Update Location" : "Enable Location"}
                            </Button>

                            {userLocation && (
                                <Badge className="bg-white/20 text-white border-0">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Location enabled
                                </Badge>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-white/70">
                            💡 Tip: We search for suppliers, wholesalers, and distributors near you. Results are sorted by relevance and distance.
                        </p>

                        {/* API Diagnostics (Development Only) */}
                        {import.meta.env.DEV && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={testAPICapabilities}
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs"
                            >
                                Test API Capabilities
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Map and Results Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Map Container */}
                <Card className="border-0 shadow-sm lg:col-span-2 overflow-hidden h-[500px] relative z-0">
                    {currentMapCenter ? (
                        <MapContainer
                            center={[currentMapCenter.lat, currentMapCenter.lng]}
                            zoom={13}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapController
                                center={selectedPlace ? selectedPlace.location : currentMapCenter}
                                zoom={selectedPlace ? 15 : 13}
                            />

                            {/* User Location Marker */}
                            {userLocation && (
                                <Marker
                                    position={[userLocation.lat, userLocation.lng]}
                                    icon={UserLocationIcon}
                                >
                                    <Popup>
                                        <div className="font-semibold text-blue-600">📍 Your Location</div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Place Markers */}
                            {places.map((place) => (
                                <Marker
                                    key={place.id}
                                    position={[place.location.lat, place.location.lng]}
                                    icon={SupplierIcon}
                                    eventHandlers={{
                                        click: () => {
                                            handlePlaceSelect(place);
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="min-w-[200px]">
                                            <h3 className="font-semibold text-sm mb-1 text-green-700">{place.displayName}</h3>
                                            <p className="text-xs text-gray-600 mb-2">{place.formattedAddress}</p>
                                            {place.distance && (
                                                <p className="text-xs text-blue-600 mb-2 font-medium">
                                                    📏 {formatDistance(place.distance)} away
                                                </p>
                                            )}
                                            {place.phone && (
                                                <a href={`tel:${place.phone}`} className="block text-xs text-teal-600 mb-1 hover:underline">
                                                    📞 {place.phone}
                                                </a>
                                            )}
                                            {place.email && (
                                                <a href={`mailto:${place.email}`} className="block text-xs text-teal-600 mb-1 hover:underline">
                                                    ✉️ {place.email}
                                                </a>
                                            )}
                                            {place.website && (
                                                <a href={place.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-teal-600 hover:underline">
                                                    🌐 Visit Website
                                                </a>
                                            )}
                                            {place.rating && (
                                                <p className="text-xs text-yellow-600 mt-1">
                                                    ⭐ {place.rating}/5
                                                </p>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Route Line from User to Selected Supplier */}
                            {userLocation && selectedPlace && (
                                <>
                                    {routeCoordinates && routeCoordinates.length > 0 ? (
                                        // Show actual route if available
                                        <>
                                            {/* Background route line */}
                                            <Polyline
                                                positions={routeCoordinates}
                                                pathOptions={{
                                                    color: '#ffffff',
                                                    weight: 6,
                                                    opacity: 0.8,
                                                }}
                                            />
                                            {/* Main route line */}
                                            <Polyline
                                                positions={routeCoordinates}
                                                pathOptions={{
                                                    color: '#0d9488',
                                                    weight: 4,
                                                    opacity: 1,
                                                }}
                                            />
                                        </>
                                    ) : (
                                        // Fallback to straight line if route not available
                                        <>
                                            <Polyline
                                                positions={[
                                                    [userLocation.lat, userLocation.lng],
                                                    [selectedPlace.location.lat, selectedPlace.location.lng]
                                                ]}
                                                pathOptions={{
                                                    color: '#ffffff',
                                                    weight: 6,
                                                    opacity: 0.6,
                                                }}
                                            />
                                            <Polyline
                                                positions={[
                                                    [userLocation.lat, userLocation.lng],
                                                    [selectedPlace.location.lat, selectedPlace.location.lng]
                                                ]}
                                                pathOptions={{
                                                    color: '#0d9488',
                                                    weight: 3,
                                                    opacity: 1,
                                                    dashArray: '10, 10', // Dashed for straight line
                                                }}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-teal-600" />
                                <p>Loading map...</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Results List */}
                <Card className="border-0 shadow-sm h-[500px] flex flex-col">
                    <CardHeader className="shrink-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5" style={{ color: colors.primary }} />
                            Suppliers Found
                            {places.length > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                    {places.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto flex-1">
                        {isSearching ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-3 rounded-lg bg-gray-50">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-full mb-1" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : places.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Search className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">
                                    Search for a product to find suppliers near you
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Try: "Paint", "Hardware", "Cement", "Rice", etc.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {places.map((place, index) => (
                                    <div
                                        key={place.id}
                                        onClick={() => handlePlaceSelect(place)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedPlace?.id === place.id
                                            ? "bg-teal-50 ring-1 ring-teal-200"
                                            : "bg-gray-50 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                                {place.displayName}
                                                {selectedPlace?.id === place.id && (
                                                    <Navigation className="h-3 w-3 text-teal-600" />
                                                )}
                                                {loadingDetails === place.id && (
                                                    <Loader2 className="inline h-3 w-3 animate-spin text-teal-600" />
                                                )}
                                            </h4>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                {index < 3 && (
                                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                        #{index + 1}
                                                    </Badge>
                                                )}
                                                {place.distance && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {formatDistance(place.distance)}
                                                    </Badge>
                                                )}
                                                {/* Show relevance score in development */}
                                                {import.meta.env.DEV && place.relevanceScore && (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                        {place.relevanceScore}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2 truncate">
                                            {place.formattedAddress}
                                        </p>

                                        {/* Rating and Status */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {place.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                    <span className="text-xs text-gray-600">{place.rating}</span>
                                                </div>
                                            )}
                                            {place.businessStatus === 'OPERATIONAL' && (
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    Open
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Contact Information */}
                                        <div className="flex flex-wrap gap-2">
                                            {place.phone && (
                                                <a
                                                    href={`tel:${place.phone}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    Call
                                                </a>
                                            )}
                                            {place.email && (
                                                <a
                                                    href={`mailto:${place.email}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                                                >
                                                    <Mail className="h-3 w-3" />
                                                    Email
                                                </a>
                                            )}
                                            {place.website && (
                                                <a
                                                    href={place.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                                                >
                                                    <Globe className="h-3 w-3" />
                                                    Website
                                                </a>
                                            )}
                                        </div>

                                        {/* Opening Hours Preview */}
                                        {place.openingHours && place.openingHours.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{place.openingHours[0]}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Contact Information Panel */}
            {selectedPlace && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="h-5 w-5" style={{ color: colors.primary }} />
                                    {selectedPlace.displayName}
                                    {loadingDetails === selectedPlace.id && (
                                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                                    )}
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{selectedPlace.formattedAddress}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPlace(null)}
                                className="shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Distance and Route Information */}
                        <div className="flex items-center gap-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                            {selectedPlace.distance && (
                                <div className="flex items-center gap-2 text-sm text-teal-700">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{formatDistance(selectedPlace.distance)} away</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-teal-600">
                                {loadingRoute ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading route...</span>
                                    </>
                                ) : routeCoordinates ? (
                                    <>
                                        <Navigation className="h-4 w-4" />
                                        <span>Road route shown</span>
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="h-4 w-4" />
                                        <span>Direct line shown</span>
                                    </>
                                )}
                            </div>
                            {selectedPlace.rating && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 ml-auto">
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    <span>{selectedPlace.rating}/5</span>
                                </div>
                            )}
                            {selectedPlace.businessStatus === 'OPERATIONAL' && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                    Currently Open
                                </Badge>
                            )}
                        </div>

                        {/* Contact Information Grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {selectedPlace.phone && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Phone className="h-5 w-5 text-teal-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                                        <a
                                            href={`tel:${selectedPlace.phone}`}
                                            className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors"
                                        >
                                            {selectedPlace.phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedPlace.email && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="h-5 w-5 text-teal-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                        <a
                                            href={`mailto:${selectedPlace.email}`}
                                            className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors truncate block"
                                        >
                                            {selectedPlace.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedPlace.website && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg sm:col-span-2">
                                    <Globe className="h-5 w-5 text-teal-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Website</p>
                                        <a
                                            href={selectedPlace.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors truncate block"
                                        >
                                            {selectedPlace.website.replace(/^https?:\/\//, '')}
                                            <ExternalLink className="inline h-3 w-3 ml-1" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Opening Hours */}
                        {selectedPlace.openingHours && selectedPlace.openingHours.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <h4 className="text-sm font-medium text-gray-900">Opening Hours</h4>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="space-y-1">
                                        {selectedPlace.openingHours.slice(0, 7).map((hours, index) => (
                                            <p key={index} className="text-xs text-gray-600">
                                                {hours}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {selectedPlace.categories && selectedPlace.categories.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900">Categories</h4>
                                <div className="flex flex-wrap gap-1">
                                    {selectedPlace.categories.slice(0, 5).map((category, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            {selectedPlace.phone && (
                                <Button
                                    asChild
                                    className="flex-1"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    <a href={`tel:${selectedPlace.phone}`}>
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call Now
                                    </a>
                                </Button>
                            )}
                            {selectedPlace.website && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Visit Website
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Get Directions */}
                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.location.lat},${selectedPlace.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Navigation className="h-4 w-4 mr-2" />
                                Get Directions
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
