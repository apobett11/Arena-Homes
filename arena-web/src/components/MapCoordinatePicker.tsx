"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, MapPin, Search } from "lucide-react";

// Types for the picker
interface MapCoordinatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (coords: { latitude: number; longitude: number; formattedAddress?: string }) => void;
    initialLatitude?: number;
    initialLongitude?: number;
}

// Global type for Google Maps
declare global {
    interface Window {
        google?: any;
        initGoogleMaps?: () => void;
    }
}

export function MapCoordinatePicker({
    isOpen,
    onClose,
    onConfirm,
    initialLatitude,
    initialLongitude,
}: MapCoordinatePickerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const searchBoxRef = useRef<any>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load Google Maps script
    useEffect(() => {
        if (!isOpen) return;

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setError("Google Maps API key not configured");
            setIsLoading(false);
            return;
        }

        // Check if script already loaded
        if (window.google?.maps) {
            setIsLoading(false);
            initMap();
            return;
        }

        // Check if script is already being loaded
        const existingScript = document.getElementById("google-maps-script");
        if (existingScript) {
            // Wait for it to load
            const checkLoaded = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkLoaded);
                    setIsLoading(false);
                    initMap();
                }
            }, 100);
            return;
        }

        // Load the script
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        window.initGoogleMaps = () => {
            setIsLoading(false);
            initMap();
        };

        script.onerror = () => {
            setError("Failed to load Google Maps");
            setIsLoading(false);
        };

        document.head.appendChild(script);

        return () => {
            delete window.initGoogleMaps;
        };
    }, [isOpen]);

    // Initialize map
    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        // Default coordinates (Nairobi, Kenya as fallback)
        const defaultLat = -1.2921;
        const defaultLng = 36.8219;

        // Use initial coordinates if provided and valid
        const centerLat = initialLatitude && initialLatitude !== 0 ? initialLatitude : defaultLat;
        const centerLng = initialLongitude && initialLongitude !== 0 ? initialLongitude : defaultLng;

        // Create map instance
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: initialLatitude && initialLatitude !== 0 ? 18 : 14,
            mapTypeId: "hybrid",
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            tilt: 45,
        });

        mapInstanceRef.current = map;

        // Initialize search box
        if (searchInputRef.current) {
            const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
            searchBoxRef.current = searchBox;

            // Bias search results to current map viewport
            map.addListener("bounds_changed", () => {
                searchBox.setBounds(map.getBounds());
            });

            // Handle place selection
            searchBox.addListener("places_changed", () => {
                const places = searchBox.getPlaces();
                if (!places || places.length === 0) return;

                const place = places[0];
                if (!place.geometry || !place.geometry.location) {
                    setError("No location data for this place");
                    return;
                }

                // Center map and place marker
                const location = place.geometry.location;
                map.setCenter(location);
                map.setZoom(18);

                placeMarker(location.lat(), location.lng());
            });
        }

        // Handle map clicks
        map.addListener("click", (e: any) => {
            if (e.latLng) {
                placeMarker(e.latLng.lat(), e.latLng.lng());
            }
        });

        // If initial coordinates provided, place marker there
        if (initialLatitude && initialLongitude && initialLatitude !== 0 && initialLongitude !== 0) {
            placeMarker(initialLatitude, initialLongitude);
        }
    }, [initialLatitude, initialLongitude]);

    // Place or move marker
    const placeMarker = useCallback((lat: number, lng: number) => {
        if (!mapInstanceRef.current || !window.google?.maps) return;

        setSelectedCoords({ lat, lng });
        setError(null);

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.map = null;
        }

        // Create new marker
        const { AdvancedMarkerElement } = window.google.maps.marker;
        const marker = new AdvancedMarkerElement({
            position: { lat, lng },
            map: mapInstanceRef.current,
            gmpDraggable: true,
            title: "Property Location",
        });

        markerRef.current = marker;

        // Handle marker drag
        marker.addEventListener("gmp-dragend", () => {
            const position = marker.position;
            if (position) {
                const newLat = typeof position.lat === "function" ? position.lat() : (position as any).lat;
                const newLng = typeof position.lng === "function" ? position.lng() : (position as any).lng;
                setSelectedCoords({ lat: newLat, lng: newLng });
            }
        });
    }, []);

    // Handle confirm
    const handleConfirm = useCallback(() => {
        if (!selectedCoords) return;

        // Reverse geocode to get address (optional)
        const geocoder = new window.google!.maps.Geocoder();
        geocoder.geocode(
            { location: { lat: selectedCoords.lat, lng: selectedCoords.lng } },
            (results: any, status: any) => {
                let formattedAddress: string | undefined;
                if (status === "OK" && results && results[0]) {
                    formattedAddress = results[0].formatted_address;
                }

                onConfirm({
                    latitude: selectedCoords.lat,
                    longitude: selectedCoords.lng,
                    formattedAddress,
                });
            }
        );
    }, [selectedCoords, onConfirm]);

    // Handle search input
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchBoxRef.current && searchInputRef.current?.value) {
            // Trigger the search box places_changed event
            const event = new Event("places_changed");
            // This will trigger the search box listener
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#0066FF]" />
                        Pick Property Location
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-700">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a location, property, or address..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                        />
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Map Container */}
                <div className="flex-1 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-slate-400">Loading Google Maps...</p>
                            </div>
                        </div>
                    ) : (
                        <div ref={mapRef} className="absolute inset-0" />
                    )}
                </div>

                {/* Footer with coordinates and actions */}
                <div className="p-4 border-t border-slate-700 bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            {selectedCoords ? (
                                <div className="text-slate-300">
                                    <span className="text-slate-500">Selected:</span>{" "}
                                    <span className="font-mono text-[#0066FF]">
                                        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-slate-500">Click on the map to place a pin</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedCoords}
                                className="px-4 py-2 bg-[#0066FF] hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-medium"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
