-- 019_add_product_foreign_keys.sql
-- Add foreign key constraints to products and profiles if they don't exist
-- This enables Supabase joins in the frontend

DO $$ 
BEGIN
  -- Link products to categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_products_category'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT fk_products_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- Link products to sellers (profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_products_seller'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT fk_products_seller 
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
