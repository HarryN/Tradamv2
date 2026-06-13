'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPublicProductById } from '@/services/product-service';
import { Product } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import AddToCartButton from '@/features/cart/AddToCartButton';
import TrendingProducts from '@/components/TrendingProducts';
import RelatedProducts from '@/components/RelatedProducts';
import { getSellerAverageRating } from '@/services/rating-service';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  Star, 
  Store,
  Loader2,
  Package,
  MapPin,
  StarHalf
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [sellerRating, setSellerRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        const data = await getPublicProductById(id);
        setProduct(data);

        if (data?.seller_id) {
          const rating = await getSellerAverageRating(data.seller_id);
          setSellerRating(rating);
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3.5 h-3.5 text-neutral-border" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold text-neutral-muted uppercase tracking-widest">{t('loading')}...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-muted mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-neutral-text mb-2">{t('productNotFound')}</h1>
        <p className="text-neutral-muted mb-8 max-w-md">{t('productNotFoundSub')}</p>
        <Link href="/products" className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
          {t('backToMarketplace')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-bg pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Breadcrumbs / Back button */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[10px] sm:text-xs font-black text-neutral-muted uppercase tracking-widest hover:text-primary transition-colors mb-6 sm:mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToMarketplace')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Left Column: Image */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-3xl sm:rounded-[3rem] border border-neutral-border overflow-hidden relative group">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl select-none">🛍️</div>
              )}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {product.category?.name && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    {tc(product.category.name)}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-text tracking-tight mb-4">
                {tc(product.title)}
              </h1>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black text-neutral-text">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-lg font-black text-primary uppercase">{t('priceCurrency')}</span>
              </div>

              <div className="bg-white border border-neutral-border rounded-3xl p-6 space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-bg flex items-center justify-center text-neutral-muted">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-muted uppercase tracking-widest">{t('stock')}</p>
                      <p className="text-sm font-black text-neutral-text">{product.stock} {t('inStock')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-bg flex items-center justify-center text-neutral-muted">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-muted uppercase tracking-widest">{t('delivery')}</p>
                      <p className="text-sm font-black text-neutral-text">{t('deliveryWindow')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-neutral-border">
                  <AddToCartButton productId={product.id} />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-neutral-muted uppercase tracking-widest mb-3">{t('description')}</h3>
                  <p className="text-neutral-muted text-sm leading-relaxed whitespace-pre-line">
                    {tc(product.description)}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-900/5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">{t('tradamVerified')}</p>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-emerald-700 font-bold leading-tight mt-0.5">{t('authenticityGuaranteed')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-neutral-border shadow-sm group hover:border-primary/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-bg flex items-center justify-center text-neutral-muted group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300 shrink-0 overflow-hidden">
                      {product.seller?.profile_picture_url ? (
                        <img 
                          src={product.seller.profile_picture_url || undefined} 
                          alt={product.seller.display_name || t('seller')} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Store className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black text-neutral-muted uppercase tracking-widest leading-none">{t('seller')}</p>
                      </div>
                      <p className="text-base font-black text-neutral-text mt-1 truncate">
                        {product.seller?.display_name || t('unknownSeller')}
                      </p>
                      
                      {/* Seller Rating Display */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {renderStars(sellerRating.average)}
                        </div>
                        <span className="text-[11px] font-black text-neutral-text">
                          {sellerRating.average > 0 ? sellerRating.average : ''}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-muted">
                          ({sellerRating.count} {sellerRating.count === 1 ? t('review') : t('reviews')})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3 h-3 text-neutral-muted" />
                        <p className="text-[11px] font-bold text-neutral-muted">
                          {product.seller?.location || t('sellerLocationFallback')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <RelatedProducts productId={product.id} />
        
        <div className="mt-20">
          <TrendingProducts />
        </div>
      </div>
    </div>
  );
}
