import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { pm25, solar, location, avgTemp } = await req.json();

const prompt = `
You are an AI climate risk assessor. A user is located in ${location}.
- PM2.5 level: ${pm25}
- Solar output: ${solar} kWh/m²/year
- Avg Annual Temp: ${avgTemp} °C

Determine the climate risk tier (Low/Medium/High), explain briefly why, and recommend 1-2 insurance product *names* (only names, no explanations) that are suitable for small farmers or rural users in such conditions.

Respond ONLY in compact JSON like this:

{
  "riskTier": "Medium",
  "explanation": "Your short explanation here...",
  "recommendations": ["Index-based crop insurance", "Livestock weather insurance"]
}
`;


  const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "mistralai/mistral-nemo:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await openrouterRes.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return NextResponse.json({ success: true, data: parsed });
  } catch {
    return NextResponse.json({ success: false, error: "AI response could not be parsed", raw: content });
  }
}
