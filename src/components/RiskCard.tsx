// components/RiskCard.tsx
import { motion } from "framer-motion";

export default function RiskCard({
  result,
}: {
  result: {
    riskTier: "Low" | "Medium" | "High";
    explanation: string;
    recommendations: string[];
  };
}) {
  const getColor = (tier: string) => {
    switch (tier) {
      case "Low":
        return "text-green-400 border-green-400";
      case "Medium":
        return "text-yellow-400 border-yellow-400";
      case "High":
        return "text-red-400 border-red-400";
      default:
        return "text-white border-white";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 60 }}
      className={`max-w-md w-full mx-auto p-6 rounded-2xl border backdrop-blur-md bg-white/10 shadow-lg ${getColor(result.riskTier)}`}
    >
      <h2 className={`text-xl font-semibold mb-3 ${getColor(result.riskTier)}`}>
        Climate Risk Assessment: <span className="underline">{result.riskTier}</span>
      </h2>
      <p className="text-sm text-white mb-4">{result.explanation}</p>

      <div className="mt-4">
        <h3 className="text-white font-medium mb-2">Recommended Insurance:</h3>
        <ul className="list-disc list-inside text-white">
          {result.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
