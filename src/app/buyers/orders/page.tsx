'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getOrdersByBuyerId } from '@/services/order-service';
import { BuyerOrder } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, AlertTriangle } from 'lucide-react';
import ReviewForm from '@/features/ratings/ReviewForm';
import { supabase } from '@/lib/supabase';
import DisputeModal from './DisputeModal';
import { generateReceiptPDF } from '@/services/receipt-service';
import { FileText } from 'lucide-react';

export default function BuyerOrdersPage() {
  const { t, language } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dispute State
  const [disputeItemId, setDisputeItemId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('yourOrders')}</h1>
        <p className="mt-2 text-sm text-neutral-muted font-medium">{t('ordersSub')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-border p-16 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-neutral-muted">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-text">{t('noOrders')}</h2>
            <p className="mt-2 text-sm text-neutral-muted max-w-xs mx-auto">{t('noOrdersSub')}</p>
          </div>
          <Link href="/products" className="inline-flex px-8 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-hover transition-all">
            {t('shopNow')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden group hover:border-primary/30 transition-all">
              {/* Order Header */}
              <div className="p-4 sm:p-6 bg-neutral-bg/30 border-b border-neutral-border flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-neutral-border flex items-center justify-center text-neutral-muted shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Order ID</p>
                    <p className="text-sm font-black text-neutral-text font-mono truncate">{order.id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-8 lg:text-right">
                  <div className="order-1 sm:order-none">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('status') || 'Status'}</p>
                    <div className="mt-1 flex items-center lg:justify-end gap-1.5">
                       <span className={`w-2 h-2 rounded-full ${
                         order.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                       }`} />
                       <span className={`text-xs font-black uppercase ${
                         order.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                       }`}>{t(order.status) || order.status}</span>
                    </div>
                  </div>
                  <div className="order-2 sm:order-none">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('placed')}</p>
                    <p className="text-sm font-bold text-neutral-text">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="order-3 sm:order-none col-span-2 sm:col-auto">
                    <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('total')}</p>
                    <p className="text-xl font-black text-primary">{order.total_price.toLocaleString()} {t('priceCurrency')}</p>
                  </div>
                  <div className="order-4 sm:order-none flex items-center justify-end">
                    <button
                      onClick={async () => await generateReceiptPDF(order, order.items, 'buyer', language as any)}
                      className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Download Receipt"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="px-6 py-3 bg-amber-50 border-b border-neutral-border flex items-center justify-between">
                   <p className="text-xs font-medium text-amber-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('paymentPending') || 'Payment is being verified. If you already paid, it will update soon.'}
                   </p>
                   <button 
                     onClick={async () => {
                        // In a real app, this would re-check with Campay
                        alert('Checking payment status... Please wait a few moments.');
                        window.location.reload();
                     }}
                     className="text-xs font-bold text-amber-800 underline uppercase tracking-widest"
                   >
                      {t('refreshStatus') || 'Refresh Status'}
                   </button>
                </div>
              )}

              {/* Order Items */}
              <div className="p-6 space-y-6 divide-y divide-neutral-border/50">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-6 first:pt-0 space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-border group-hover:shadow-xs transition-shadow">
                      <div className="w-16 h-16 rounded-xl bg-neutral-bg overflow-hidden border border-neutral-border shrink-0">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-neutral-text truncate">{tc(item.product?.title) || item.product_id}</h4>
                        <p className="text-xs text-neutral-muted font-semibold mt-1">{t('qty')}: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('fulfillment')}</p>
                          <div className="mt-1 flex items-center justify-end gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              item.seller_status === 'shipped' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            <span className="text-xs font-black text-neutral-text uppercase">{t(item.seller_status || 'pending')}</span>
                          </div>
                        </div>
                        {item.seller_status === 'shipped' && (
                          <button
                            onClick={() => setDisputeItemId(item.id)}
                            className="p-2 hover:bg-amber-50 rounded-xl text-amber-600 transition-colors"
                            title={t('openDispute')}
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Inline Review Form for shipped/delivered items */}
                    {item.seller_status === 'shipped' && (
                      <div className="ml-4 pl-4 border-l-2 border-primary/20">
                        <ReviewForm 
                          productId={item.product_id} 
                          order_id={order.id} 
                          buyerId={user!.id} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeItemId && user && (
        <DisputeModal
          orderItemId={disputeItemId}
          userId={user.id}
          onClose={() => setDisputeItemId(null)}
          onSuccess={() => {
            setSuccessMessage(t('disputeSubmitted'));
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
}
