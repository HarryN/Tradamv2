import { supabase } from '@/lib/supabase';

export async function getClusteredProducts(productId: string, limit = 6): Promise<string[]> {
  // Get the cluster of the current product
  const { data: current } = await supabase
    .from('product_clusters')
    .select('cluster_id')
    .eq('product_id', productId)
    .single();

  if (!current) return [];

  // Get other products in same cluster
  const { data: cluster } = await supabase
    .from('product_clusters')
    .select('product_id')
    .eq('cluster_id', current.cluster_id)
    .neq('product_id', productId)
    .limit(limit);

  return (cluster || []).map((c: any) => c.product_id);
}
