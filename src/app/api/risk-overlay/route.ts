import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type") || "drought";
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const nasaUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,T2M,PRECTOT&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;
 const owmKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const airUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${owmKey}`;

  try {
    const [nasaRes, airRes] = await Promise.all([fetch(nasaUrl), fetch(airUrl)]);
    const nasaData = await nasaRes.json();
    const airData = await airRes.json();

    const solar = parseFloat(nasaData.properties.parameter.ALLSKY_SFC_SW_DWN?.ANN);
    const temp = parseFloat(nasaData.properties.parameter.T2M?.ANN);
    const rain = parseFloat(nasaData.properties.parameter.PRECTOT?.ANN);
    const pm25 = airData.list?.[0]?.components?.pm2_5 ?? 0;

    let risk = "low";
  if (type === "drought") {
    if (solar < 1500 || rain < 800) risk = "high";
    else if (solar < 1700 || rain < 1000) risk = "medium";
  } else if (type === "flood") {
    if (rain > 1600) risk = "high";
    else if (rain > 1200) risk = "medium";
  } else if (type === "financial") {
    if (pm25 > 90 || temp > 32) risk = "high";
    else if (pm25 > 70) risk = "medium";
  }

    return NextResponse.json({
      overlay: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        risk,
        color:
          risk === "high" ? [255, 0, 0] :
          risk === "medium" ? [255, 255, 0] :
          [0, 255, 0],
        radius: 15000,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch risk data" }, { status: 500 });
  }
}
