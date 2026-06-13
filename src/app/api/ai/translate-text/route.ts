import { NextResponse } from 'next/server';
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

function extractJsonArray(raw: string): string[] | null {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.map((item) => String(item ?? '')) : null;
  } catch (error) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        const parsed = JSON.parse(fenced[1]);
        return Array.isArray(parsed) ? parsed.map((item) => String(item ?? '')) : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { texts, targetLanguage } = await req.json();
    const inputTexts = Array.isArray(texts)
      ? texts.map((text) => String(text ?? '').trim()).filter(Boolean)
      : [];

    if (inputTexts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    const prompt = `
You are a professional translation engine for Tradam, a Cameroonian marketplace.

Translate each input text into ${targetLanguage || 'French'}.

Rules:
1. Keep the same order as the input.
2. Preserve brand names, measurements, units, quantities, prices, and product codes.
3. Translate common product names naturally. Example: "potatoes" -> "pommes de terre".
4. If a text is already in the target language, keep it natural and unchanged.
5. Return ONLY a valid JSON array of strings with no markdown and no explanation.

Input texts:
${JSON.stringify(inputTexts)}
`;

    const apiKey = process.env.GEMINI_API_KEY || '';
    const raw = await generateContentForTradam(apiKey, prompt);
    const translations = extractJsonArray(raw);

    if (!translations || translations.length !== inputTexts.length) {
      return NextResponse.json({ translations: inputTexts });
    }

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error('Dynamic translation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate content' },
      { status: 500 }
    );
  }
}
