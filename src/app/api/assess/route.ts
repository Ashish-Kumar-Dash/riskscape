import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { pm25, solar, location, avgTemp } = await req.json();

const prompt = `
You are an AI climate risk assessor, providing precise and varied risk evaluations. A user is located in ${location}.
Assess the overall climate vulnerability and potential for agricultural/rural impact based on the following metrics:

PM2.5 level: ${pm25} (μg/m³) - Higher values indicate poorer air quality, often linked to environmental stress or industrial activity.

Solar output: ${solar} kWh/m²/year - Lower values suggest less sunshine for crops, higher values indicate good solar potential but can also contribute to drought with high temperatures.

Avg Annual Temp: ${avgTemp} °C - Higher temperatures exacerbate drought and heat stress.

Based on a holistic evaluation of these factors, determine the climate risk tier (Low, Medium, or High) for this specific location.

Low Risk: Conditions are generally favorable with minimal indicators of significant climate vulnerability for agricultural/rural communities.

Medium Risk: There are noticeable climate challenges or indicators of vulnerability, requiring some adaptive measures or moderate attention.

High Risk: The confluence of factors indicates significant climate vulnerability and potential for severe impact on agricultural/rural communities, demanding urgent attention and robust adaptation strategies.

After determining the risk tier, briefly explain why you assigned that tier, referencing the provided data points.
Finally, recommend 1-2 specific and relevant insurance product names (only names, no explanations or generic terms like "general insurance") that are suitable for small farmers or rural users in such conditions, aiming to directly address the identified risks.

Respond ONLY in compact JSON like this:

{
"riskTier": "Medium",
"explanation": "Your concise explanation here, referencing the data points.",
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
