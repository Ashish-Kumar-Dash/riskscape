import { NextRequest, NextResponse } from "next/server";

const GEO_API = "https://maps.googleapis.com/maps/api/geocode/json";
const AIR_API = "https://airquality.googleapis.com/v1/currentConditions:lookup";
const SOLAR_API = "https://solar.googleapis.com/v1/dataLayers";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  if (!lat || !lng) return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Geocoding API
  const geoRes = await fetch(`${GEO_API}?latlng=${lat},${lng}&key=${key}`);
  const geoData = await geoRes.json();
  const locationName = geoData.results?.[0]?.formatted_address || "Unknown location";

  // Air Quality API
  const airRes = await fetch(`${AIR_API}?location.latitude=${lat}&location.longitude=${lng}&key=${key}`, {
    method: "POST",
  });
  const airData = await airRes.json();
  const pollution = airData?.[0]?.indexes?.[0];

// Solar API (POST)
const solarRes = await fetch(`https://solar.googleapis.com/v1/dataLayers:retrieve?key=${key}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    location: {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    },
    radiusMeters: 50,
    requiredQuality: "HIGH",
  }),
});
const solarData = await solarRes.json();

}
