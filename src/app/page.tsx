'use client';

import Map from '@/components/Map';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [solarData, setSolarData] = useState<any>(null);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('Unknown');

  const handleLocationChange = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/environment?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      const data = json.solarData;

      if (!data) {
        setSolarData(null);
        setAiResult('');
        return;
      }

      setSolarData(data);
      setLocation(`${data.administrativeArea}, ${data.regionCode}`);
    } catch (err) {
      console.error('Error fetching solar data:', err);
    }
  };

  const assessRisk = async () => {
    if (!solarData) return;
    setLoading(true);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          pm25: 95,
          solar: solarData.solarPotential?.maxSunshineHoursPerYear ?? 0
        })
      });

      const json = await res.json();

      if (json.success) {
        const { riskTier, explanation, recommendations } = json.data;
        const formatted = `🌍 Risk Tier: ${riskTier}\n🧠 Reason: ${explanation}\n📦 Recommendations: ${recommendations.join(", ")}`;
        setAiResult(formatted);
        console.log("AI Risk Assessment:", formatted);
      } else {
        setAiResult("❌ AI could not parse a valid result.");
        console.warn("Raw AI output:", json.raw);
      }
    } catch (error) {
      console.error("Error during risk assessment:", error);
      setAiResult("❌ Failed to fetch AI assessment.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <Map onLocationChange={handleLocationChange} />

      {solarData ? (
        <div className="mt-4 p-4 bg-white rounded-lg shadow w-full max-w-xl">
          <h2 className="text-xl font-bold mb-2">🌞 Solar Data Summary</h2>
          <p><strong>Postal Code:</strong> {solarData.postalCode}</p>
          <p><strong>Imagery Date:</strong> {`${solarData.imageryDate?.year}-${solarData.imageryDate?.month}-${solarData.imageryDate?.day}`}</p>
          <p><strong>Max Sunshine Hours/Year:</strong> {solarData.solarPotential?.maxSunshineHoursPerYear?.toFixed(2)}</p>
          <p><strong>Carbon Offset Factor (kg/MWh):</strong> {solarData.solarPotential?.carbonOffsetFactorKgPerMwh}</p>
          <p><strong>Total Roof Area (m²):</strong> {solarData.solarPotential?.wholeRoofStats?.areaMeters2?.toFixed(2)}</p>

          <button
            onClick={assessRisk}
            disabled={loading}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            {loading ? 'Analyzing Risk...' : 'Run AI Risk Assessment'}
          </button>

          {aiResult && (
            <motion.div
              className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-800 rounded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-2">🤖 AI Recommendations</h3>
              <pre className="whitespace-pre-wrap">{aiResult}</pre>
            </motion.div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-gray-500">Move around the map to fetch solar data.</p>
      )}
    </div>
  );
}
