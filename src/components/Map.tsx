"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { ScatterplotLayer } from "@deck.gl/layers";
import { AccessorFunction } from '@deck.gl/core';
type Place = {
  name: string;
  lat: number;
  lng: number;
};
const libraries: ('places')[] = ['places'];
const defaultCenter = {
  lat: 21.2468,
  lng: 81.3503, 
};
const containerStyle = {
  width: '100%',
  height: '400px',
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
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries, 
  });

const [markerPosition, setMarkerPosition] = useState(latLng || defaultCenter);
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const fetchRiskOverlay = async (lat: number, lng: number) => {
 const res = await fetch(`/api/risk-overlay?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    if (json?.overlay && mapRef.current) {
      const layer = new ScatterplotLayer({
        id: "dynamic-risk-layer",
        data: [json.overlay],
        getPosition: d => [d.lng, d.lat],
        getFillColor: d => d.color,
        getRadius: d => d.radius,
        pickable: false,
      });

      if (overlayRef.current) {
        overlayRef.current.setProps({ layers: [layer] });
      } else {
        overlayRef.current = new GoogleMapsOverlay({ layers: [layer] });
        overlayRef.current.setMap(mapRef.current);
      }
    }
  };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    onLocationChange(lat, lng);
    fetchRiskOverlay(lat, lng);
fetchNearbyPlaces(lat, lng);
  }, [onLocationChange]);
  const [places, setPlaces] = useState<Place[]>([]);


const fetchNearbyPlaces = async (lat: number, lng: number) => {
  const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&type=insurance_agency`);
  const json = await res.json();
  if (json.places) setPlaces(json.places);
};

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    onLocationChange(lat, lng);
    fetchRiskOverlay(lat, lng);
fetchNearbyPlaces(lat, lng);
  }, [onLocationChange]);

 const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (markerPosition) {
        fetchRiskOverlay(markerPosition.lat, markerPosition.lng);
        fetchNearbyPlaces(markerPosition.lat, markerPosition.lng);
    }
}, [markerPosition]); 
 useEffect(() => {
    if (latLng) {
      setMarkerPosition(latLng);
    }
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

    {/* 👇 Add this block here */}
    {places.map((p, i) => (
      <Marker
        key={i}
        position={{ lat: p.lat, lng: p.lng }}
        label={{ text: "🏦", color: "black", fontSize: "14px" }}
      />
    ))}
  </GoogleMap>
);

}
