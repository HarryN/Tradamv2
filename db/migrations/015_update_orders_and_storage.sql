-- 015_update_orders_and_storage.sql
-- Adds necessary columns to orders and sets up storage for dispute evidence

-- Add columns to orders if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_reference') THEN
    ALTER TABLE orders ADD COLUMN payment_reference text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_phone') THEN
    ALTER TABLE orders ADD COLUMN payment_phone text;
  END IF;
END $$;

-- Ensure status is a text column (it already is, but good to ensure)
-- ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Create Storage Bucket for Dispute Evidence (requires supabase_storage extension)
-- Note: In a real Supabase environment, this is often done via the UI or a specific API call.
-- We'll add the policy for it here.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('dispute-evidence', 'dispute-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for dispute-evidence bucket
CREATE POLICY "Anyone can view dispute evidence" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'dispute-evidence');

CREATE POLICY "Authenticated users can upload dispute evidence" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'dispute-evidence');

-- End of migration
