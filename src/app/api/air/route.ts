import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lng || !key) {
    return NextResponse.json({ error: 'Missing parameters or API key' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${key}`
    );
    const json = await res.json();

    const pm25 = json?.list?.[0]?.components?.pm2_5 ?? null;
    const aqi = json?.list?.[0]?.main?.aqi ?? null;

    return NextResponse.json({ pm25, aqi });
  } catch (err) {
    console.error('Failed to fetch air pollution data:', err);
    return NextResponse.json({ error: 'Failed to fetch air data' }, { status: 500 });
  }
}
