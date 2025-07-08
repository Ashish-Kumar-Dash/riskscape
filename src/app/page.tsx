"use client";
import Map from "@/components/Map";
import RiskCard from "@/components/RiskCard";
import { useState } from "react";

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [data, setData] = useState<any>(null);

  async function fetchMetrics(lat: number, lng: number) {
    const res = await fetch(`/api/environment?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    setData(json);
  }

  return (
    <main className="min-h-screen p-8 bg-white">
      <h1 className="text-3xl font-bold mb-4">RiskScape</h1>

      <Map
        onLocationChange={(lat, lng) => {
          setLocation({ lat, lng });
          fetchMetrics(lat, lng);
        }}
      />

      {data && <RiskCard data={data} />}
    </main>
  );
}
