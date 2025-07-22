"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { ScatterplotLayer, IconLayer } from "@deck.gl/layers";

type Place = {
  name: string;
  lat: number;
  lng: number;
  type?: string;
};

const libraries: ("places")[] = ["places"];

const defaultCenter = {
  lat: 21.2468,
  lng: 81.3503,
};

const containerStyle = {
  width: "100%",
  height: "400px", // Keep it fixed for now to avoid invisible map
};

interface Assessment {
  riskTier: string;
  explanation: string;
  recommendations: string[];
}

interface MapProps {
  onLocationChange: (lat: number, lng: number) => void;
  latLng?: { lat: number; lng: number };
  assessment: Assessment | null;
}

export default function Map({ onLocationChange, latLng, assessment }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState(latLng || defaultCenter);
  const [places, setPlaces] = useState<Place[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);

  // Get color & radius based on riskTier
  const getRiskVisuals = (tier: string | undefined) => {
    switch (tier) {
      case "Low":
        return { color: [0, 200, 83, 150], radius: 10000 };
      case "Medium":
        return { color: [255, 235, 59, 180], radius: 15000 };
      case "High":
        return { color: [244, 67, 54, 200], radius: 20000 };
      default:
        return { color: [128, 128, 128, 0], radius: 0 };
    }
  };

  // Fetch nearby places
  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&type=insurance_agency`);
      const json = await res.json();
      if (json.places) setPlaces(json.places);
    } catch (err) {
      console.error("Nearby places fetch failed", err);
      setPlaces([]);
    }
  }, []);

  // Set up overlays
  useEffect(() => {
    if (!mapRef.current) return;

    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({});
      overlayRef.current.setMap(mapRef.current);
    }

    const layers = [];

    if (assessment && markerPosition) {
      const { color, radius } = getRiskVisuals(assessment.riskTier);
      layers.push(
        new ScatterplotLayer({
          id: "risk-assessment-layer",
          data: [{ position: [markerPosition.lng, markerPosition.lat], color, radius }],
          getPosition: d => d.position,
          getFillColor: d => d.color,
          getRadius: d => d.radius,
          pickable: true,
          radiusUnits: "meters",
          transitions: {
            getFillColor: { duration: 400 },
            getRadius: { duration: 400 },
          },
        })
      );
    }

    if (places.length > 0) {
      layers.push(
        new IconLayer({
          id: "insurance-places-layer",
          data: places,
          getPosition: d => [d.lng, d.lat],
          getIcon: d => ({
            url: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
            width: 128,
            height: 128,
            anchorX: 64,
            anchorY: 128,
            mask: true,
          }),
          getSize: 30,
          getColor: [0, 0, 0, 255],
          pickable: true,
        })
      );
    }

    overlayRef.current.setProps({ layers });
  }, [assessment, markerPosition, places]);

  // Handle map clicks
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationChange(lat, lng);
      fetchNearbyPlaces(lat, lng);
    },
    [onLocationChange, fetchNearbyPlaces]
  );

  // Marker drag handler
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationChange(lat, lng);
      fetchNearbyPlaces(lat, lng);
    },
    [onLocationChange, fetchNearbyPlaces]
  );

  // On map load
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fetchNearbyPlaces(markerPosition.lat, markerPosition.lng);
    },
    [markerPosition, fetchNearbyPlaces]
  );

  // Sync marker position if prop changes
  useEffect(() => {
    if (latLng) setMarkerPosition(latLng);
  }, [latLng]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition}
      zoom={6}
      onClick={handleMapClick}
      onLoad={onMapLoad}
    >
      <Marker
        position={markerPosition}
        draggable
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  );
}
