import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { pm25, solar, location } = await req.json();

  const prompt = `
You are an AI climate risk assessor. A user is located in ${location}.
- PM2.5 level: ${pm25}
- Solar output: ${solar} kWh/m²/year

Determine:
1. Risk Tier: Low / Medium / High
2. Explanation: Short summary why this risk level is assigned
3. Recommendations: 1–2 climate insurance products or schemes that would help small farmers or rural users in this region

Respond strictly in valid JSON with this exact format (do not include extra comments, no nested structures):

{
  "riskTier": "Medium",
  "explanation": "Short reasoning here.",
  "recommendations": [
    "Insurance Product 1 - short description",
    "Insurance Product 2 - short description"
  ]
}

DO NOT return objects inside 'recommendations'. Only return an array of strings as shown above. Your entire output must be a single JSON block and must be parsable with JSON.parse().
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
    return NextResponse.json({
      success: false,
      error: "AI response could not be parsed",
      raw: content
    });
  }
}
