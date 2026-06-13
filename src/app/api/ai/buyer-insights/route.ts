import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const { orderHistory } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "";

    const orderSummary = orderHistory && orderHistory.length > 0
      ? orderHistory.map((o: any) => `- Product: ${o.product?.title}, Category: ${o.product?.category_id}, Price: ${o.unit_price} FCFA`).join('\n')
      : "No order history available yet.";

    const prompt = orderHistory && orderHistory.length > 0
      ? `
      You are a personal shopping assistant for a Cameroonian marketplace called "Tradam". 
      Analyze the user's shopping history and provide personalized insights.
      
      User Order History:
      ${orderSummary}
      
      Requirements:
      1. Use a friendly and personal tone.
      2. Identify their favorite categories or shopping habits.
      3. Suggest what they might need next based on their past purchases.
      4. Mention Cameroonian cultural or seasonal context only if it is directly relevant.
      5. Keep it concise (under 450 characters).
      6. Give only the most useful takeaways.
      7. Do not add headings, welcome text, labels, or filler.
      8. Use 2-4 short sentences or up to 3 short bullet points.
      `
      : `
      You are a personal shopping assistant for "Tradam", a Cameroonian marketplace.
      This is a new user with no purchase history yet.
      
      Requirements:
      1. Briefly explain how Tradam AI can help them as they shop.
      2. Suggest up to 3 useful categories to explore in Cameroon.
      3. Keep it concise (under 350 characters).
      4. Do not add headings, welcome labels, or unnecessary extra text.
      5. Use 2-3 short sentences only.
      `;

    const text = await generateContentForTradam(apiKey, prompt);

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("Gemini API Error (Buyer Insights):", error);
    return NextResponse.json({ error: error.message || "Failed to generate buyer insights" }, { status: 500 });
  }
}
