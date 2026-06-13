-- seed_cart_order_template.sql
-- Use this template after running the migration.
-- Replace placeholder UUID values with actual values from your database.

-- Example buyer ID and product IDs; replace these values.
-- SET session_replication_role = replica;

INSERT INTO carts (id, buyer_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010');

INSERT INTO cart_items (id, cart_id, product_id, quantity)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 2);

-- After confirming cart works, create an order manually if needed:
-- INSERT INTO orders (id, buyer_id, status, total_price)
-- VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'pending', 199.98);
--
-- INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
-- VALUES ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000100', 2, 99.99);

-- Replace the UUID placeholders with real values from your project before running.
