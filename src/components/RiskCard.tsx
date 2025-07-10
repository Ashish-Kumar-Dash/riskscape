type Props = {
  data: {
    locationName: string;
    air: any;
    solar: any;
  };
};

export default function RiskCard({ data }: Props) {
  const { locationName, air, solar } = data;

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded-xl shadow-md max-w-xl">
      <h2 className="text-xl font-semibold mb-2">📍 {locationName}</h2>

      {air && (
        <div>
          <p className="text-sm font-medium">Air Quality Index: {air.aqi || "N/A"}</p>
          <p className="text-sm text-gray-600">Category: {air.category || "N/A"}</p>
        </div>
      )}

      {solar && (
        <div className="mt-2">
          {solar.message ? (
            <p className="text-sm text-gray-600">{solar.message}</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                ☀️ Sunshine Hours/Year: {solar.maxSunshineHoursPerYear || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                🌡️ Avg Temperature (°C): {solar.wholeRoofStats?.areaMeters2?.toFixed(2) || "N/A"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
