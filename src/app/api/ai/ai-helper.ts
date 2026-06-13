import { GoogleGenerativeAI } from '@google/generative-ai';
import { getOrderedModels, AI_MODEL_CANDIDATES } from './model-selector';

async function generateWithGrok(prompt: string): Promise<string | null> {
  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!key || key.startsWith('gsk_')) {
    console.log("[AI] Skipping Grok: No key or Groq key detected.");
    return null;
  }
  
  try {
    console.log("[AI] Calling xAI Grok API...");
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${key}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are an AI assistant for Tradam, a Cameroonian marketplace. Only answer questions or provide insights related to Tradam.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error(`[AI] Grok Error (${res.status}):`, err);
      return null;
    }
    
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    console.log("[AI] Grok Success.");
    return text || null;
  } catch (e: any) { 
    console.error("[AI] Grok Exception:", e.message);
    return null; 
  }
}

async function generateWithGroq(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!key || key.startsWith('xai-')) {
    console.log("[AI] Skipping Groq: No key or xAI key detected.");
    return null;
  }
  
  try {
    console.log("[AI] Calling Groq API...");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${key}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an AI assistant for Tradam, a Cameroonian marketplace.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error(`[AI] Groq Error (${res.status}):`, err);
      return null;
    }
    
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    console.log("[AI] Groq Success.");
    return text || null;
  } catch (e: any) { 
    console.error("[AI] Groq Exception:", e.message);
    return null; 
  }
}

export async function generateContentForTradam(apiKey: string, prompt: string, maxAttempts: number = 6): Promise<string> {
  console.log("[AI] Starting generation for Tradam...");
  const constrainedPrompt = 'STRICT REQUIREMENT: You are the Tradam Marketplace AI. Only answer questions or provide insights regarding the Tradam platform (Cameroon). Refuse all other topics.\n\n' + prompt;
  
  // 1. Try Alternative Providers First
  if (process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_API_KEY) {
    const t1 = await generateWithGrok(constrainedPrompt);
    if (t1) return t1;
    
    const t2 = await generateWithGroq(constrainedPrompt);
    if (t2) return t2;
    
    console.warn("[AI] Grok/Groq attempts failed, but keys were present.");
  }
  
  // 2. Fallback to Gemini if requested or if Grok failed
  if (!apiKey) {
    throw new Error("No valid AI API keys (Grok, Groq, or Gemini) are functional or configured.");
  }

  console.log("[AI] Attempting Gemini fallback...");
  const genAI = new GoogleGenerativeAI(apiKey);
  let models = AI_MODEL_CANDIDATES;
  
  try {
    const fetched = await getOrderedModels(apiKey);
    if (fetched && fetched.length > 0) models = fetched;
  } catch (e) {
    console.warn("[AI] Failed to fetch ordered models, using candidates.");
  }
  
  let lastError = null;
  for (let i = 0; i < Math.min(maxAttempts, models.length); i++) {
    const modelName = models[i];
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(constrainedPrompt);
      const response = await result.response;
      const text = response.text().trim();
      if (text) {
        console.log("[AI] Gemini Success.");
        return text;
      }
    } catch (error: any) { 
      lastError = error;
      console.error(`[AI] Gemini Error (${modelName}):`, error.message);
    }
  }
  
  throw new Error('AI Service Error: All providers failed. Last Error: ' + (lastError?.message || 'Unknown error'));
}
