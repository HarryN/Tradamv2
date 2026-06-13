'use client';

import React, { useEffect, useState } from 'react';
import { getTrendingProducts } from '@/services/recommendation-service';
import { Product } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Link from 'next/link';
import { Flame, ChevronRight, ShoppingBag } from 'lucide-react';

export default function TrendingProducts() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      try {
        const data = await getTrendingProducts(8);
        setProducts(data);
      } catch (err) {
        console.error('Failed to load trending products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-text tracking-tight">{t('trendingInCameroon')}</h2>
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">{t('mostActiveThisWeek')}</p>
          </div>
        </div>
        
        <Link 
          href="/buyers/marketplace" 
          className="group flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest hover:gap-2 transition-all"
        >
          {t('viewAll')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[280px] w-[280px] h-[380px] bg-white rounded-[2.5rem] border border-neutral-border p-5 space-y-4 animate-pulse">
              <div className="h-48 bg-neutral-bg rounded-[2rem]" />
              <div className="h-4 bg-neutral-bg rounded-full w-2/3" />
              <div className="h-8 bg-neutral-bg rounded-xl" />
            </div>
          ))
        ) : (
          products.map((p) => (
            <Link 
              key={p.id} 
              href={`/products/${p.id}`} 
              className="group min-w-[280px] w-[280px] bg-white border border-neutral-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="relative aspect-square bg-neutral-bg flex items-center justify-center overflow-hidden m-2 rounded-[2rem]">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="text-5xl">🛍️</div>
                )}
                
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-orange-500/20">
                   <Flame className="w-3 h-3 fill-current" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{t('trending')}</span>
                </div>
              </div>
              
              <div className="p-6 pt-2 space-y-3">
                <h3 className="text-sm font-black text-neutral-text line-clamp-1 leading-tight group-hover:text-primary transition-colors">{tc(p.title)}</h3>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-muted truncate">
                    {p.seller?.display_name || t('unknownSeller')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-neutral-text">
                    {p.price.toLocaleString()} <span className="text-xs text-primary">{t('priceCurrency')}</span>
                  </p>
                  <div className="p-2 rounded-xl bg-neutral-bg text-neutral-muted group-hover:bg-primary group-hover:text-white transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
