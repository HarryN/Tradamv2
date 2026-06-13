import { NextResponse } from 'next/server';
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    console.log("[AI ROUTE] Platform Question started");
    const body = await req.json().catch(() => ({}));
    const { question, role, language = 'English' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";

    const prompt = `
You are Tradam's focused marketplace assistant.
Only answer questions about Tradam, including seller profiles, buyer behavior, products, orders, disputes, payments, platform navigation, and account settings.
If the user asks about anything outside Tradam, such as physics, biology, or general knowledge unrelated to this platform, reply exactly:
"I can only answer Tradam-related questions. Please ask about orders, products, seller or buyer accounts, disputes, or platform features."

User role: ${role || 'unknown'}
Question: ${question}
Preferred Language: ${language}

Requirements:
1. Provide the entire response in ${language}.
2. Answer the user's exact question directly.
3. Keep the response short: maximum 3 short sentences or 3 short bullet points.
4. Do not provide unrelated information, background explanation, or generic advice unless the user asked for it.
5. Do not add headings, greetings, sign-offs, or marketing language.
6. Do not answer outside the Tradam marketplace domain.
7. If the question is off-topic, respond with the safe fallback message above (translated to ${language}).
8. Use a friendly, helpful tone.
`;

    const text = await generateContentForTradam(apiKey, prompt);
    console.log("[AI ROUTE] Platform Question success");

    return NextResponse.json({ answer: text });
  } catch (error: any) {
    console.error('[AI ROUTE ERROR] Platform Question:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to answer the question.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
