'use client';

import React, { useEffect, useState } from 'react';
import { getFrequentlyBoughtWith } from '@/services/recommendation-service';
import { Product } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Link from 'next/link';
import { ShoppingCart, Plus } from 'lucide-react';

interface FrequentlyBoughtTogetherProps {
  productId: string;
}

export default function FrequentlyBoughtTogether({ productId }: FrequentlyBoughtTogetherProps) {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      try {
        const data = await getFrequentlyBoughtWith(productId, 3);
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
    <div className="mt-12 pt-12 border-t border-neutral-border">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-neutral-text tracking-tight">{t('frequentlyBoughtTogether')}</h2>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">{t('socialProofRecommendations')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-neutral-border p-4 space-y-3 animate-pulse">
              <div className="h-32 bg-neutral-bg rounded-2xl" />
              <div className="h-4 bg-neutral-bg rounded-full w-2/3" />
              <div className="h-4 bg-neutral-bg rounded-full w-1/3" />
            </div>
          ))
        ) : (
          products.map((p) => (
            <Link 
              key={p.id} 
              href={`/products/${p.id}`}
              className="group flex flex-col bg-white border border-neutral-border rounded-[2rem] p-4 hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] bg-neutral-bg rounded-2xl overflow-hidden mb-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-text line-clamp-1 mb-1 group-hover:text-primary transition-colors">{tc(p.title)}</h3>
              <p className="text-sm font-black text-neutral-text">
                {p.price.toLocaleString()} <span className="text-xs text-primary">{t('priceCurrency')}</span>
              </p>
              
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3 h-3" />
                {t('viewDetails')}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
