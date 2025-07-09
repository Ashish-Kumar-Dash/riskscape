'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCoords = {
  lat: 37.4450,
  lng: -122.1390,
};

export default function Map({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [center, setCenter] = useState(defaultCoords);
useEffect(() => {
  // Hardcoded test coordinates: Googleplex
  const testCoords = {
    lat: 37.4221,
    lng: -122.0841,
  };

  setCenter(testCoords);
  onLocationChange(testCoords.lat, testCoords.lng);
}, [onLocationChange]);


  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
      <Marker position={center} />
    </GoogleMap>
  );
}
