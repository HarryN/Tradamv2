'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/auth-context';
import { getOrdersForSeller, updateOrderItemStatus } from '@/services/order-service';
import { Order, OrderItem } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { generateReceiptPDF } from '@/services/receipt-service';
import { FileText } from 'lucide-react';

export default function SellerOrdersPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, loading } = useAuth();
  const [data, setData] = useState<Array<{ order: Order; items: OrderItem[] }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setError(null);
      try {
        const d = await getOrdersForSeller(user.id);
        setData(d || []);
      } catch (err: any) {
        setError(err?.message || t('loadOrdersError') || 'Unable to load orders.');
      }
    };

    load();

    const channel = supabase
      .channel('seller-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, t]);

  if (loading) return <div className="p-8">{t('loadingOrders')}</div>;
  if (!user) return (
    <div className="p-8">
      <p>{t('pleaseSignInSeller')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted">{t('storeOrders')}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-neutral-text">{t('ordersForProducts')}</h1>
          <p className="mt-2 text-sm text-neutral-muted">{t('ordersSubtitle')}</p>
        </div>

        {error && (<div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>)}

        {data.length === 0 ? (
          <div className="rounded-3xl border border-neutral-border bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-neutral-text">{t('noOrders')}</h2>
            <p className="mt-3 text-sm text-neutral-muted">{t('noOrdersSub')}</p>
            <Link href="/sellers/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm">{t('myProducts')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(({ order, items }) => (
              <div key={order.id} className="rounded-3xl border border-neutral-border bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('orderId')}</p>
                    <p className="text-sm font-black text-neutral-text font-mono truncate">{order.id}</p>
                    <p className="text-xs text-neutral-muted mt-1 font-medium">{t('placed')}: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8">
                    <div className="md:text-right">
                      <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('status')}</p>
                      <p className="text-sm font-black text-neutral-text uppercase">{t(order.status) || order.status}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('orderTotal')}</p>
                      <p className="text-lg font-black text-primary">{order.total_price.toLocaleString()} {t('priceCurrency')}</p>
                    </div>
                    <button
                      onClick={async () => await generateReceiptPDF(order, items, 'seller')}
                      className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                      title="Download Receipt"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 space-y-4 pt-6 border-t border-neutral-border/50">
                  {items.map((it) => (
                    <div key={it.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-bg/30 border border-neutral-border/50">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-text truncate">{t('product')}: {tc(it.product?.title) ?? it.product_id}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('quantity')}: {it.quantity}</p>
                          <span className="w-1 h-1 rounded-full bg-neutral-border" />
                          <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('fulfillment')}: {t(it.seller_status || 'pending')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-sm font-black text-neutral-text">{(it.unit_price ?? 0).toLocaleString()} {t('priceCurrency')}</div>
                        {it.seller_status !== 'shipped' && (
                          <button
                            onClick={async () => {
                              try {
                                await updateOrderItemStatus(it.id, 'shipped');
                                // refresh view
                                const d = await getOrdersForSeller(user.id);
                                setData(d);
                              } catch (err: any) {
                                setError(err?.message || t('statusUpdateError') || 'Unable to update status');
                              }
                            }}
                            className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                          >
                            {t('markShipped')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
