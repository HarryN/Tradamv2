import { NextResponse } from "next/server";
import {
  getOrderedModels,
  resolveConfiguredTextModel,
  resolveConfiguredTtsModel,
} from '@/app/api/ai/model-selector';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const orderedModels = await getOrderedModels(apiKey);

    return NextResponse.json({ 
      availableModels: orderedModels,
      configuredTextModel: resolveConfiguredTextModel(),
      configuredTtsModel: resolveConfiguredTtsModel(),
      suggestion: orderedModels.length > 0 ? `Primary text model: ${orderedModels[0]}` : 'No compatible text models found'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
