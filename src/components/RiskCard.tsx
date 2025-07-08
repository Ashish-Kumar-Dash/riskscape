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
          <p className="text-sm font-medium">Air Quality Index: {air.aqi}</p>
          <p className="text-sm text-gray-600">Category: {air.category}</p>
        </div>
      )}

      {solar && (
        <div className="mt-2">
          <p className="text-sm font-medium">
            Solar Potential: {solar?.maxSunshineHoursPerYear} hours/year
          </p>
          <p className="text-sm text-gray-600">
            Avg Insolation: {solar?.maxSolarRadiation?.valueKwPerM2} kWh/m²/day
          </p>
        </div>
      )}
    </div>
  );
}
