-- Create user_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'cart_add', 'purchase'
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_product_id ON user_interactions(product_id);

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interactions
CREATE POLICY "user_interactions_insert" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see their own interactions
CREATE POLICY "user_interactions_select" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin/Service role can see all interactions for clustering
CREATE POLICY "user_interactions_select_all" ON user_interactions
  FOR SELECT USING (true);
