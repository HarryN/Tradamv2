import { NextResponse } from 'next/server';
import { getRelatedProducts, getPersonalizedRecommendations } from '@/services/recommendation-service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const userId = url.searchParams.get('userId');

    if (userId) {
      const recs = await getPersonalizedRecommendations(userId);
      return NextResponse.json(recs);
    }

    if (productId) {
      const recs = await getRelatedProducts(productId);
      return NextResponse.json(recs);
    }

    return NextResponse.json([]);
  } catch (err) {
    return new Response('Internal error', { status: 500 });
  }
}
