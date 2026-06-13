import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const { title, category, language } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "";

    const prompt = `
      You are an expert marketplace seller. Generate a professional and catchy product description for a marketplace called "Tradam".
      
      Product Title: ${title}
      Category: ${category}
      Language: ${language || 'English'}
      
      Requirements:
      1. Highlight key features.
      2. Use an engaging tone.
      3. Keep it under 500 characters.
      4. Use bullet points for features if applicable.
      5. Do not include price or contact information.
      
      Return only the description text.
    `;

    const text = await generateContentForTradam(apiKey, prompt);

    return NextResponse.json({ description: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
