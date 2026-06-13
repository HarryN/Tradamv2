'use client';

import React, { useEffect, useState } from 'react';
import { getRelatedProducts } from '@/services/recommendation-service';
import { Product } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      try {
        const data = await getRelatedProducts(productId, 4);
        setProducts(data);
      } catch (err) {
        console.error('Failed to load related products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRelated();
  }, [productId]);

  if (!loading && products.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-text tracking-tight">{t('recommendationsTitle')}</h2>
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">{t('aiPoweredRecommendations')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-neutral-border p-4 space-y-3 animate-pulse">
              <div className="aspect-square bg-neutral-bg rounded-2xl" />
              <div className="h-4 bg-neutral-bg rounded-full w-2/3" />
              <div className="h-4 bg-neutral-bg rounded-full w-1/3" />
            </div>
          ))
        ) : (
          products.map((p) => (
            <Link 
              key={p.id} 
              href={`/products/${p.id}`}
              className="group flex flex-col bg-white border border-neutral-border rounded-[2.5rem] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-square bg-neutral-bg rounded-3xl overflow-hidden mb-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                )}
              </div>
              <div className="px-1">
                <h3 className="text-sm font-black text-neutral-text line-clamp-1 mb-1 group-hover:text-primary transition-colors">{tc(p.title)}</h3>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-neutral-muted truncate">
                    {p.seller?.display_name || t('unknownSeller')}
                  </span>
                </div>
                <p className="text-base font-black text-neutral-text">
                  {p.price.toLocaleString()} <span className="text-xs text-primary font-bold">{t('priceCurrency')}</span>
                </p>
                
                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('viewDetails')}</span>
                   <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
