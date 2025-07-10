'use client';
import { supabase } from '@/lib/supabase' 
import Map from '@/components/Map';
import { useState } from 'react';
import { motion } from 'framer-motion';


interface Assessment {
  riskTier: string;
  explanation: string;
  recommendations: string[];
}

export default function HomePage() {
  const [solarData, setSolarData] = useState<any>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
const [currentLatLng, setCurrentLatLng] = useState<{ lat: number; lng: number } | null>(null);
 const handleLocationChange = async (lat: number, lng: number) => {
  setCurrentLatLng({ lat, lng }); 
  try {
    const res = await fetch(`/api/environment?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    const data = json.solarData;

    if (!data) {
      setSolarData(null);
      setAssessment(null);
      setError('No solar data available for this region.');
      return;
    }

    setSolarData(data);
    setLocation(json.location || "Unknown");
    setError(null);
  } catch (err) {
    console.error('Error fetching solar data:', err);
    setError('Failed to fetch solar data.');
  }
};

const assessRisk = async () => {
  if (!solarData) return;
  setLoading(true);
  setAssessment(null);

  try {
    const res = await fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location,
        pm25: 95,
        solar: solarData.solarPotential?.maxSunshineHoursPerYear ?? 0,
        avgTemp: solarData.solarPotential?.wholeRoofStats?.areaMeters2 ?? 0
      })
    });


      const json = await res.json();

      if (json.success) {
        const { riskTier, explanation, recommendations } = json.data;
        setAssessment({ riskTier, explanation, recommendations });
const { error } = await supabase.from('assessments').insert([
  {
    location,
    pm25: 95,
    solar: solarData.solarPotential?.maxSunshineHoursPerYear,
    risk_tier: riskTier,
    explanation,
    recommendations,
    created_at: new Date().toISOString()
  }
]);

if (error) {
  console.error('❌ Supabase insert failed:', error.message);
} else {
  console.log('✅ Assessment saved to Supabase');
}

      } else {
        console.warn("Raw AI output:", json.raw);
        setError("❌ AI could not parse a valid result.");
      }
    } catch (error) {
      console.error("Error during risk assessment:", error);
      setError("❌ Failed to fetch AI assessment.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <Map onLocationChange={handleLocationChange} />

      {solarData ? (
        <motion.div
          className="mt-4 p-6 bg-white rounded-xl shadow-md w-full max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-3 text-blue-800">🌞 Solar Data Summary</h2>
          <p><strong>📍 Postal Code:</strong> {solarData.postalCode}</p>
          <p><strong>🗓️ Imagery Date:</strong> {`${solarData.imageryDate?.year}-${solarData.imageryDate?.month}-${solarData.imageryDate?.day}`}</p>
          <p><strong>☀️ Max Sunshine Hours/Year:</strong> {solarData.solarPotential?.maxSunshineHoursPerYear?.toFixed(2)}</p>
          <p><strong>🌿 Carbon Offset (kg/MWh):</strong> {solarData.solarPotential?.carbonOffsetFactorKgPerMwh}</p>
          <p><strong>🌡️ Avg Annual Temp (°C):</strong> {solarData.solarPotential?.wholeRoofStats?.areaMeters2?.toFixed(2)}</p>

          <button
            onClick={assessRisk}
            disabled={loading}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            {loading ? 'Analyzing Risk...' : '🔍 Run AI Risk Assessment'}
          </button>

          {assessment && (
            <motion.div
              className="mt-6 p-5 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-2">🤖 AI Risk Assessment</h3>
              <p><strong>🛑 Risk Tier:</strong> {assessment.riskTier}</p>
              <p className="mt-2"><strong>🧠 Why?</strong> {assessment.explanation}</p>

              <div className="mt-3">
                <p className="font-semibold">📦 Recommended Insurance:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {assessment.recommendations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {error && (
            <p className="mt-4 text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
        </motion.div>
      ) : (
        <p className="mt-4 text-gray-500">Move around the map to fetch solar data.</p>
      )}
    </div>
  );
}
