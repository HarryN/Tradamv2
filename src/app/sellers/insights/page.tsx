'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getSellerAnalytics } from '@/services/analytics-service';
import { getAccountAnalysis, getSellerStoreInsights } from '@/services/ai-service';
import { getSellerAccountStats } from '@/services/dispute-service';
import PlatformQA from '@/components/PlatformQA';
import { useLanguage } from '@/hooks/useLanguage';
import { Loader2, Sparkles, TrendingUp, Target, Lightbulb, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getSellerProducts } from '@/services/product-service';
import { getOrdersForSeller } from '@/services/order-service';

export default function SellerInsightsPage() {
  const { user, profile } = useAuth();
  const { locale, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [accountAnalysis, setAccountAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [accountStats, setAccountStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      if (!user) return;
      try {
        const [sellerStats, disputeStats, products, orders] = await Promise.all([
          getSellerAnalytics(user.id),
          getSellerAccountStats(user.id),
          getSellerProducts(user.id),
          getOrdersForSeller(user.id),
        ]);

        setStats(sellerStats);
        setAccountStats(disputeStats);

        const aiInsight = await getSellerStoreInsights(user.id, sellerStats);
        setInsight(aiInsight);

        const language = locale === 'fr' ? 'French' : 'English';
        const activeProducts = (products || []).filter((p) => p.is_active).length;
        const draftProducts = (products || []).filter((p) => !p.is_active).length;
        const inventoryValue = (products || []).reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
        const orderCount = (orders || []).length;
        const totalItemsSold = (orders || []).reduce((sum, o) => sum + (o.items || []).reduce((s2, it) => s2 + (it.quantity || 0), 0), 0);
        const grossRevenue = (orders || []).reduce((sum, o) => sum + (o.items || []).reduce((s2, it) => s2 + (it.quantity || 0) * (it.unit_price || 0), 0), 0);

        const analysis = await getAccountAnalysis({
          role: 'seller',
          language,
          accountSnapshot: {
            profile: {
              display_name: profile?.display_name || null,
              location: profile?.location || null,
              phone: profile?.phone || null,
            },
            products: {
              total: products?.length ?? 0,
              active: activeProducts,
              drafts: draftProducts,
              inventory_value_fcfa: inventoryValue,
            },
            orders: {
              orders_with_items: orderCount,
              total_items_sold: totalItemsSold,
              gross_revenue_fcfa: grossRevenue,
            },
            disputes: disputeStats,
            product_performance: sellerStats?.slice(0, 8) ?? [],
          }
        });
        setAccountAnalysis(analysis);
      } catch (err: any) {
        setError(err.message || "Failed to load insights");
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [user, profile, locale]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-sm font-bold text-neutral-muted uppercase tracking-widest animate-pulse">
        AI is analyzing your store...
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
          <h1 className="text-3xl font-black text-neutral-text tracking-tight">Store AI Insights</h1>
        </div>
        <p className="text-neutral-muted font-medium">Strategic analysis of your business performance on Tradam.</p>
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
                <TrendingUp className="w-40 h-40" />
              </div>
              
              <div className="relative prose prose-neutral max-w-none prose-headings:font-black prose-headings:text-neutral-text prose-p:text-neutral-text prose-p:leading-relaxed prose-strong:text-primary prose-li:text-neutral-text">
                {accountAnalysis && (
                  <div className="mb-8">
                    <ReactMarkdown>{accountAnalysis}</ReactMarkdown>
                  </div>
                )}
                <ReactMarkdown>{insight || ''}</ReactMarkdown>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-[3rem] border border-neutral-border p-8 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">Store account summary</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Products</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{stats.length}</p>
                  </div>
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Open disputes</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{accountStats?.pendingDisputes ?? 0}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Resolved disputes</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{accountStats?.resolvedDisputes ?? 0}</p>
                  </div>
                  <div className="rounded-3xl bg-neutral-bg/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-muted">Dispute total</p>
                    <p className="mt-2 text-3xl font-black text-neutral-text">{accountStats?.totalDisputes ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-8">
                <div className="flex items-center gap-3 text-amber-700">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Growth tip</h3>
                </div>
                <p className="mt-4 text-sm font-bold text-neutral-text">
                  Focus on products with high views but low conversion. These are your hidden gems that need better photos, pricing, or descriptions.
                </p>
              </div>
            </div>
          </div>

          <PlatformQA role="seller" />
        </div>
      )}
    </div>
  );
}
