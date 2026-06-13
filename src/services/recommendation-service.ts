import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { getClusteredProducts } from './clustering-service';
import { attachSellersToProducts, getProfilesByIds, isMissingRelationshipError, PUBLIC_SELLER_SELECT } from '@/services/profile-utils';

const RECOMMENDATION_PRODUCT_SELECT = `*, seller:profiles!seller_id(${PUBLIC_SELLER_SELECT})`;
function filterVisibleProducts(products: Product[] | null | undefined): Product[] {
  return (products || []).filter((product) => product.seller?.role === 'seller');
}

async function hydrateProducts(products: Product[]): Promise<Product[]> {
  const sellers = await getProfilesByIds(products.map((p) => p.seller_id));
  return attachSellersToProducts(products, sellers);
}

export async function getRelatedProducts(productId: string, limit = 6): Promise<Product[]> {
  // Try cluster-based recommendations first
  const clusterProductIds = await getClusteredProducts(productId, limit);

  if (clusterProductIds.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select(RECOMMENDATION_PRODUCT_SELECT)
      .in('id', clusterProductIds)
      .eq('is_active', true);

    if (!error && data && data.length > 0) {
      return filterVisibleProducts((data || []) as Product[]);
    }

    if (error && isMissingRelationshipError(error)) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .in('id', clusterProductIds)
        .eq('is_active', true);

      if (!fallbackError && fallback && fallback.length > 0) {
        return filterVisibleProducts(await hydrateProducts((fallback || []) as Product[]));
      }
    }
  }

  // Fallback: category-based recommendations
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .select('id, category_id')
    .eq('id', productId)
    .single();

  if (prodErr || !prod) return [];

  const { data, error } = await supabase
    .from('products')
    .select(RECOMMENDATION_PRODUCT_SELECT)
    .neq('id', productId)
    .eq('category_id', prod.category_id)
    .eq('is_active', true)
    .limit(limit);

  if (!error) return filterVisibleProducts((data || []) as Product[]);
  if (!isMissingRelationshipError(error)) return [];

  const { data: fallback, error: fallbackError } = await supabase
    .from('products')
    .select('*')
    .neq('id', productId)
    .eq('category_id', prod.category_id)
    .eq('is_active', true)
    .limit(limit);

  if (fallbackError) return [];
  return filterVisibleProducts(await hydrateProducts((fallback || []) as Product[]));
}

// Cache for trending products (15 minute TTL)
let trendingCache: { data: Product[], timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

export async function getTrendingProducts(limit = 10): Promise<Product[]> {
  const now = Date.now();
  if (trendingCache && (now - trendingCache.timestamp < CACHE_TTL)) {
    return trendingCache.data.slice(0, limit);
  }

  try {
    const { data: trendingIds, error: rpcError } = await supabase.rpc('get_trending_products', {
      p_limit: limit * 2 // Fetch extra for safety
    });

    if (rpcError) {
      console.error('RPC Error (get_trending_products):', rpcError.message, rpcError.details, rpcError.hint);
      throw rpcError;
    }

    if (!trendingIds || trendingIds.length === 0) {
      // Fallback to latest products
      const { data, error: fallbackError } = await supabase
        .from('products')
        .select(RECOMMENDATION_PRODUCT_SELECT)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        if (isMissingRelationshipError(fallbackError)) {
          const { data: fallbackNoJoin, error: fallbackNoJoinError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (fallbackNoJoinError) return [];
          return filterVisibleProducts(await hydrateProducts((fallbackNoJoin || []) as Product[]));
        }
        console.error('Fallback Error (latest products):', fallbackError.message);
        return [];
      }
      return filterVisibleProducts((data || []) as Product[]);
    }

    const ids = trendingIds.map((row: any) => row.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select(RECOMMENDATION_PRODUCT_SELECT)
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      if (isMissingRelationshipError(error)) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .in('id', ids)
          .eq('is_active', true);

        if (fallbackError) return [];
        const hydrated = await hydrateProducts((fallback || []) as Product[]);
        const sortedFallback = filterVisibleProducts(hydrated).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        trendingCache = { data: sortedFallback, timestamp: now };
        return sortedFallback.slice(0, limit);
      }
      console.error('Product Fetch Error (trending):', error.message);
      throw error;
    }

    // Sort according to trending rank
    const sortedProducts = filterVisibleProducts((products || []) as Product[]).sort((a, b) => {
      return ids.indexOf(a.id) - ids.indexOf(b.id);
    });

    trendingCache = { data: sortedProducts, timestamp: now };
    return sortedProducts.slice(0, limit);
  } catch (err: any) {
    console.error('Error fetching trending products:', err.message || err);
    return [];
  }
}

