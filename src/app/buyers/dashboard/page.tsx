'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getOrdersByBuyerId } from '@/services/order-service';
import { getCartItems } from '@/services/cart-service';
import { BuyerOrder, CartItem } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import RecommendationsList from '@/features/recommendations/RecommendationsList';

export default function BuyerDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { 
    ShoppingBag, 
    ShoppingCart, 
    Clock, 
    ChevronRight,
    ArrowRight,
    Package,
    Wallet,
    Star
  } = LucideIcons;

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [ordersData, cartData] = await Promise.all([
          getOrdersByBuyerId(user.id),
          getCartItems(user.id)
        ]);
        setOrders(ordersData);
        setCartItems(cartData);
      } catch (err) {
        console.error('Error loading buyer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const totalSpent = orders
    .filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-muted">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-text tracking-tight">
            {t('welcomeBack')}, <span className="text-primary">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-muted font-medium">
            Here's what's happening with your account today.
          </p>
        </div>
        <Link 
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98]"
        >
          {t('exploreMarketplace')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm group hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">{t('totalOrders')}</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{orders.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm group hover:border-emerald-500/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Total Spent</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{totalSpent.toLocaleString()} {t('priceCurrency')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm group hover:border-amber-500/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Active Orders</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{activeOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm group hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">In Cart</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{cartItems.length} items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Orders Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-neutral-text">Recent Orders</h2>
            <Link href="/buyers/orders" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-border p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-neutral-muted">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-sm text-neutral-muted font-medium">{t('noOrdersYet')}</p>
              </div>
            ) : (
              orders.slice(0, 3).map((order) => (
                <div key={order.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-border shadow-xs flex items-center justify-between group hover:shadow-md transition-all gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-bg flex items-center justify-center text-neutral-muted shrink-0">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-text truncate">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-neutral-text">{order.total_price.toLocaleString()} {t('priceCurrency')}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Saved/Cart Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-neutral-text">Your Cart</h2>
            <Link href="/buyers/cart" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Go to Cart <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-border p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-neutral-muted">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="text-sm text-neutral-muted font-medium">{t('emptyCart')}</p>
              </div>
            ) : (
              cartItems.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-neutral-border shadow-xs flex items-center gap-4 group hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded-xl bg-neutral-bg overflow-hidden shrink-0 border border-neutral-border">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-text truncate">{item.product?.title}</p>
                    <p className="text-xs text-neutral-muted font-semibold mt-1">
                      {item.quantity} x {item.product?.price.toLocaleString()} {t('priceCurrency')}
                    </p>
                  </div>
                  <Link 
                    href={`/products/${item.product_id}`}
                    className="p-2 rounded-lg hover:bg-neutral-bg text-neutral-muted hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Personalized Recommendations Section */}
      {user && (
        <section className="pt-8">
          <div className="flex items-center gap-2 mb-6">
             <div className="w-1.5 h-6 bg-primary rounded-full" />
             <h2 className="text-xl font-black text-neutral-text tracking-tight">Picked for You</h2>
          </div>
          <RecommendationsList userId={user.id} />
        </section>
      )}
    </div>
  );
}
