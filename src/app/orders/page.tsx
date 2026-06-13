'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getOrdersByBuyerId } from '@/services/order-service';
import { BuyerOrder } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

export default function OrdersPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      setError(null);
      try {
        const data = await getOrdersByBuyerId(user.id);
        setOrders(data);
      } catch (err: any) {
        setError(err?.message || t('loadOrdersError') || 'Unable to load orders.');
      }
    };

    loadOrders();
  }, [user, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center text-neutral-muted">{t('loadingOrders')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center">
          <h1 className="text-2xl font-bold text-neutral-text">{t('signInToViewOrders')}</h1>
          <p className="mt-3 text-sm text-neutral-muted">{t('signInToViewOrdersSub')}</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/auth/login" className="px-5 py-3 bg-primary text-white rounded-xl font-semibold">{t('logIn')}</Link>
            <Link href="/auth/signup" className="px-5 py-3 border border-neutral-border rounded-xl font-semibold">{t('getStarted')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted">{t('orderHistory')}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-neutral-text">{t('yourOrders')}</h1>
          <p className="mt-2 text-sm text-neutral-muted">{t('ordersSub')}</p>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-neutral-border bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-neutral-text">{t('noOrders')}</h2>
            <p className="mt-3 text-sm text-neutral-muted">{t('noOrdersSub')}</p>
            <Link href="/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-neutral-border bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-muted">{t('orderId')}</p>
                    <p className="text-lg font-semibold text-neutral-text break-all">{order.id}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm text-neutral-muted">{t('status')}</p>
                    <p className="font-semibold text-neutral-text capitalize">{t(order.status) || order.status}</p>
                    <p className="text-sm text-neutral-muted">{t('total')}</p>
                    <p className="font-semibold text-neutral-text">{order.total_price.toLocaleString()} {t('priceCurrency')}</p>
                    <p className="text-sm text-neutral-muted">{t('placed')}</p>
                    <p className="text-sm text-neutral-text">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {order.items.length > 0 && (
                    <div className="rounded-3xl border border-neutral-border bg-neutral-50 p-4">
                      <h2 className="text-sm font-semibold text-neutral-text">{t('itemFulfillment')}</h2>
                      <div className="mt-3 space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-neutral-border bg-white p-4">
                            <div>
                              <p className="text-sm font-semibold text-neutral-text">{tc(item.product?.title) ?? item.product_id}</p>
                              <p className="text-xs text-neutral-muted">{t('qty')}: {item.quantity}</p>
                            </div>
                            <div className="text-sm text-right">
                              <p className="text-neutral-muted">{t('fulfillment')}</p>
                              <p className="font-semibold text-neutral-text capitalize">{t(item.seller_status || 'pending')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
