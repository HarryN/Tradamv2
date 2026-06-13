import { supabase } from '@/lib/supabase';

export interface ProductReview {
  id: string;
  product_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export async function submitReview(review: Omit<ProductReview, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('product_reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProductReview;
}

export async function getExistingReview(buyerId: string, productId: string, orderId: string) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ProductReview | null;
}

export async function updateReview(id: string, updates: Partial<Pick<ProductReview, 'rating' | 'comment'>>) {
  const { data, error } = await supabase
    .from('product_reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProductReview;
}

export async function getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ProductReview[];
}

export async function getSellerAverageRating(sellerId: string): Promise<{ average: number; count: number }> {
  // First get all product IDs for this seller
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id')
    .eq('seller_id', sellerId);

  if (prodError) throw new Error(prodError.message);
  if (!products || products.length === 0) return { average: 0, count: 0 };

  const productIds = products.map(p => p.id);

  // Get average rating for these products
  const { data: reviews, error: revError } = await supabase
    .from('product_reviews')
    .select('rating')
    .in('product_id', productIds);

  if (revError) throw new Error(revError.message);
  if (!reviews || reviews.length === 0) return { average: 0, count: 0 };

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    average: parseFloat((total / reviews.length).toFixed(1)),
    count: reviews.length
  };
}

export async function getSellerReviews(sellerId: string) {
  // 1. Get all product IDs for this seller
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title')
    .eq('seller_id', sellerId);

  if (prodError) throw new Error(prodError.message);
  if (!products || products.length === 0) return [];

  const productIds = products.map(p => p.id);

  // 2. Get reviews with product info
  const { data: reviews, error: revError } = await supabase
    .from('product_reviews')
    .select(`
      *,
      products (title, image_url)
    `)
    .in('product_id', productIds)
    .order('created_at', { ascending: false });

  if (revError) throw new Error(revError.message);
  return reviews as any[];
}
