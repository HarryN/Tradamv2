import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    console.log("[AI ROUTE] Smart Search started");
    const body = await req.json().catch(() => ({}));
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";

    const prompt = `
      You are an intelligent search assistant for a marketplace called "Tradam".
      The user is searching for something using natural language. 
      Convert their query into a list of 3-5 specific product keywords or categories that can be used for a database search.
      
      User Query: "${query}"
      
      Requirements:
      1. Return only a JSON array of strings.
      2. Each string should be a single keyword or a short phrase.
      3. Focus on items likely to be in a marketplace.
      
      Example:
      Input: "I need something to play games on"
      Output: ["Gaming Laptop", "PlayStation", "Xbox", "Nintendo Switch", "Gaming Console"]
    `;

    let text = await generateContentForTradam(apiKey, prompt);
    console.log("[AI ROUTE] Smart Search raw response received");
    
    // Clean up potential markdown code blocks
    if (text.startsWith('```')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const keywords = JSON.parse(text);
      return NextResponse.json({ keywords });
    } catch (e) {
      console.warn("[AI ROUTE] Failed to parse JSON, falling back to string split");
      const keywords = text.split(/,|\n/).map(k => k.replace(/^[0-9]\.\s?/, '').trim()).filter(k => k.length > 0);
      return NextResponse.json({ keywords });
    }
  } catch (error: any) {
    console.error("[AI ROUTE ERROR] Smart Search:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process smart search",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
