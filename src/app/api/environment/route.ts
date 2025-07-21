import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const geoKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    // 🌞 Fetch NASA solar and climate data
    const nasaURL = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,TS&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;
    const nasaRes = await fetch(nasaURL);
    const nasaData = await nasaRes.json();
    const props = nasaData.properties?.parameter;

    if (!props || !props.ALLSKY_SFC_SW_DWN || !props.TS) {
      return NextResponse.json({ error: 'No NASA data available' }, { status: 404 });
    }

    const ghiDaily = props.ALLSKY_SFC_SW_DWN.ANN;
    const avgTemp = props.TS.ANN;
    const sunshineHoursYear = ghiDaily * 365;

    // 📍 Reverse Geocode using Google
    let postalCode = "N/A";
    let city = "Unknown";
    let state = "Unknown";

    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${geoKey}`
    );
    const geoJson = await geoRes.json();
    const addr = geoJson?.results?.[0]?.address_components ?? [];

    postalCode = addr.find((c: any) => c.types.includes("postal_code"))?.long_name ?? "N/A";
    city = addr.find((c: any) => c.types.includes("locality"))?.long_name ?? "Unknown";
    state = addr.find((c: any) => c.types.includes("administrative_area_level_1"))?.short_name ?? "Unknown";

const fakeSolarData = {
  postalCode,
  imageryDate: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  },
  solarPotential: {
    maxSunshineHoursPerYear: parseFloat(sunshineHoursYear.toFixed(2)),
    // Remove wholeRoofStats
  },
  avgTemperature: parseFloat(avgTemp.toFixed(2))
};

    return NextResponse.json({
      solarData: fakeSolarData,
      location: `${city}, ${state}`
    });
  } catch (err) {
    console.error("NASA+Geo API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
