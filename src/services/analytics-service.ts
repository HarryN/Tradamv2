import { supabase } from '@/lib/supabase';

export interface SellerProductStats {
  product_id: string;
  title: string;
  views: number;
  sales_count: number;
  revenue: number;
  conversion_rate: number;
}

export interface PlatformStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  active_products: number;
}

export interface DailyStats {
  stats_date: string;
  revenue: number;
  order_count: number;
}

export interface SellerInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'tip';
  productId?: string;
}

/**
 * Fetches performance statistics for a specific seller's products.
 * Uses the get_seller_product_stats RPC function.
 */
export async function getSellerAnalytics(sellerId: string): Promise<SellerProductStats[]> {
  const { data, error } = await supabase.rpc('get_seller_product_stats', {
    p_seller_id: sellerId,
  });

  if (error) {
    console.error('Error fetching seller analytics:', error.message);
    return [];
  }

  return (data || []) as SellerProductStats[];
}

/**
 * Fetches time-series data for platform growth (revenue/orders).
 */
export async function getPlatformDailyStats(days = 14): Promise<DailyStats[]> {
  const { data, error } = await supabase.rpc('get_platform_daily_stats', {
    p_days: days,
  });

  if (error) {
    console.error('Error fetching platform daily stats:', error.message);
    return [];
  }

  return (data || []) as DailyStats[];
}

/**
 * Generates actionable AI insights for a seller based on their product performance data.
 */
export async function getSellerActionableInsights(sellerId: string): Promise<SellerInsight[]> {
  try {
    const stats = await getSellerAnalytics(sellerId);
    const insights: SellerInsight[] = [];

    if (!stats || stats.length === 0) {
      return [{
        title: 'Boost Visibility',
        description: 'You haven\'t had many views yet. Try optimizing your product titles with Cameroonian keywords like "Original" or "Pure".',
        type: 'tip'
      }];
    }

    // 1. Identify Star Performers
    const starPerformer = [...stats].sort((a, b) => b.revenue - a.revenue)[0];
    if (starPerformer && starPerformer.revenue > 0) {
      insights.push({
        title: 'Star Performer Detected',
        description: `"${starPerformer.title}" is your top revenue driver. Consider adding similar items or variations to capture more of this market.`,
        type: 'success',
        productId: starPerformer.product_id
      });
    }

    // 2. Identify Conversion Opportunities (High views, low sales)
    const conversionOp = stats.find(s => s.views > 10 && s.conversion_rate < 2);
    if (conversionOp) {
      insights.push({
        title: 'Conversion Opportunity',
        description: `"${conversionOp.title}" has good visibility (${conversionOp.views} views) but low sales. Try lowering the price slightly or improving the description.`,
        type: 'warning',
        productId: conversionOp.product_id
      });
    }

    // 3. Inventory Tips
    const lowStock = await supabase
      .from('products')
      .select('id, title, stock')
      .eq('seller_id', sellerId)
      .lt('stock', 5)
      .limit(1);

    if (lowStock.data && lowStock.data.length > 0) {
      insights.push({
        title: 'Restock Soon',
        description: `"${lowStock.data[0].title}" is running low on stock. Restock now to avoid losing your trending position.`,
        type: 'warning',
        productId: lowStock.data[0].id
      });
    }

    // Default tip if insights are low
    if (insights.length < 2) {
      insights.push({
        title: 'Strategic Growth',
        description: 'Products with at least 3 clear images sell 40% faster in Cameroon. Audit your listings for high-quality visuals.',
        type: 'tip'
      });
    }

    return insights;
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    return [];
  }
}

/**
 * Fetches high-level platform statistics for the admin dashboard.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [
      { data: revenueData, error: revError },
      { count: orderCount, error: ordError },
      { count: userCount, error: usrError },
      { count: productCount, error: prdError },
    ] = await Promise.all([
      supabase.from('order_items').select('unit_price, quantity'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    if (revError || ordError || usrError || prdError) {
      throw new Error('Failed to fetch platform stats');
    }

    const totalRevenue = (revenueData || []).reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    return {
      total_revenue: totalRevenue,
      total_orders: orderCount || 0,
      total_users: userCount || 0,
      active_products: productCount || 0,
    };
  } catch (error) {
    console.error('Platform stats fetch failed:', error);
    return {
      total_revenue: 0,
      total_orders: 0,
      total_users: 0,
      active_products: 0,
    };
  }
}
