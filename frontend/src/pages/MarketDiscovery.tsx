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
import { BUSINESS_CATEGORIES } from "@/data/businessCategories";
import categoryPreferencesService from "@/services/categoryPreferences";
import { inventoryService } from "@/services/inventory";

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

    // New state for suggested searches based on user preferences
    const [suggestedSearchTerms, setSuggestedSearchTerms] = useState<string[]>([]);
    // State for store categories from actual inventory
    const [storeCategories, setStoreCategories] = useState<string[]>([]);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    /**
     * Get user's current location ...
     */

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
     * OPTIMIZED: Heavily prioritizes wholesale/B2B suppliers over retail
     */
    const calculateRelevanceScore = useCallback((place: any, searchTerm: string): number => {
        let score = 0;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const placeName = (place.properties.name || '').toLowerCase();
        const categories = (place.properties.categories || []).join(' ').toLowerCase();
        const address = (place.properties.formatted || '').toLowerCase();

        // =============================================================================
        // WHOLESALE/B2B PRIORITY SCORING - These get the highest scores
        // =============================================================================
        const wholesaleKeywords = [
            'wholesale', 'wholesaler', 'distributor', 'supplier', 'trading', 'trader',
            'import', 'importer', 'export', 'exporter', 'b2b', 'bulk', 'enterprise',
            'industries', 'industrial', 'manufacturers', 'manufacturing', 'factory',
            'warehouse', 'depot', 'stockist', 'agency', 'enterprises', 'corporation'
        ];

        wholesaleKeywords.forEach(keyword => {
            if (placeName.includes(keyword)) {
                score += 300; // Massive bonus for wholesale-related names
            }
            if (categories.includes(keyword)) {
                score += 150;
            }
        });

        // Extra bonus for combined wholesale + product match
        if (wholesaleKeywords.some(kw => placeName.includes(kw)) && placeName.includes(lowerSearchTerm)) {
            score += 200; // Bonus for wholesale + product match
        }

        // =============================================================================
        // PRODUCT MATCHING
        // =============================================================================
        // Exact product match in name
        if (placeName.includes(lowerSearchTerm)) {
            score += 150;
        }

        // Partial product match in name
        const searchWords = lowerSearchTerm.split(' ');
        searchWords.forEach(word => {
            if (word.length > 2 && placeName.includes(word)) {
                score += 50;
            }
        });

        // Product-specific business type matching
        const productBusinessTypes: { [key: string]: string[] } = {
            'heater': ['solar', 'heating', 'water heater', 'electric heater', 'gas heater', 'boiler'],
            'paint': ['paint', 'color', 'coating', 'varnish', 'primer'],
            'cement': ['cement', 'concrete', 'mortar', 'building material'],
            'rice': ['rice', 'grain', 'food', 'grocery', 'cereal'],
            'hardware': ['hardware', 'tools', 'nuts', 'bolts', 'screws'],
            'electrical': ['electrical', 'electronics', 'wire', 'cable', 'switch'],
            'plumbing': ['plumbing', 'pipe', 'faucet', 'toilet', 'sink'],
        };

        Object.entries(productBusinessTypes).forEach(([product, types]) => {
            if (lowerSearchTerm.includes(product)) {
                types.forEach(type => {
                    if (placeName.includes(type) || categories.includes(type)) {
                        score += 80;
                    }
                });
            }
        });

        // =============================================================================
        // RETAIL/CONSUMER PENALTIES - Heavily penalize non-wholesale
        // =============================================================================
        const retailPenaltyKeywords = [
            'boutique', 'retail', 'consumer', 'personal', 'fashion', 'clothing store',
            'grocery store', 'supermarket', 'mart', 'minimart', 'convenience',
            'outlet', 'showroom'
        ];

        retailPenaltyKeywords.forEach(keyword => {
            if (placeName.includes(keyword) || categories.includes(keyword)) {
                score -= 100; // Penalty for retail-focused businesses
            }
        });

        // =============================================================================
        // UNRELATED BUSINESS PENALTIES
        // =============================================================================
        const unrelatedKeywords = [
            'restaurant', 'hotel', 'hospital', 'school', 'bank', 'atm',
            'pharmacy', 'medical', 'clinic', 'beauty', 'salon', 'spa',
            'travel', 'tour', 'insurance', 'real estate', 'lawyer', 'gym', 'fitness',
            'cafe', 'bakery', 'bar', 'pub', 'cinema', 'theater', 'museum'
        ];

        unrelatedKeywords.forEach(keyword => {
            if (placeName.includes(keyword) || categories.includes(keyword)) {
                score -= 200; // Heavy penalty for unrelated businesses
            }
        });

        // Penalize car dealers unless searching for automotive products
        if (!lowerSearchTerm.includes('car') && !lowerSearchTerm.includes('auto') && !lowerSearchTerm.includes('vehicle')) {
            if (placeName.includes('dealer') && (placeName.includes('car') || placeName.includes('auto') || placeName.includes('honda') || placeName.includes('toyota') || placeName.includes('subaru'))) {
                score -= 300;
            }
        }

        // Penalize telecom/mobile distributors unless searching for electronics
        if (!lowerSearchTerm.includes('mobile') && !lowerSearchTerm.includes('phone') && !lowerSearchTerm.includes('telecom')) {
            if (placeName.includes('ncell') || placeName.includes('ntc') || placeName.includes('mobile') || placeName.includes('telecom')) {
                score -= 200;
            }
        }

        // Product-specific penalties for unrelated products
        const productSpecificPenalties: { [key: string]: string[] } = {
            'heater': ['paint', 'cement', 'rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'furniture'],
            'paint': ['heater', 'heating', 'rice', 'grain', 'food', 'grocery', 'textile', 'clothing'],
            'cement': ['heater', 'heating', 'paint', 'rice', 'grain', 'food', 'grocery', 'textile'],
            'rice': ['heater', 'heating', 'paint', 'cement', 'hardware', 'electrical', 'plumbing'],
            'hardware': ['rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'beauty'],
            'electrical': ['rice', 'grain', 'food', 'grocery', 'textile', 'clothing', 'paint'],
        };

        Object.entries(productSpecificPenalties).forEach(([product, penaltyTerms]) => {
            if (lowerSearchTerm.includes(product)) {
                penaltyTerms.forEach(term => {
                    if (placeName.includes(term) || categories.includes(term)) {
                        score -= 150;
                    }
                });
            }
        });

        return Math.max(0, score); // Ensure score doesn't go negative
    }, []);

    /**
     * Test API key capabilities and provide diagnostics
     */
    const testAPICapabilities = useCallback(async () => {
        if (!GEOAPIFY_API_KEY) {
            return;
        }

        // Test basic geocoding
        try {
            const testParams = new URLSearchParams({
                text: "Kathmandu Nepal",
                limit: "1",
                apiKey: GEOAPIFY_API_KEY,
            });

            await fetch(`https://api.geoapify.com/v1/geocode/search?${testParams.toString()}`);
        } catch (error) {
        }

        // Test Places API v2
        try {
            const placesParams = new URLSearchParams({
                categories: "commercial.shopping_mall",
                filter: "circle:85.3240,27.7172,1000",
                limit: "1",
                apiKey: GEOAPIFY_API_KEY,
            });

            await fetch(`https://api.geoapify.com/v2/places?${placesParams.toString()}`);
        } catch (error) {
        }

        // Test Routing API
        try {
            const routeParams = new URLSearchParams({
                waypoints: "27.7172,85.3240|27.7000,85.3000",
                mode: "drive",
                apiKey: GEOAPIFY_API_KEY,
            });

            await fetch(`https://api.geoapify.com/v1/routing?${routeParams.toString()}`);
        } catch (error) {
        }
    }, [GEOAPIFY_API_KEY]);

    /**
     * Try Places API v2 with correct parameters (if API key supports it)
     */
    const tryPlacesAPIv2 = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        try {
            // Use only well-known, valid categories supported by Geoapify
            // We stick to the most common/reliable ones to avoid 400 errors
            const validCategories = [
                'commercial.shopping_mall',
                'commercial.marketplace',
                'commercial.supermarket',
                'commercial.department_store'
            ];

            const params = new URLSearchParams({
                categories: validCategories.join(','),
                filter: `circle:${userLocation.lng},${userLocation.lat},15000`, // 15km radius
                limit: "20",
                apiKey: GEOAPIFY_API_KEY,
            });

            const response = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    results.push(...data.features);
                }
            }
        } catch (error) {
        }

        return results;
    }, [userLocation, GEOAPIFY_API_KEY]);

    /**
     * Enhanced business search using reliable geocoding API
     */
    const searchWithPlacesAPI = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        // Map product types to supported Geoapify Place Categories
        // We only use highly reliable categories that won't trigger 400 errors
        const productCategories: { [key: string]: string[] } = {
            'heater': ['commercial.shopping_mall', 'commercial.department_store'],
            'paint': ['commercial.shopping_mall', 'commercial.marketplace'],
            'cement': ['commercial.shopping_mall', 'commercial.marketplace'],
            'hardware': ['commercial.shopping_mall', 'commercial.marketplace'],
            'electrical': ['commercial.shopping_mall', 'commercial.department_store'],
            'rice': ['commercial.supermarket', 'commercial.marketplace'],
            'clothes': ['commercial.shopping_mall', 'commercial.department_store'],
            'book': ['commercial.shopping_mall', 'commercial.department_store'],
        };

        const searchProduct = searchQuery.toLowerCase();
        let categories: string[] = [];

        // Find specific categories for the product
        Object.entries(productCategories).forEach(([product, cats]) => {
            if (searchProduct.includes(product)) {
                categories = [...categories, ...cats];
            }
        });

        // OPTIMIZATION: If no specific category matched, DO NOT default to Shopping Mall.
        // Instead, skip the Places API strategy and rely on the Text Search (Strategy 2).
        // This ensures "Beverages" or other unknown terms don't get irrelevant "Shopping Mall" results.
        if (categories.length === 0) {
            return [];
        }

        // Deduplicate categories
        categories = [...new Set(categories)];


        try {
            // STRATEGY 1: Try Places API v2 first (with detailed debugging)
            const placesResults = await tryPlacesAPIv2();
            if (placesResults.length > 0) {
                results.push(...placesResults);
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
                }
            }
        } catch (error) {
        }

        return results;
    }, [userLocation, searchQuery, GEOAPIFY_API_KEY]);

    /**
     * Search using text-based queries with expanded radius
     * OPTIMIZED: Prioritizes wholesale/B2B search terms
     */
    const searchWithExpandedRadius = useCallback(async (): Promise<any[]> => {
        const results: any[] = [];

        // WHOLESALE-FOCUSED search terms - prioritize B2B suppliers
        const expandedSearchTerms = [
            `${searchQuery} wholesale`,
            `${searchQuery} wholesaler`,
            `${searchQuery} distributor`,
            `${searchQuery} supplier`,
            `wholesale ${searchQuery}`,
            `${searchQuery} trading`,
            `${searchQuery} trader`,
            `${searchQuery} importer`,
            `${searchQuery} industries`,
            `${searchQuery} enterprise`,
            `bulk ${searchQuery}`,
        ];

        const allTerms = expandedSearchTerms;

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
            }
        }

        return results;
    }, [userLocation, searchQuery, GEOAPIFY_API_KEY]);

    /**
     * Search for suppliers using ONLY Serper Places API
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

        setIsSearching(true);
        setError(null);
        setPlaces([]);
        setSelectedPlace(null);

        try {
            // Use Serper API through our backend
            const discoveredSuppliers = await inventoryService.findSuppliers(
                searchQuery,
                "Nepal" // Default location
            );

            if (discoveredSuppliers.length === 0) {
                toast.info("No suppliers found. Try different keywords.");
                setPlaces([]);
                return;
            }

            // Convert DiscoveredSupplier to PlaceResult format
            const processedPlaces: PlaceResult[] = discoveredSuppliers.map((supplier) => {
                const distance = userLocation
                    ? calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        supplier.latitude,
                        supplier.longitude
                    )
                    : 0;

                return {
                    id: supplier.place_id || `${supplier.latitude}-${supplier.longitude}`,
                    displayName: supplier.name,
                    formattedAddress: supplier.address,
                    phone: supplier.phone,
                    website: supplier.website,
                    email: "",
                    location: {
                        lat: supplier.latitude,
                        lng: supplier.longitude,
                    },
                    categories: supplier.category ? [supplier.category] : [],
                    distance,
                    relevanceScore: supplier.rating ? supplier.rating * 20 : 50,
                    rating: supplier.rating,
                    openingHours: [],
                    businessStatus: "OPERATIONAL",
                };
            });

            // Sort by rating and distance
            processedPlaces.sort((a, b) => {
                const ratingDiff = (b.rating || 0) - (a.rating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                return (a.distance || 0) - (b.distance || 0);
            });

            setPlaces(processedPlaces);
            toast.success(`Found ${processedPlaces.length} suppliers!`);
        } catch (error: any) {
            console.error("Search error:", error);
            const errorMessage = error?.response?.data?.message || "Failed to search suppliers";
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

    const openGoogleMaps = () => {
        if (!userLocation && !searchQuery) return;

        const query = encodeURIComponent(searchQuery || "suppliers");
        let url = `https://www.google.com/maps/search/${query}`;

        if (userLocation) {
            url += `/@${userLocation.lat},${userLocation.lng},13z`;
        }

        window.open(url, '_blank');
    };

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

    /**
     * Load user's store categories from inventory
     */
    useEffect(() => {
        const fetchStoreCategories = async () => {
            try {
                const categories = await inventoryService.getCategories();
                if (categories && categories.length > 0) {
                    setStoreCategories(categories.map(c => c.name));
                }
            } catch (error) {
                console.error("Failed to fetch store categories:", error);
            }
        };
        fetchStoreCategories();
    }, []);

    /**
     * Load user category preferences for suggestions (fallback)
     */
    useEffect(() => {
        const prefs = categoryPreferencesService.retrieve();
        if (prefs) {
            const terms: string[] = [];

            // Add main business category name if available
            if (prefs.business_category) {
                const mainCat = BUSINESS_CATEGORIES.find(c => c.id === prefs.business_category);
                if (mainCat) {
                    terms.push(mainCat.name);
                } else if (prefs.business_category === 'other' && (prefs as any).custom_category) {
                    terms.push((prefs as any).custom_category);
                }
            }

            // Add selected subcategories
            if (prefs.product_subcategories && prefs.product_subcategories.length > 0) {
                const allSubs = BUSINESS_CATEGORIES.flatMap(cat => cat.subcategories);
                const selectedSubs = allSubs.filter(sub => prefs.product_subcategories.includes(sub.id));
                terms.push(...selectedSubs.map(s => s.name));
            }

            // Limit to reasonable number of suggestions
            setSuggestedSearchTerms([...new Set(terms)].slice(0, 8));
        }
    }, []);

    const handleSuggestionClick = (term: string) => {
        setSearchQuery(term);
        // We can't immediately call searchWholesaleSuppliers here because searchQuery state update is async.
        // But since we can't easily change searchWholesaleSuppliers to accept an argument without prop drilling issues in useCallback dependencies,
        // we'll just set the query. The user can click search, or we could add a purely functional useEffect to trigger search on query change?
        // Better: update searchWholesaleSuppliers to optionally take a query string.

        // Actually, let's just trigger a search with the term directly passed to a helper, or wait for next render?
        // Simplest: Just set query, user clicks Search. Or use a timeout.
        // Let's try to update searchWholesaleSuppliers signature in next step if needed, but for now simple set is okay.
        // Wait, better UX is to search immediately.
        // I will implement a separate trigger or modify searchWholesaleSuppliers in a moment.
        // For now, let's just set the search query and let the user click, OR use a small timeout hack which is common in React for this pattern without massive refactor.
        // Actually, I'll modify searchWholesaleSuppliers to be more flexible in a subsequent edit if needed.
        // For now, let's just set the input value.
    };

    // Helper to trigger search with specific term
    const triggerSearch = (term: string) => {
        setSearchQuery(term);
        // Use a timeout to allow state to update, then trigger search
        // This is a bit hacky but avoids deep refactoring of the complex search function right now
        setTimeout(() => {
            const searchButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (searchButton) searchButton.click();
        }, 100);
    };

    // If no API key is configured, show setup instructions
    if (!hasApiKey) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Discovery</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Market Discovery</h1>
                    <p className="text-[#888888] text-sm mt-1">
                        Find wholesale suppliers near you
                    </p>
                </div>

                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] border-l-[3px] border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-white">Geoapify API Key Required</h3>
                                <p className="text-sm text-[#888888]">
                                    To use Market Discovery, you need to configure a Geoapify API key (Free):
                                </p>
                                <ol className="text-sm text-[#888888] list-decimal list-inside space-y-2">
                                    <li>Go to <a href="https://myprojects.geoapify.com/" target="_blank" rel="noopener noreferrer" className="text-[#DA291C] hover:underline">Geoapify MyProjects</a></li>
                                    <li>Sign up and create a new project</li>
                                    <li>Copy the <strong>API Key</strong></li>
                                    <li>Add it to your <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded-[2px] text-xs text-[#888888]">.env</code> file:
                                        <pre className="mt-2 bg-[#111111] p-3 rounded-[2px] text-xs overflow-x-auto text-[#888888] border border-[#1A1A1A]">
                                            VITE_GEOAPIFY_API_KEY=your_api_key_here
                                        </pre>
                                    </li>
                                    <li>Restart the development server</li>
                                </ol>
                                <Button
                                    onClick={() => setHasApiKey(true)}
                                    variant="outline"
                                    className="mt-2 border-[#1A1A1A] text-[#888888] rounded-[2px]"
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
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div data-tour="market-discovery-header">
                <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Discovery</p>
                <h1 className="text-[24px] font-bold text-white tracking-tight">Market Discovery</h1>
                <p className="text-[#888888] text-sm mt-1">
                    Find wholesale suppliers and distributors near you
                </p>
            </div>

            {/* Search Section */}
            <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]" data-tour="market-discovery-search">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        {/* Search Input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#555555]" />
                                <Input
                                    type="text"
                                    placeholder="Enter product name (e.g., Paint, Hardware, Cement, Rice)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-[#111111] border-[#1A1A1A] h-12 text-[13px] text-white rounded-[2px] focus:border-[#DA291C] placeholder:text-[#555555]"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSearching || !userLocation}
                                className="h-12 px-6 bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest rounded-[2px]"
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
                                className="border-[#1A1A1A] text-[#888888] rounded-[2px]"
                            >
                                {isLoadingLocation ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Navigation className="h-4 w-4 mr-2" />
                                )}
                                {userLocation ? "Update Location" : "Enable Location"}
                            </Button>

                            {userLocation && (
                                <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 rounded-[2px]">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Location enabled
                                </Badge>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-[#888888]">
                            Tip: We search for suppliers, wholesalers, and distributors near you. Results are sorted by relevance and distance.
                        </p>

                        {/* API Diagnostics (Development Only) - Removed as per request */}
                    </form>
                    {/* Store Product Categories - Primary */}
                    {storeCategories.length > 0 && (
                        <div className="pt-2 border-t border-[#1A1A1A]">
                            <p className="text-xs text-[#888888] mb-2">Search by your product categories:</p>
                            <div className="flex flex-wrap gap-2">
                                {storeCategories.map((category, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-[#DA291C]/10 hover:bg-[#DA291C]/20 text-[#DA291C] border-[#DA291C]/20 cursor-pointer transition-colors rounded-[2px]"
                                        onClick={() => triggerSearch(category)}
                                    >
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Suggested Search Terms - Secondary fallback */}
                    {storeCategories.length === 0 && suggestedSearchTerms.length > 0 && (
                        <div className="pt-2 border-t border-[#1A1A1A]">
                            <p className="text-xs text-[#888888] mb-2">Suggested based on your business:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedSearchTerms.map((term, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-[#222222] hover:bg-[#333333] text-[#888888] border-[#1A1A1A] cursor-pointer transition-colors rounded-[2px]"
                                        onClick={() => triggerSearch(term)}
                                    >
                                        {term}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] border-l-[3px] border-l-red-500">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto text-[#888888] rounded-[2px]"
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
                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] lg:col-span-2 overflow-hidden h-[500px] relative z-0" data-tour="market-discovery-map">
                    {currentMapCenter ? (
                        <MapContainer
                            center={[currentMapCenter.lat, currentMapCenter.lng]}
                            zoom={13}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
                                        <div className="font-semibold text-blue-600">Your Location</div>
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
                                                    {formatDistance(place.distance)} away
                                                </p>
                                            )}
                                            {place.phone && (
                                                <a href={`tel:${place.phone}`} className="block text-xs text-[#DA291C] mb-1 hover:underline">
                                                    {place.phone}
                                                </a>
                                            )}
                                            {place.email && (
                                                <a href={`mailto:${place.email}`} className="block text-xs text-[#DA291C] mb-1 hover:underline">
                                                    {place.email}
                                                </a>
                                            )}
                                            {place.website && (
                                                <a href={place.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#DA291C] hover:underline">
                                                    Visit Website
                                                </a>
                                            )}
                                            {place.rating && (
                                                <p className="text-xs text-yellow-600 mt-1">
                                                    {place.rating}/5
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
                                                    color: '#DA291C',
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
                                                    color: '#DA291C',
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
                        <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                            <div className="text-center text-[#888888]">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#DA291C]" />
                                <p>Loading map...</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Results List */}
                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px] h-[500px] flex flex-col">
                    <CardHeader className="shrink-0">
                        <CardTitle className="text-[14px] font-bold text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[#DA291C]" />
                            Suppliers Found
                            {places.length > 0 && (
                                <Badge variant="secondary" className="ml-auto bg-[#DA291C]/10 text-[#DA291C] border-[#DA291C]/20 rounded-[2px]">
                                    {places.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto flex-1">
                        {isSearching ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-3 rounded-[2px] bg-[#111111]">
                                        <Skeleton className="h-5 w-3/4 mb-2 bg-[#1A1A1A]" />
                                        <Skeleton className="h-4 w-full mb-1 bg-[#1A1A1A]" />
                                        <Skeleton className="h-4 w-1/2 bg-[#1A1A1A]" />
                                    </div>
                                ))}
                            </div>
                        ) : places.length === 0 ? (
                            <div className="text-center py-8 text-[#888888]">
                                <Search className="h-10 w-10 mx-auto mb-3 text-[#303030]" />
                                <p className="text-sm font-medium text-white mb-1">
                                    {searchQuery ? "No suppliers found" : "Search for suppliers"}
                                </p>
                                <p className="text-xs text-[#555555] mb-4">
                                    {searchQuery
                                        ? `We couldn't find any "${searchQuery}" suppliers nearby.`
                                        : 'Enter a product name like "Paint", "Hardware", or "Rice" details.'}
                                </p>

                                {searchQuery && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openGoogleMaps}
                                        className="border-[#1A1A1A] text-[#888888] rounded-[2px]"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-2" />
                                        Search on Google Maps
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {places.map((place, index) => (
                                    <div
                                        key={place.id}
                                        onClick={() => handlePlaceSelect(place)}
                                        className={`p-3 rounded-[2px] cursor-pointer transition-colors ${selectedPlace?.id === place.id
                                            ? "bg-[#DA291C]/10 ring-1 ring-[#DA291C]/30"
                                            : "bg-[#111111] hover:bg-[#1A1A1A]"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-medium text-white text-sm flex items-center gap-2">
                                                {place.displayName}
                                                {selectedPlace?.id === place.id && (
                                                    <Navigation className="h-3 w-3 text-[#DA291C]" />
                                                )}
                                                {loadingDetails === place.id && (
                                                    <Loader2 className="inline h-3 w-3 animate-spin text-[#DA291C]" />
                                                )}
                                            </h4>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                {index < 3 && (
                                                    <Badge variant="secondary" className="text-[10px] bg-[#DA291C]/10 text-[#DA291C] border-[#DA291C]/20 rounded-[2px]">
                                                        #{index + 1}
                                                    </Badge>
                                                )}
                                                {place.distance && (
                                                    <Badge variant="outline" className="text-[10px] border-[#1A1A1A] text-[#888888] rounded-[2px]">
                                                        {formatDistance(place.distance)}
                                                    </Badge>
                                                )}
                                                {/* Show relevance score in development */}
                                                {import.meta.env.DEV && place.relevanceScore && (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-[2px]">
                                                        {place.relevanceScore}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#666666] mb-2 truncate">
                                            {place.formattedAddress}
                                        </p>

                                        {/* Rating and Status */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {place.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                    <span className="text-xs text-[#888888]">{place.rating}</span>
                                                </div>
                                            )}
                                            {place.businessStatus === 'OPERATIONAL' && (
                                                <Badge variant="outline" className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 rounded-[2px]">
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
                                                    className="inline-flex items-center gap-1 text-xs text-[#DA291C] hover:text-[#B01E0A]"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    Call
                                                </a>
                                            )}
                                            {place.email && (
                                                <a
                                                    href={`mailto:${place.email}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-[#DA291C] hover:text-[#B01E0A]"
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
                                                    className="inline-flex items-center gap-1 text-xs text-[#DA291C] hover:text-[#B01E0A]"
                                                >
                                                    <Globe className="h-3 w-3" />
                                                    Website
                                                </a>
                                            )}
                                        </div>

                                        {/* Opening Hours Preview */}
                                        {place.openingHours && place.openingHours.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-[#1A1A1A]">
                                                <div className="flex items-center gap-1 text-xs text-[#888888]">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{place.openingHours[0]}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-[#1A1A1A] flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={openGoogleMaps}
                                        className="text-[#888888] hover:text-[#DA291C] text-[10px] rounded-[2px]"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Don't see what you're looking for? Search Google Maps
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Contact Information Panel */}
            {selectedPlace && (
                <Card className="border border-[#1A1A1A] bg-[#000000] rounded-[2px]">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-[14px] font-bold text-white flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-[#DA291C]" />
                                    {selectedPlace.displayName}
                                    {loadingDetails === selectedPlace.id && (
                                        <Loader2 className="h-4 w-4 animate-spin text-[#DA291C]" />
                                    )}
                                </CardTitle>
                                <p className="text-sm text-[#888888] mt-1">{selectedPlace.formattedAddress}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPlace(null)}
                                className="shrink-0 text-[#888888] rounded-[2px]"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Distance and Route Information */}
                        <div className="flex items-center gap-4 p-3 bg-[#111111] rounded-[2px] border border-[#1A1A1A]">
                            {selectedPlace.distance && (
                                <div className="flex items-center gap-2 text-sm text-[#DA291C]">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{formatDistance(selectedPlace.distance)} away</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-[#888888]">
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
                                <div className="flex items-center gap-1 text-sm text-[#888888] ml-auto">
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    <span>{selectedPlace.rating}/5</span>
                                </div>
                            )}
                            {selectedPlace.businessStatus === 'OPERATIONAL' && (
                                <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 rounded-[2px]">
                                    Currently Open
                                </Badge>
                            )}
                        </div>

                        {/* Contact Information Grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {selectedPlace.phone && (
                                <div className="flex items-center gap-3 p-3 bg-[#111111] rounded-[2px] border border-[#1A1A1A]">
                                    <Phone className="h-5 w-5 text-[#DA291C] shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-[#666666] uppercase tracking-wide">Phone</p>
                                        <a
                                            href={`tel:${selectedPlace.phone}`}
                                            className="text-sm font-medium text-white hover:text-[#DA291C] transition-colors"
                                        >
                                            {selectedPlace.phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedPlace.email && (
                                <div className="flex items-center gap-3 p-3 bg-[#111111] rounded-[2px] border border-[#1A1A1A]">
                                    <Mail className="h-5 w-5 text-[#DA291C] shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-[#666666] uppercase tracking-wide">Email</p>
                                        <a
                                            href={`mailto:${selectedPlace.email}`}
                                            className="text-sm font-medium text-white hover:text-[#DA291C] transition-colors truncate block"
                                        >
                                            {selectedPlace.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedPlace.website && (
                                <div className="flex items-center gap-3 p-3 bg-[#111111] rounded-[2px] border border-[#1A1A1A] sm:col-span-2">
                                    <Globe className="h-5 w-5 text-[#DA291C] shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-[#666666] uppercase tracking-wide">Website</p>
                                        <a
                                            href={selectedPlace.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-white hover:text-[#DA291C] transition-colors truncate block"
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
                                    <Clock className="h-4 w-4 text-[#666666]" />
                                    <h4 className="text-sm font-medium text-white">Opening Hours</h4>
                                </div>
                                <div className="bg-[#111111] rounded-[2px] p-3 border border-[#1A1A1A]">
                                    <div className="space-y-1">
                                        {selectedPlace.openingHours.slice(0, 7).map((hours, index) => (
                                            <p key={index} className="text-xs text-[#888888]">
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
                                <h4 className="text-sm font-medium text-white">Categories</h4>
                                <div className="flex flex-wrap gap-1">
                                    {selectedPlace.categories.slice(0, 5).map((category, index) => (
                                        <Badge key={index} variant="outline" className="text-[10px] border-[#1A1A1A] text-[#888888] rounded-[2px]">
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
                                    className="flex-1 bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest rounded-[2px]"
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
                                    className="flex-1 border-[#1A1A1A] text-[#888888] rounded-[2px]"
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
                            className="w-full border-[#1A1A1A] text-[#888888] rounded-[2px]"
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
