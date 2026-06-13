-- 004_add_seller_status_to_order_items.sql
-- Adds a seller_status column to order_items to track fulfillment per-seller.

ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS seller_status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_order_items_seller_status ON order_items (seller_status);

-- End
