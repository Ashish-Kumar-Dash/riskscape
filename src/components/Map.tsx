"use client";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "500px",
};

type Props = {
  onLocationChange: (lat: number, lng: number) => void;
};

export default function Map({ onLocationChange }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [center, setCenter] = useState({ lat: 28.61, lng: 77.23 });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(coords);
        onLocationChange(coords.lat, coords.lng);
      },
      () => console.warn("Location access denied")
    );
  }, [onLocationChange]);

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
    />
  );
}
