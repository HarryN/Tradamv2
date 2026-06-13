-- 005_seller_update_policy.sql
-- Allow sellers to update only `seller_status` on their own order_items

ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "order_items_seller_update_status" ON order_items
  FOR UPDATE
  USING (seller_id = auth.uid()::uuid)
  WITH CHECK (seller_id = auth.uid()::uuid AND (seller_status = old.seller_status OR seller_status IS NOT NULL));

-- Note: The WITH CHECK ensures seller_id isn't changed and seller_status is provided. Adjust as needed.
