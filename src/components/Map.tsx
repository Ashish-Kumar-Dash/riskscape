'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCoords = {
  lat: 20.5937,  // India center
  lng: 78.9629,
};

export default function Map({
  onLocationChange,
  latLng, // ⬅️ New prop from parent
}: {
  onLocationChange: (lat: number, lng: number) => void;
  latLng?: { lat: number; lng: number };
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [markerPosition, setMarkerPosition] = useState(latLng || defaultCoords);

  // ✅ Sync with parent-provided latLng if it changes
  useEffect(() => {
    if (latLng) {
      setMarkerPosition(latLng);
    }
  }, [latLng]);

  // ✅ Call once on initial mount *only if latLng not provided*
  useEffect(() => {
    if (!latLng) {
      onLocationChange(defaultCoords.lat, defaultCoords.lng);
    }
  }, []);

  // ✅ On map click: move marker and update solar data
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  // ✅ On pin drag end: update position
  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition}
      zoom={6}
      onClick={handleMapClick}
    >
      <Marker
        position={markerPosition}
        draggable={true} 
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  );
}
