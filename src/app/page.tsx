'use client';

import { supabase } from '@/lib/supabase';
import Map from '@/components/Map';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface SolarData {
  postalCode?: string;
  imageryDate?: {
    year: number;
    month: number;
    day: number;
  };
  solarPotential?: {
    maxSunshineHoursPerYear?: number;
  };
  avgTemperature?: number; 
  carbonOffsetFactorKgPerMwh?: number;
}

interface Assessment {
  riskTier: string;
  explanation: string;
  recommendations: string[];
}

export default function HomePage() {
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [currentLatLng, setCurrentLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pm25, setPm25] = useState<number | null>(null);

  const handleLocationChange = async (lat: number, lng: number) => {
    try {
      setCurrentLatLng({ lat, lng });

      const res = await fetch(`/api/environment?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      const data: SolarData = json.solarData; 

      if (!data) {
        setSolarData(null);
        setAssessment(null);
        setError('No solar data available for this region.');
        return;
      }

      setSolarData(data);
      setLocation(json.location || "Unknown");

      const airRes = await fetch(`/api/air?lat=${lat}&lng=${lng}`);
      const airJson = await airRes.json();
      setPm25(airJson.pm25 ?? null);

      setError(null);
    } catch (err) {
      console.error('Error fetching location data:', err);
      setError('Failed to fetch solar/air data.');
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
          pm25: pm25 ?? 0,
          solar: solarData.solarPotential?.maxSunshineHoursPerYear ?? 0,
          avgTemp: solarData.avgTemperature ?? 0 
        })
      });

      const json = await res.json();

      if (json.success) {
        const { riskTier, explanation, recommendations } = json.data;
        setAssessment({ riskTier, explanation, recommendations });

        const { error } = await supabase.from('assessments').insert([{
          location,
          solar: solarData.solarPotential?.maxSunshineHoursPerYear,
          pm25: pm25 ?? 0,
          risk_tier: riskTier,
          explanation,
          recommendations,
          created_at: new Date().toISOString()
        }]);

        if (error) {
          console.error(' Supabase insert failed:', error.message);
        } else {
          console.log(' Assessment saved to Supabase');
        }
      } else {
        console.warn("Raw AI output:", json.raw);
        setError(" AI could not parse a valid result.");
      }
    } catch (error) {
      console.error("Error during risk assessment:", error);
      setError(" Failed to fetch AI assessment.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
      <div className="w-full lg:w-2/3 h-[500px] lg:h-[80vh] rounded-xl shadow-lg overflow-hidden relative">
        <Map
          onLocationChange={handleLocationChange}
          latLng={currentLatLng ?? undefined}
          assessment={assessment}
        />
      </div>

      <div className="w-full lg:w-1/3 mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-4">
        {solarData ? (
          <motion.div
            className="p-6 bg-white rounded-xl shadow-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
        <div className="glass-card max-w-xl mx-auto mt-4 p-6 rounded-2xl shadow-lg backdrop-blur-sm bg-white/10 border border-white/20 text-white">
  <h2 className="text-2xl font-bold mb-4"> Solar & Environmental Data</h2>
  <p><strong>Location:</strong> {location}</p>

  {solarData.imageryDate && (
    <p>
      <strong> Imagery Date:</strong>{" "}
      {`${solarData.imageryDate.year}-${solarData.imageryDate.month}-${solarData.imageryDate.day}`}
    </p>
  )}

  {solarData.solarPotential?.maxSunshineHoursPerYear && (
    <p>
      <strong> Max Sunshine Hours/Year:</strong>{" "}
      {solarData.solarPotential.maxSunshineHoursPerYear.toFixed(2)}
    </p>
  )}

  {pm25 !== null && (
    <p>
      <strong> PM2.5 (μg/m³):</strong> {pm25.toFixed(2)}
    </p>
  )}

  {solarData.avgTemperature && (
    <p>
      <strong> Avg Annual Temp (°C):</strong>{" "}
      {solarData.avgTemperature.toFixed(2)}
    </p>
  )}
</div>

            <button
              onClick={assessRisk}
              disabled={loading || !currentLatLng}
              className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full hover:from-purple-700 hover:to-indigo-700 transition duration-300 shadow-lg text-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">🔄</span> Analyzing Risk...
                </>
              ) : (
                <>
                  <span className="mr-2">🔍</span> Run AI Risk Assessment
                </>
              )}
            </button>

            {assessment && (
              <motion.div
                className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-400 text-blue-900 rounded-xl shadow-inner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h3 className="text-xl font-bold mb-3 text-blue-700 flex items-center">
                  <span className="mr-2"></span> AI Risk Assessment
                </h3>

                <div className="flex items-center space-x-4 mb-4">
                  <motion.div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md
                        ${assessment.riskTier === 'Low' ? 'bg-green-500' :
                          assessment.riskTier === 'Medium' ? 'bg-yellow-500' :
                          'bg-red-600'
                        }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 10 }}
                  >
                    {assessment.riskTier === 'Low' ? '✅' :
                     assessment.riskTier === 'Medium' ? '⚠️' :
                     '🚨'
                    }
                  </motion.div>
                  <div>
                    <p className="text-lg font-bold">Risk Tier: <span className="text-2xl">{assessment.riskTier}</span></p>
                  </div>
                </div>

                <p className="mt-2 text-gray-700"><strong>🧠 Why?</strong> {assessment.explanation}</p>

                <div className="mt-4">
                  <p className="font-bold text-blue-700 mb-2">📦 Recommended Support:</p>
                  <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                    {assessment.recommendations.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
                        className="flex items-start"
                      >
                        <span className="mr-2 text-blue-500">▪</span> {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.p
                className="mt-4 text-red-700 bg-red-100 p-3 rounded-lg border border-red-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="mt-4 p-6 bg-white rounded-xl shadow-md w-full text-center text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-lg">📍 Click or move the map to select a location and begin your risk assessment.</p>
            <p className="text-sm mt-2 text-gray-500">The map will automatically fetch solar and environmental data for the selected area.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}