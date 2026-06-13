-- 003_seller_order_policies.sql
-- Grants read access for sellers to orders and order_items that belong to them.

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;

-- Allow sellers to SELECT order_items where they are the seller
CREATE POLICY IF NOT EXISTS "order_items_seller_select" ON order_items
  FOR SELECT
  USING (seller_id = auth.uid()::uuid);

-- Allow sellers to SELECT orders that contain at least one order_item for them
CREATE POLICY IF NOT EXISTS "orders_seller_select" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi WHERE oi.order_id = orders.id AND oi.seller_id = auth.uid()::uuid
    )
  );

-- Note: Keep buyer policies intact (buyers should still be able to view their own orders).
-- If you also want sellers to be able to update order status, add appropriate UPDATE policies.

-- End
