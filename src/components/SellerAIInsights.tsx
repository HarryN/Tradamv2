'use client';

import React, { useEffect, useState } from 'react';
import { getSellerActionableInsights, SellerInsight } from '@/services/analytics-service';
import { useLanguage } from '@/hooks/useLanguage';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SellerAIInsightsProps {
  sellerId: string;
}

export default function SellerAIInsights({ sellerId }: SellerAIInsightsProps) {
  const { t } = useLanguage();
  const [insights, setInsights] = useState<SellerInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        const data = await getSellerActionableInsights(sellerId);
        setInsights(data);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-border p-6 shadow-xs animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 bg-neutral-border/40 rounded" />
          <div className="h-4 bg-neutral-border/40 rounded w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-neutral-bg/30">
              <div className="w-10 h-10 rounded-lg bg-neutral-border/40 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-border/40 rounded w-1/4" />
                <div className="h-2.5 bg-neutral-border/30 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-neutral-border bg-neutral-bg/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-neutral-text uppercase tracking-widest">{t('aiConsultantInsights')}</h2>
        </div>
        <span className="text-[10px] font-bold text-neutral-muted uppercase tracking-tighter bg-white px-2 py-0.5 rounded-full border border-neutral-border">{t('beta')}</span>
      </div>

      <div className="p-4 space-y-3">
        {insights.map((insight, idx) => {
          const isWarning = insight.type === 'warning';
          const isSuccess = insight.type === 'success';
          const isTip = insight.type === 'tip';

          return (
            <div 
              key={idx} 
              className={`flex gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                isWarning ? 'bg-amber-50/50 border-amber-100' :
                isSuccess ? 'bg-emerald-50/50 border-emerald-100' :
                'bg-blue-50/50 border-blue-100'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 h-fit ${
                isWarning ? 'bg-amber-100 text-amber-600' :
                isSuccess ? 'bg-emerald-100 text-emerald-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {isWarning ? <AlertCircle className="w-5 h-5" /> :
                 isSuccess ? <CheckCircle2 className="w-5 h-5" /> :
                 <Lightbulb className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <h3 className={`text-sm font-black leading-none mb-1.5 ${
                  isWarning ? 'text-amber-900' :
                  isSuccess ? 'text-emerald-900' :
                  'text-blue-900'
                }`}>
                  {t(insight.title.toLowerCase().replace(/\s+/g, '')) || insight.title}
                </h3>
                <p className="text-xs font-medium text-neutral-muted leading-relaxed">
                  {insight.description}
                </p>
                
                {insight.productId && (
                  <Link 
                    href={`/sellers/products/${insight.productId}/edit`}
                    className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      isWarning ? 'text-amber-700 hover:text-amber-800' :
                      isSuccess ? 'text-emerald-700 hover:text-emerald-800' :
                      'text-blue-700 hover:text-blue-800'
                    }`}
                  >
                    {t('takeAction')}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
