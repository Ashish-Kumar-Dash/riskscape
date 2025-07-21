import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type") || "insurance_agency";
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=${type}&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const places = data.results.map((place: any) => ({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    }));

    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
