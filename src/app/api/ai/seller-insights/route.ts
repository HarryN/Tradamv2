import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const { stats, language = 'English' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "";

    const statsSummary = stats && stats.length > 0 
      ? stats.map((s: any) => `- ${s.title}: ${s.views} views, ${s.sales_count} sales, ${s.revenue} FCFA revenue`).join('\n')
      : "No product statistics available yet.";

    const prompt = stats && stats.length > 0 
      ? `
      You are a senior business analyst for a Cameroonian marketplace called "Tradam". 
      Analyze the following product performance statistics for a seller and provide actionable, strategic insights.
      
      Seller Statistics:
      ${statsSummary}
      
      Requirements:
      1. Provide the entire response in ${language}.
      2. Use a professional, encouraging tone.
      3. Identify the best performing products and why they might be succeeding.
      4. Identify products with high views but low sales (conversion issues).
      5. Suggest specific improvements for the Cameroonian market only when directly supported by the data.
      6. Keep the response under 500 characters.
      7. Give only actionable insights.
      8. Do not add headings, markdown formatting, introductions, or filler.
      9. Use 2-4 short sentences or up to 3 short bullet points.
      `
      : `
      You are a senior business analyst for "Tradam", a Cameroonian marketplace.
      This is a new seller or a seller with no views/sales yet.
      
      Requirements:
      1. Briefly explain how Tradam AI can help them improve their store.
      2. Give up to 3 quick, practical tips for a new seller in Cameroon.
      3. Keep the response under 350 characters.
      4. Do not add headings, markdown formatting, welcome labels, or filler.
      5. Response must be in ${language}.
      6. Use 2-3 short sentences only.
      `;

    const text = await generateContentForTradam(apiKey, prompt);

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("Gemini API Error (Seller Insights):", error);
    return NextResponse.json({ error: error.message || "Failed to generate seller insights" }, { status: 500 });
  }
}
