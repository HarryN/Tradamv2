-- 002_add_seller_id_to_order_items.sql
-- Adds seller_id to order_items so orders can be attributed to sellers directly.

ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS seller_id uuid;

CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items (seller_id);

-- Backfill seller_id from products when possible
-- This will set order_items.seller_id to products.seller_id when the product exists
UPDATE order_items oi
SET seller_id = p.seller_id
FROM products p
WHERE oi.product_id = p.id AND oi.seller_id IS NULL;

-- Note: After applying this migration, `createOrderFromCart` should set `seller_id` on new inserts.
