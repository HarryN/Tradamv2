'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { supabase } from '@/lib/supabase';
import { getBuyerShoppingInsights } from '@/services/ai-service';
import { getBuyerAccountStats } from '@/services/dispute-service';
import PlatformQA from '@/components/PlatformQA';
import { useLanguage } from '@/hooks/useLanguage';
import { Loader2, Sparkles, ShoppingBag, Fingerprint, Heart, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function BuyerInsightsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [accountStats, setAccountStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      if (!user) return;
      try {
        const [{ data: history, error: historyError }, accountStats] = await Promise.all([
          supabase
            .from('order_items')
            .select('*, product:products(*), order:orders!inner(id, buyer_id)')
            .eq('order.buyer_id', user.id)
            .limit(20),
          getBuyerAccountStats(user.id),
        ]);

        if (historyError) throw historyError;
        setOrderHistory(history || []);
        setAccountStats(accountStats);
        
        const aiInsight = await getBuyerShoppingInsights(user.id, history || []);
        setInsight(aiInsight);
      } catch (err: any) {
        setError(err.message || "Failed to load insights");
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-sm font-bold text-neutral-muted uppercase tracking-widest animate-pulse">
        AI is tailoring your profile...
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-neutral-text tracking-tight">Your Shopping Persona</h1>
        </div>
        <p className="text-neutral-muted font-medium">How you shop, what you love, and what's next for you.</p>
      </header>

      {error ? (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-100 flex items-start gap-4 text-red-700">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-white rounded-[3rem] border border-neutral-border p-8 md:p-12 shadow-xl shadow-black/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Fingerprint className="w-40 h-40" />
              </div>
              
              <div className="relative prose prose-neutral max-w-none prose-headings:font-black prose-headings:text-neutral-text prose-p:text-neutral-text prose-p:leading-relaxed prose-strong:text-primary prose-li:text-neutral-text">
                <ReactMarkdown>{insight || ''}</ReactMarkdown>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-[3rem] border border-neutral-border p-8 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">Account summary</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Orders</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{orderHistory.length}</p>
                  </div>
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Spent</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{orderHistory.reduce((sum, item) => sum + ((item.unit_price ?? 0) * (item.quantity ?? 0)), 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Disputes</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{accountStats?.totalDisputes ?? 0}</p>
                  </div>
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Pending</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{accountStats?.pendingDisputes ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 border border-pink-100 rounded-[3rem] p-8">
                <div className="flex items-center gap-3 text-pink-700">
                  <Heart className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Shopping style</h3>
                </div>
                <p className="mt-4 text-sm font-bold text-neutral-text">
                  You have shopped across {new Set(orderHistory.map((o) => o.product?.category_id)).size} categories and supported {new Set(orderHistory.map((o) => o.product?.seller_id)).size} local sellers.
                </p>
              </div>
            </div>
          </div>

          <PlatformQA role="buyer" />
        </div>
      )}
    </div>
  );
}
