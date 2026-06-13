-- 012_create_dispute_messages.sql
-- Enables real-time chat between buyer, seller, and admin for dispute resolution.

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON public.dispute_messages(created_at);

-- RLS Policies for dispute_messages
-- 1. Parties involved in the dispute can view messages
CREATE POLICY "Users involved in dispute can view messages"
  ON public.dispute_messages FOR SELECT
  USING (
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

-- 2. Parties involved in the dispute can send messages
CREATE POLICY "Users involved in dispute can send messages"
  ON public.dispute_messages FOR INSERT
  WITH CHECK (
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
