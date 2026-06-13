-- ============================================================================
-- SUPABASE MIGRATION: Fix Dispute System for AI Insights
-- Date: 2026-06-06
-- Purpose: Ensure dispute tables, RLS policies, and realtime are properly configured
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify existing tables exist and have correct structure
-- ============================================================================

-- Ensure disputes table exists
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL,
  reason text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolution text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure dispute_messages table exists (no foreign key to profiles - just sender_id)
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure dispute_evidence table exists
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL,
  evidence_type text NOT NULL,
  evidence_url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 2: Create/Replace Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_disputes_order_item_id ON public.disputes(order_item_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON public.disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON public.dispute_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop existing RLS policies (to avoid duplicates)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes for their own order items" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can view evidence for their disputes" ON public.dispute_evidence;
DROP POLICY IF EXISTS "Users can insert evidence for their disputes" ON public.dispute_evidence;
DROP POLICY IF EXISTS "Users involved in dispute can view messages" ON public.dispute_messages;
DROP POLICY IF EXISTS "Users involved in dispute can send messages" ON public.dispute_messages;

-- ============================================================================
-- STEP 5: Create RLS Policies for disputes
-- ============================================================================

-- Policy 1: Users can view disputes they are involved in
CREATE POLICY "Users can view their own disputes" ON public.disputes
  FOR SELECT USING (
    auth.uid() = initiator_id OR 
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = disputes.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy 2: Users can create disputes for their own order items
CREATE POLICY "Users can create disputes for their own order items" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = initiator_id AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE oi.id = order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
    )
  );

-- Policy 3: Only admins can update disputes
CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: Create RLS Policies for dispute_messages
-- ============================================================================

-- Policy 1: Parties involved in the dispute can view messages
CREATE POLICY "Users involved in dispute can view messages" ON public.dispute_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.order_items oi
          JOIN public.orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- Policy 2: Parties involved in the dispute can send messages
CREATE POLICY "Users involved in dispute can send messages" ON public.dispute_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.order_items oi
          JOIN public.orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- STEP 7: Create RLS Policies for dispute_evidence
-- ============================================================================

CREATE POLICY "Users can view evidence for their disputes" ON public.dispute_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_evidence.dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.order_items oi
          JOIN public.orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can insert evidence for their disputes" ON public.dispute_evidence
  FOR INSERT WITH CHECK (
    auth.uid() = submitter_id AND
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_id AND (
        d.initiator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.order_items oi
          JOIN public.orders o ON oi.order_id = o.id
          WHERE oi.id = d.order_item_id AND (o.buyer_id = auth.uid() OR oi.seller_id = auth.uid())
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- STEP 8: Enable Realtime Publication
-- ============================================================================

-- Ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to publication (idempotent - use ALTER PUBLICATION ... ADD IF NOT EXISTS if available)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS dispute_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS dispute_evidence;

-- ============================================================================
-- STEP 9: Verify Profiles table has 'role' column (required for RLS)
-- ============================================================================

-- Ensure the profiles table has a role column
-- This assumes profiles table exists; adjust if needed
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'buyer';

-- ============================================================================
-- DONE
-- ============================================================================
-- Execute this SQL in Supabase SQL Editor to update the database schema
-- All dispute-related tables and policies should now work correctly with the new AI insights feature
