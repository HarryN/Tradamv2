import { NextResponse } from 'next/server';
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { role, language = 'English', accountSnapshot } = body;

    if (!accountSnapshot || typeof accountSnapshot !== 'object') {
      return NextResponse.json({ error: 'accountSnapshot is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    const prompt = `
You are Tradam's account analyst.
Your ONLY job is to analyze a user's Tradam account data and provide practical next steps inside Tradam.

User role: ${role || 'unknown'}
Preferred language: ${language}

Account snapshot (source: Tradam database):
${JSON.stringify(accountSnapshot, null, 2)}

Requirements:
1. Output must be in ${language}.
2. Keep it under 600 characters.
3. Focus only on the most important findings from the snapshot.
4. Mention strengths, risks, and up to 3 clear next actions the user should take inside Tradam.
5. Do not invent data. If a field is missing or 0, treat it as unknown/empty.
6. Do not answer general questions; stay strictly within Tradam context.
7. Do not add headings, long explanations, or motivational filler.
8. Use short bullets or short sentences only.
`;

    const text = await generateContentForTradam(apiKey, prompt);
    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    console.error('[AI ROUTE ERROR] Account Analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate account analysis.' },
      { status: 500 }
    );
  }
}
