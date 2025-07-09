import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    const solarRes = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${key}`
    );

    if (!solarRes.ok) {
      const err = await solarRes.json();
      console.error('Solar API error:', err);
      return NextResponse.json({ error: 'No solar data for this location.' }, { status: 200 });
    }

    const solarData = await solarRes.json();
    return NextResponse.json({ solarData, location: { lat, lng } });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
