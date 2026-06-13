-- 013_platform_daily_stats.sql
-- Provides time-series data for the admin dashboard growth chart.

CREATE OR REPLACE FUNCTION get_platform_daily_stats(p_days int DEFAULT 14)
RETURNS TABLE (
    stats_date date,
    revenue numeric,
    order_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            current_date - (p_days - 1) * interval '1 day',
            current_date,
            interval '1 day'
        )::date as d
    ),
    daily_revenue AS (
        SELECT 
            o.created_at::date as r_date,
            SUM(oi.unit_price * oi.quantity) as total_rev,
            COUNT(DISTINCT o.id) as daily_orders
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.status = 'paid' OR o.status = 'delivered'
        GROUP BY o.created_at::date
    )
    SELECT 
        ds.d as stats_date,
        COALESCE(dr.total_rev, 0) as revenue,
        COALESCE(dr.daily_orders, 0) as order_count
    FROM date_series ds
    LEFT JOIN daily_revenue dr ON ds.d = dr.r_date
    ORDER BY ds.d ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
