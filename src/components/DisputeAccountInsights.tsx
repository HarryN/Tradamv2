'use client';

import React, { useEffect, useState } from 'react';
import { Dispute } from '@/types';
import { getDisputeAccountInsights } from '@/services/ai-service';
import { getBuyerAccountStats, getSellerAccountStats } from '@/services/dispute-service';
import { Loader2, ShieldAlert, Sparkles } from 'lucide-react';

interface DisputeAccountInsightsProps {
  dispute: Dispute;
  buyerId: string;
  sellerId: string;
}

export default function DisputeAccountInsights({ dispute, buyerId, sellerId }: DisputeAccountInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dispute || !buyerId || !sellerId) {
      setLoading(false);
      if (!buyerId || !sellerId) {
        setError('Missing buyer or seller account ID for AI insight.');
      }
      return;
    }

    async function loadInsight() {
      setLoading(true);
      setError(null);
      try {
        const [buyerStats, sellerStats] = await Promise.all([
          getBuyerAccountStats(buyerId),
          getSellerAccountStats(sellerId),
        ]);

        const insightText = await getDisputeAccountInsights(dispute, buyerStats, sellerStats);
        setInsight(insightText);
      } catch (err: any) {
        console.error('Failed to load dispute account insight:', err);
        setError(err?.message || 'Failed to generate AI insight');
      } finally {
        setLoading(false);
      }
    }

    loadInsight();
  }, [dispute, buyerId, sellerId]);

  return (
    <div className="bg-white rounded-3xl border border-neutral-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-muted">AI Account Insight</p>
          <h2 className="text-lg font-black text-neutral-text">Buyer / Seller Risk Summary</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-neutral-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Analyzing dispute accounts...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-rose-700">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-neutral-text whitespace-pre-wrap">{insight || 'No insight available.'}</div>
      )}

      <p className="mt-4 text-[11px] text-neutral-muted">AI insight is advisory and should be used to help inform dispute review.</p>
    </div>
  );
}
