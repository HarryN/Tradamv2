# Cart / Checkout Database Migration

This folder contains the database migration required for Sprint 5 cart and checkout functionality.

## Files

- `001_create_cart_order_tables.sql` — creates the tables needed by the cart and order services:
  - `carts`
  - `cart_items`
  - `orders`
  - `order_items`
- `seed_cart_order_template.sql` — optional template for inserting a sample cart/order setup after migration.

## How to apply

### Option 1: Supabase SQL Editor
1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Create a new query.
4. Copy the full contents of `db/migrations/001_create_cart_order_tables.sql`.
5. Run the query.

### Option 2: psql / local CLI
If you have a Postgres connection string for your Supabase database, run:

```bash
psql "postgres://<db_user>:<db_pass>@<db_host>:5432/postgres" -f db/migrations/001_create_cart_order_tables.sql
```

Replace `<db_user>`, `<db_pass>`, and `<db_host>` with your Supabase connection details.

## After applying

1. Restart your local app.
2. Sign in as a buyer user.
3. Open a product page and click **Add to cart**.
4. Visit `/cart` and `/checkout`.

If any errors say a table is missing, it means the migration did not run successfully.

## Notes

- The migration intentionally does not add foreign key constraints to `products` or `profiles` because those tables may differ across environments.
- If your Supabase project already has `products`/`profiles`, you can add FK constraints manually after confirming their column names.

## Seller policies (required step)

After adding `seller_id` to `order_items` (see `002_add_seller_id_to_order_items.sql`), apply the seller RLS policies in `003_seller_order_policies.sql`.

This enables sellers to read orders and order items that belong to them without exposing other users' data.

To apply all migrations in order, run the SQL files in sequence in the Supabase SQL editor: `001_create_cart_order_tables.sql`, `002_add_seller_id_to_order_items.sql`, `003_seller_order_policies.sql`, `004_add_seller_status_to_order_items.sql`, `005_seller_update_policy.sql`, then `006_buyer_insert_order_items_policy.sql`.