export async function getFrequentlyBoughtWith(productId: string, limit = 4): Promise<Product[]> {
  try {
    const { data: relatedIds, error: rpcError } = await supabase.rpc('get_frequently_bought_with', {
      p_product_id: productId,
      p_limit: limit
    });

    if (rpcError) {
      console.error('RPC Error (get_frequently_bought_with):', rpcError.message, rpcError.details, rpcError.hint);
      throw rpcError;
    }

    if (!relatedIds || relatedIds.length === 0) return [];

    const ids = relatedIds.map((row: any) => row.related_product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select(RECOMMENDATION_PRODUCT_SELECT)
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      if (isMissingRelationshipError(error)) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .in('id', ids)
          .eq('is_active', true);

        if (fallbackError) return [];
        return filterVisibleProducts(await hydrateProducts((fallback || []) as Product[]));
      }
      console.error('Product Fetch Error (frequently bought):', error.message);
      throw error;
    }
    return filterVisibleProducts((products || []) as Product[]);
  } catch (err: any) {
    console.error('Error fetching frequently bought with:', err.message || err);
    return [];
  }
}

export async function getPersonalizedRecommendations(userId: string, limit = 6): Promise<Product[]> {
  const { data: items } = await supabase
    .from('order_items')
    .select('product:products(id, category_id) , order:orders(id, buyer_id)')
    .eq('order.buyer_id', userId)
    .order('id', { ascending: false })
    .limit(50);

  const purchasedProductIds = Array.from(
    new Set(
      (items || [])
        .map((it: any) => it.product?.id)
        .filter(Boolean)
    )
  );

  if (purchasedProductIds.length > 0) {
    const { data: clusterAssignments } = await supabase
      .from('product_clusters')
      .select('cluster_id')
      .in('product_id', purchasedProductIds);

    const clusterIds = Array.from(
      new Set((clusterAssignments || []).map((row: any) => row.cluster_id).filter(Boolean))
    );

    if (clusterIds.length > 0) {
      const { data: clusterProducts } = await supabase
        .from('product_clusters')
        .select('product_id')
        .in('cluster_id', clusterIds)
        .limit(limit * 5);

      const recommendedIds = Array.from(
        new Set(
          (clusterProducts || [])
            .map((row: any) => row.product_id)
            .filter((id: string) => !purchasedProductIds.includes(id))
        )
      ).slice(0, limit);

      if (recommendedIds.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .select(RECOMMENDATION_PRODUCT_SELECT)
          .in('id', recommendedIds)
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          return filterVisibleProducts((data || []) as Product[]);
        }

        if (error && isMissingRelationshipError(error)) {
          const { data: fallback, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .in('id', recommendedIds)
            .eq('is_active', true);

          if (!fallbackError && fallback && fallback.length > 0) {
            return filterVisibleProducts(await hydrateProducts((fallback || []) as Product[]));
          }
        }
      }
    }
  }

  const categoryIds = Array.from(
    new Set(
      (items || [])
        .map((it: any) => it.product?.category_id)
        .filter(Boolean)
    )
  );

  if (categoryIds.length === 0) {
    const { data } = await supabase
      .from('products')
      .select(RECOMMENDATION_PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return filterVisibleProducts((data || []) as Product[]);
  }

  const { data, error } = await supabase
    .from('products')
    .select(RECOMMENDATION_PRODUCT_SELECT)
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .limit(limit);

  if (!error) return filterVisibleProducts((data || []) as Product[]);
  if (!isMissingRelationshipError(error)) return [];

  const { data: fallback, error: fallbackError } = await supabase
    .from('products')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .limit(limit);

  if (fallbackError) return [];
  return filterVisibleProducts(await hydrateProducts((fallback || []) as Product[]));
}
