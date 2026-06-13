'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import { getPersonalizedRecommendations } from '@/services/recommendation-service';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Link from 'next/link';
import { ShoppingCart, Star, ChevronRight, Loader2 } from 'lucide-react';
import AddToCartButton from '@/features/cart/AddToCartButton';

interface RecommendationsListProps {
  userId: string;
}

export default function RecommendationsList({ userId }: RecommendationsListProps) {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getPersonalizedRecommendations(userId);
        setProducts(data);
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 bg-neutral-bg rounded-3xl text-center">
        <p className="text-neutral-muted font-bold">{t('clusterFallback')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group bg-white rounded-2xl sm:rounded-3xl border border-neutral-border p-3 sm:p-4 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
          <Link href={`/products/${product.id}`}>
            <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-bg relative mb-3 sm:mb-4">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">📦</div>
              )}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </Link>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
              <Link href={`/products/${product.id}`} className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-neutral-text line-clamp-1 group-hover:text-primary transition-colors">
                  {tc(product.title)}
                </h3>
              </Link>
              <span className="text-xs sm:text-sm font-black text-primary shrink-0">
                {product.price.toLocaleString()} {t('priceCurrency')}
              </span>
            </div>

            <p className="text-[10px] sm:text-xs text-neutral-muted line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
              {tc(product.description)}
            </p>

            <div className="pt-1.5 sm:pt-2">
              <AddToCartButton productId={product.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
