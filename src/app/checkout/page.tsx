'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { getCartItems } from '@/services/cart-service';
import { createPendingOrder, markOrderAsPaid, getBuyerOrderById } from '@/services/order-service';
import { CartItem, BuyerOrder } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { generateReceiptPDF } from '@/services/receipt-service';
import { Phone, Loader2, CheckCircle2, Smartphone, AlertCircle, ArrowLeft, CreditCard, FileText } from 'lucide-react';

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect sellers
  useEffect(() => {
    if (!loading && profile?.role === 'seller') {
      router.push('/products');
    }
  }, [profile, loading, router]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'pending' | 'success' | 'failed'>('idle');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<BuyerOrder | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadCart = async () => {
      setError(null);
      try {
        const cartItems = await getCartItems(user.id);
        setItems(cartItems);
      } catch (err: any) {
        setError(err?.message || t('loadCartError'));
      }
    };

    loadCart();
  }, [user, t]);

  // Status Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStep === 'pending' && paymentReference && pendingOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status/${paymentReference}`);
          const data = await res.json();

          if (data.status === 'SUCCESSFUL') {
            setPaymentStep('success');
            clearInterval(interval);
            // Once paid, mark the order as paid and clear cart
            await finalizeOrder(paymentReference, pendingOrderId);
          } else if (data.status === 'FAILED') {
            setPaymentStep('failed');
            setBusy(false);
            setError(t('paymentFailedOrCancelled'));
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStep, paymentReference, pendingOrderId]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  }, [items]);

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 9) return '237' + clean;
    if (clean.length === 12 && clean.startsWith('237')) return clean;
    return null;
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    
    const formattedPhone = validatePhone(phoneNumber);
    if (!formattedPhone) {
      setError(t('validCameroonPhone'));
      return;
    }

    setBusy(true);
    setError(null);
    setPaymentStep('initiating');

    try {
      // 1. Create a Pending Order first to ensure it's tracked
      const pendingOrder = await createPendingOrder(user.id, items, formattedPhone);
      setPendingOrderId(pendingOrder.id);

      // 2. Initiate Campay Payment
      const res = await fetch('/api/payments/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          phoneNumber: formattedPhone,
          description: `Tradam Order - ${user.email}`,
          externalReference: pendingOrder.id // Use order ID as external reference
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('paymentInitiationFailed'));
      }

      setPaymentReference(data.reference);
      setPaymentStep('pending');
    } catch (err: any) {
      setError(err.message || t('unableToInitiatePayment'));
      setBusy(false);
      setPaymentStep('failed');
    }
  };

  const finalizeOrder = async (reference: string, orderId: string) => {
    if (!user) return;
    try {
      await markOrderAsPaid(orderId, reference, user.id);
      
      // Fetch full order for receipt
      const fullOrder = await getBuyerOrderById(orderId);
      setPaidOrder(fullOrder);
      
      setSuccess(t('orderPlaced'));
    } catch (err: any) {
      setError(t('orderUpdateAfterPayment'));
      console.error('Order update error after payment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center text-neutral-muted">{t('loadingCheckout')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center">
          <h1 className="text-2xl font-bold text-neutral-text">{t('signInToContinue')}</h1>
          <p className="mt-3 text-sm text-neutral-muted">{t('checkoutSignInSub')}</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/auth/login" className="px-5 py-3 bg-primary text-white rounded-xl font-semibold">{t('logIn')}</Link>
            <Link href="/auth/signup" className="px-5 py-3 border border-neutral-border rounded-xl font-semibold">{t('getStarted')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-3xl p-10 text-center shadow-xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-text">{t('orderPlaced')}</h1>
          <p className="mt-4 text-sm text-neutral-muted leading-relaxed">{t('orderPlacedSub')}</p>
          
          <div className="mt-10 space-y-3">
            {paidOrder && (
              <button
                onClick={async () => await generateReceiptPDF(paidOrder, paidOrder.items, 'buyer')}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <FileText className="w-5 h-5" />
                {t('downloadPdfReceipt')}
              </button>
            )}
            
            <Link 
              href="/buyers/orders" 
              className="w-full flex items-center justify-center bg-white border border-neutral-border text-neutral-text px-6 py-4 rounded-2xl font-black text-sm hover:bg-neutral-bg transition-all"
            >
              {t('viewMyOrders')}
            </Link>

            <Link 
              href="/products" 
              className="w-full flex items-center justify-center text-primary px-6 py-2 rounded-2xl font-black text-sm hover:underline"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center">
          <h1 className="text-2xl font-bold text-neutral-text">{t('emptyCart')}</h1>
          <p className="mt-3 text-sm text-neutral-muted">{t('emptyCartSub')}</p>
          <Link href="/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted">{t('checkout')}</p>
            <h1 className="mt-3 text-3xl font-extrabold text-neutral-text">{t('completeOrder')}</h1>
            <p className="mt-2 text-sm text-neutral-muted">{t('checkoutSubtitle')}</p>
          </div>
          <Link href="/cart" className="hidden sm:flex items-center gap-2 text-sm font-bold text-neutral-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('backToCart')}
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            {/* Payment Method Section */}
            <div className="rounded-3xl border border-neutral-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-neutral-text">{t('paymentMethod')}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border-2 border-primary bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-neutral-border flex items-center justify-center overflow-hidden">
                      <img src="/globe.svg" alt="Mobile Money" className="w-8 h-8 opacity-20" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-text">MTN / Orange Mobile Money</p>
                      <p className="text-xs text-neutral-muted mt-0.5 italic">{t('mobileMoneyDesc')}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-neutral-muted mb-2">
                    {t('enterMobileNumber')}
                  </label>
                  <div className="relative group max-w-sm">
                    <input
                      type="text"
                      placeholder="6xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={busy}
                      className="w-full px-5 py-3.5 pl-12 rounded-2xl border border-neutral-border focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-neutral-text font-medium disabled:bg-neutral-bg disabled:text-neutral-muted"
                    />
                    <Phone className="w-5 h-5 text-neutral-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-muted px-2">{t('items')}</h2>
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-neutral-border bg-white p-5 shadow-sm group hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-2xl bg-neutral-bg overflow-hidden flex items-center justify-center border border-neutral-border shrink-0">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="text-3xl">🛍️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-neutral-text truncate">{tc(item.product?.title)}</h2>
                      <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-neutral-muted">
                        <span>{t('quantity')}: {item.quantity}</span>
                        <span>·</span>
                        <span>{item.product?.price.toLocaleString()} {t('priceCurrency')} / {t('each')}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-neutral-text">
                        {((item.product?.price ?? 0) * item.quantity).toLocaleString()} {t('priceCurrency')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-neutral-border bg-white p-6 shadow-sm sticky top-24">
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted font-bold">{t('orderSummary')}</p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between text-sm text-neutral-muted font-medium">
                  <span>{t('itemTotal')} ({items.length})</span>
                  <span>{total.toLocaleString()} {t('priceCurrency')}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-muted font-medium">
                  <span>{t('delivery')}</span>
                  <span className="text-xs italic">{t('calculatedLater')}</span>
                </div>
                
                <div className="pt-6 mt-6 border-t border-neutral-border">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-neutral-text">{t('total')}</span>
                    <span className="text-2xl font-black text-primary">{total.toLocaleString()} {t('priceCurrency')}</span>
                  </div>
                </div>
              </div>

              {paymentStep === 'pending' ? (
                <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center space-y-4 animate-in fade-in duration-500">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Smartphone className="w-6 h-6 text-primary animate-bounce" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-text">{t('waitingForPin')}</p>
                    <p className="text-[10px] text-neutral-muted mt-1 leading-relaxed">{t('checkPhonePrompt')}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">{t('verifyingTransaction')}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={busy}
                  className="mt-8 w-full group relative overflow-hidden rounded-2xl bg-primary px-6 py-4 text-sm font-extrabold text-white transition-all hover:bg-primary-hover disabled:opacity-60 shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-3">
                    {busy ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span>{busy ? (paymentStep === 'initiating' ? t('connecting') : t('processing')) : t('placeOrder')}</span>
                  </div>
                </button>
              )}

              <p className="mt-4 text-[10px] text-neutral-muted text-center leading-relaxed">
                {t('orderTermsNotice').replace('{placeOrder}', t('placeOrder'))}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
