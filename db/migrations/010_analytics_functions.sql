-- 010_analytics_functions.sql
-- Provides optimized functions for seller analytics and product trending logic.

-- Function to get performance stats for a specific seller's products
CREATE OR REPLACE FUNCTION get_seller_product_stats(p_seller_id uuid)
RETURNS TABLE (
    product_id uuid,
    title text,
    views bigint,
    sales_count bigint,
    revenue numeric,
    conversion_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH view_counts AS (
        SELECT ui.product_id, COUNT(*) as count
        FROM user_interactions ui
        WHERE ui.interaction_type = 'view'
        GROUP BY ui.product_id
    ),
    sale_counts AS (
        SELECT oi.product_id, COUNT(*) as count, SUM(oi.unit_price * oi.quantity) as total_revenue
        FROM order_items oi
        GROUP BY oi.product_id
    )
    SELECT 
        p.id as product_id,
        p.title,
        COALESCE(vc.count, 0) as views,
        COALESCE(sc.count, 0) as sales_count,
        COALESCE(sc.total_revenue, 0) as revenue,
        CASE 
            WHEN COALESCE(vc.count, 0) = 0 THEN 0
            ELSE (COALESCE(sc.count, 0)::numeric / vc.count::numeric) * 100
        END as conversion_rate
    FROM products p
    LEFT JOIN view_counts vc ON p.id = vc.product_id
    LEFT JOIN sale_counts sc ON p.id = sc.product_id
    WHERE p.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending products based on interaction velocity (decay weighted)
-- Returns products with the highest score in the last 7 days
CREATE OR REPLACE FUNCTION get_trending_products(p_limit int DEFAULT 10)
RETURNS TABLE (
    product_id uuid,
    trending_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.product_id,
        SUM(
            ui.weight * POWER(0.5, (EXTRACT(EPOCH FROM (now() - ui.created_at)) / 86400))
        )::numeric as score
    FROM user_interactions ui
    WHERE ui.created_at > now() - interval '7 days'
    GROUP BY ui.product_id
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get products frequently bought together
CREATE OR REPLACE FUNCTION get_frequently_bought_with(p_product_id uuid, p_limit int DEFAULT 5)
RETURNS TABLE (
    related_product_id uuid,
    co_occurrence_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi2.product_id as related_product_id,
        COUNT(*) as count
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    WHERE oi1.product_id = p_product_id 
      AND oi2.product_id <> p_product_id
    GROUP BY oi2.product_id
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
