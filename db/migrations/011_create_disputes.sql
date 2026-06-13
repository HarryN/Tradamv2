-- 011_create_disputes.sql
-- Create disputes and dispute_evidence tables for the Dispute Resolution Center

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL, -- The user (buyer or seller) who opened the dispute
  reason text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, under_review, resolved, appealed, closed
  resolution text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_item_id ON disputes (order_item_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON disputes (initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL,
  evidence_type text NOT NULL, -- image, document, message_log
  evidence_url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON dispute_evidence (dispute_id);

-- Enable RLS for disputes (basic policies)
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Policies for disputes:
-- 1. Users can view disputes they are involved in (initiator or part of the order)
CREATE POLICY "Users can view their own disputes" ON disputes
  FOR SELECT USING (
    auth.uid() = initiator_id OR 
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = disputes.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
    )
  );

-- 2. Users can create disputes for their own order items
CREATE POLICY "Users can create disputes for their own order items" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid() = initiator_id AND
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
    )
  );

-- 3. Only admins can update status/resolution (for simplicity, we might need a role check)
-- For now, let's assume admins have bypass or we add a specific policy if roles are in profiles.
CREATE POLICY "Admins can update disputes" ON disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for evidence:
CREATE POLICY "Users can view evidence for their disputes" ON dispute_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_evidence.dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can insert evidence for their disputes" ON dispute_evidence
  FOR INSERT WITH CHECK (
    auth.uid() = submitter_id AND
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        )
      )
    )
  );
