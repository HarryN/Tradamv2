-- Create product_clusters table for K-means clustering results
CREATE TABLE IF NOT EXISTS product_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cluster_id INT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Index for fast lookups by cluster
CREATE INDEX IF NOT EXISTS idx_product_clusters_cluster_id ON product_clusters(cluster_id);
CREATE INDEX IF NOT EXISTS idx_product_clusters_product_id ON product_clusters(product_id);

-- Enable RLS
ALTER TABLE product_clusters ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view clusters)
CREATE POLICY "product_clusters_select" ON product_clusters
  FOR SELECT USING (true);

-- Only authenticated users can write (via admin endpoint)
CREATE POLICY "product_clusters_write" ON product_clusters
  FOR INSERT USING (auth.role() = 'authenticated');

CREATE POLICY "product_clusters_delete" ON product_clusters
  FOR DELETE USING (auth.role() = 'authenticated');
