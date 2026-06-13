import { NextResponse } from "next/server";
import { generateContentForTradam } from '@/app/api/ai/ai-helper';

export async function POST(req: Request) {
  try {
    const { dispute, buyerStats, sellerStats } = await req.json();

    if (!dispute || !buyerStats || !sellerStats) {
      return NextResponse.json(
        { error: "Missing dispute or account statistics for insight generation" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || "";

    const buyerSummary = [
      `Total orders: ${buyerStats.totalOrders ?? 'unknown'}`,
      `Disputes opened: ${buyerStats.totalDisputes ?? 0}`,
      `Resolved disputes: ${buyerStats.resolvedDisputes ?? 0}`,
      `Open/pending disputes: ${buyerStats.pendingDisputes ?? 0}`,
      `First dispute date: ${buyerStats.firstDisputeDate ?? 'none'}`,
    ].join('\n');

    const sellerSummary = [
      `Total products: ${sellerStats.totalProducts ?? 'unknown'}`,
      `Disputes against seller: ${sellerStats.totalDisputes ?? 0}`,
      `Resolved disputes: ${sellerStats.resolvedDisputes ?? 0}`,
      `Open/pending disputes: ${sellerStats.pendingDisputes ?? 0}`,
      `Total items sold: ${sellerStats.totalOrderItems ?? 0}`,
    ].join('\n');

    const prompt = `
      You are an experienced marketplace dispute analyst for the "Tradam" marketplace in Cameroon.
      Your ONLY purpose is to support Tradam administrators with account-based insights.

      Dispute Details:
      - Reason: ${dispute.reason}
      - Description: ${dispute.description}

      Buyer Account Summary:
      ${buyerSummary}

      Seller Account Summary:
      ${sellerSummary}

      Requirements:
      1. Provide a concise summary of the dispute strength.
      2. Identify risk factors (e.g., repeat disputes, low sales volume).
      3. Recommend a practical next step for the admin.
      4. Use professional headings: Summary, Risk Profile, and Recommendation.
      5. Keep the response concise and strictly Tradam-focused.
      6. Format with clear Markdown headings.
    `;

    const text = await generateContentForTradam(apiKey, prompt);

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("Gemini API Error (Dispute Account Insights):", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate dispute account insight" },
      { status: 500 }
    );
  }
}
