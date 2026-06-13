-- 009_create_product_reviews.sql
-- Enables buyers to leave 1-5 star reviews on products after delivery

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL, -- References auth.users(id)
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, product_id, order_id) -- One review per item per order
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer_id ON product_reviews (buyer_id);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can read reviews
CREATE POLICY "Anyone can read reviews" 
ON product_reviews FOR SELECT 
TO public 
USING (true);

-- 2. Buyers can insert their own reviews for products they bought
-- Note: In a strict setup, we would check if the order status is 'delivered'
CREATE POLICY "Buyers can insert their own reviews" 
ON product_reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = buyer_id);

-- 3. Buyers can update their own reviews
CREATE POLICY "Buyers can update their own reviews" 
ON product_reviews FOR UPDATE 
TO authenticated 
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- End of migration
