-- 006_buyer_insert_order_items_policy.sql
-- Allow buyers to insert order_items when creating orders (via checkout)
-- This policy permits any authenticated user to insert order_items with any seller_id
-- (the business logic ensures seller_id matches the product's seller)

ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to INSERT order_items
CREATE POLICY IF NOT EXISTS "order_items_buyer_insert" ON order_items
  FOR INSERT
  WITH CHECK (true);

-- Allow buyers to SELECT their own orders (via orders table, which has its own policy)
CREATE POLICY IF NOT EXISTS "orders_buyer_select" ON orders
  FOR SELECT
  USING (buyer_id = auth.uid()::uuid);

-- Allow buyers to UPDATE their own orders (if needed for future features)
CREATE POLICY IF NOT EXISTS "orders_buyer_update" ON orders
  FOR UPDATE
  USING (buyer_id = auth.uid()::uuid)
  WITH CHECK (buyer_id = auth.uid()::uuid);

-- End
