import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const { reason, description, messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "";

    const messageHistory = messages
      .map((m: any) => `${m.sender_role}: ${m.message}`)
      .join('\n');

    const prompt = `
      You are an expert mediator for the "Tradam" marketplace in Cameroon.
      Your ONLY purpose is to suggest fair resolutions for Tradam disputes based on marketplace rules.
      
      Dispute Details:
      - Reason: ${reason}
      - Description: ${description}
      
      Communication History:
      ${messageHistory}
      
      Requirements:
      1. Provide a neutral and professional analysis of the dispute.
      2. Suggest a specific resolution (e.g., partial refund, full refund upon return, or rejecting the dispute).
      3. Provide a short justification for your suggestion.
      4. Use a tone that is strictly helpful and Tradam-focused.
      5. Keep the response concise (under 450 characters).
      6. Do not add headings, repeated context, or filler.
      7. Use 2-4 short sentences or up to 3 short bullet points.
      8. Only answer Tradam-related marketplace questions.
    `;

    const text = await generateContentForTradam(apiKey, prompt);

    return NextResponse.json({ suggestion: text });
  } catch (error: any) {
    console.error("Gemini API Error (Dispute):", error);
    return NextResponse.json(
      { error: error.message || "Failed to suggest resolution" },
      { status: 500 }
    );
  }
}
