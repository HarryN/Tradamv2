'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/auth-context';
import { getSellerProducts } from '@/services/product-service';
import { getOrdersForSeller } from '@/services/order-service';
import { getSellerAverageRating } from '@/services/rating-service';
import { Product } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import {
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  Star,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

import SellerAIInsights from '@/components/SellerAIInsights';

export default function SellerDashboard() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [sellerOrders, setSellerOrders] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [productsData, ordersData, ratingData] = await Promise.all([
          getSellerProducts(user.id),
          getOrdersForSeller(user.id),
          getSellerAverageRating(user.id)
        ]);
        setProducts(productsData);
        setSellerOrders(ordersData.length);
        setRating(ratingData);
      } catch (err) {
        console.error('Error loading seller dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('seller-order-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, (payload) => {
        const changedSellerId = (payload.new as { seller_id?: string } | undefined)?.seller_id ??
          (payload.old as { seller_id?: string } | undefined)?.seller_id;
        if (changedSellerId === user.id) {
          getOrdersForSeller(user.id)
            .then((orders) => setSellerOrders(orders.length))
            .catch(() => setSellerOrders(0));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const activeProducts = products.filter(p => p.is_active).length;
  const draftProducts = products.filter(p => !p.is_active).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const stats = [
    {
      name: t('totalProducts'),
      value: loading ? '–' : products.length.toString(),
      sub: `${activeProducts} ${t('live')} · ${draftProducts} ${t('draft')}`,
      icon: Package,
      color: 'text-primary bg-primary/10',
    },
    {
      name: t('inventoryValue'),
      value: loading ? '–' : `${totalValue.toLocaleString()} ${t('priceCurrency')}`,
      sub: t('basedOnStock'),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      name: t('totalOrders'),
      value: loading ? '–' : sellerOrders.toString(),
      sub: t('ordersForProducts'),
      icon: ShoppingBag,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      name: t('storeRating'),
      value: rating.count > 0 ? `${rating.average} ★` : '–',
      sub: rating.count > 0 ? `${rating.count} reviews` : t('noReviews'),
      icon: Star,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  const recentProducts = products.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-text">
            {t('welcomeBack')}, <span className="text-primary">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-muted font-medium">
            {t('sellerDashboardIntro')}
          </p>
        </div>
        <Link
          href="/sellers/products/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('addProduct')}
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Recent Products */}
        <div className="xl:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-neutral-border p-5 flex items-start gap-4 shadow-xs hover:shadow-md transition-shadow duration-300">
                  <div className={`p-3 rounded-xl shrink-0 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">{s.name}</p>
                    <p className="text-xl font-extrabold text-neutral-text mt-1 truncate">{s.value}</p>
                    <p className="text-xs text-neutral-muted mt-0.5">{s.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Products Table */}
          <div className="bg-white rounded-2xl border border-neutral-border shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-neutral-text">{t('recentProducts')}</h2>
              <Link
                href="/sellers/products"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
              >
                {t('viewAll')}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="divide-y divide-neutral-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-neutral-border/40 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-neutral-border/40 rounded w-2/3" />
                      <div className="h-2.5 bg-neutral-border/30 rounded w-1/3" />
                    </div>
                    <div className="h-3 bg-neutral-border/40 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-4">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-neutral-text">{t('noProductsYet')}</h3>
                <p className="mt-2 text-sm text-neutral-muted max-w-xs">
                  {t('startByAdding')}
                </p>
                <Link
                  href="/sellers/products/new"
                  className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('addFirstProduct')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-border">
                {recentProducts.map((product) => (
                  <div key={product.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-neutral-bg/30 transition-colors group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Image */}
                      <div className="w-12 h-12 rounded-xl bg-neutral-bg border border-neutral-border flex items-center justify-center overflow-hidden shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-neutral-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-text truncate group-hover:text-primary transition-colors">
                          {tc(product.title)}
                        </p>
                        <p className="text-xs text-neutral-muted mt-0.5">
                          {t(product.category?.name || 'uncategorized')} · {product.stock} {t('inStock')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Price */}
                      <p className="text-sm font-extrabold text-neutral-text">
                        {product.price.toLocaleString()} {t('priceCurrency')}
                      </p>

                      {/* Status badge */}
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        product.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-neutral-bg text-neutral-muted border border-neutral-border'
                      }`}>
                        {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.is_active ? t('live') : t('draft')}
                      </span>

                      {/* Edit link */}
                      <Link
                        href={`/sellers/products/${product.id}/edit`}
                        className="p-1.5 rounded-lg text-neutral-muted hover:text-primary hover:bg-primary/5 transition-colors sm:opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-8">
          {user && <SellerAIInsights sellerId={user.id} />}
          
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">CTO Note</h3>
            <p className="text-xs font-medium text-neutral-muted leading-relaxed">
              Our AI analysis leverages weighted interaction velocity and cluster performance benchmarking to give you the most accurate growth tips.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
