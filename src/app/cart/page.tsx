'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { getCartItems, removeCartItem, updateCartItemQuantity } from '@/services/cart-service';
import { CartItem } from '@/types';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

export default function CartPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleQuantity = async (item: CartItem, newQuantity: number) => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateCartItemQuantity(item.id, newQuantity);
      setItems((prev) => prev
        .map((i) => (i.id === item.id ? updated ?? null : i))
        .filter((i): i is CartItem => i !== null)
      );
    } catch (err: any) {
      setError(err?.message || t('statusUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      await removeCartItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err: any) {
      setError(err?.message || t('removeError'));
    } finally {
      setSaving(false);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center text-neutral-muted">{t('loading')}…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-bg py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white border border-neutral-border rounded-3xl p-10 text-center">
          <h1 className="text-2xl font-bold text-neutral-text">{t('signInToViewCart')}</h1>
          <p className="mt-3 text-sm text-neutral-muted">{t('signInToViewCartSub')}</p>
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
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted">{t('shoppingCart')}</p>
            <h1 className="mt-3 text-3xl font-extrabold text-neutral-text">{t('reviewItems')}</h1>
            <p className="mt-2 text-sm text-neutral-muted">{t('cartSubtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-neutral-border bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-neutral-text">{t('emptyCart')}</h2>
            <p className="mt-3 text-sm text-neutral-muted">{t('emptyCartSub')}</p>
            <Link href="/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-neutral-border bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-24 w-24 rounded-3xl bg-neutral-bg overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-3xl">🛍️</div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-neutral-text">{tc(item.product?.title)}</h2>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-neutral-muted truncate">
                            {item.product?.seller?.display_name || t('unknownSeller')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-neutral-muted line-clamp-2">{tc(item.product?.description)}</p>
                        <p className="mt-3 text-sm text-neutral-muted">{t(item.product?.category?.name || 'uncategorized')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <p className="text-sm font-semibold text-neutral-text">{item.product?.price.toLocaleString()} {t('priceCurrency')} {t('each')}</p>
                      <div className="flex items-center gap-2 rounded-full border border-neutral-border bg-neutral-bg px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, item.quantity - 1)}
                          disabled={saving || item.quantity <= 1}
                          className="rounded-full p-2 text-neutral-muted hover:text-neutral-text disabled:opacity-50"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(item, item.quantity + 1)}
                          disabled={saving}
                          className="rounded-full p-2 text-neutral-muted hover:text-neutral-text"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-neutral-border bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-muted">{t('orderSummary')}</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-neutral-muted">
                  <span>{t('subtotal')}</span>
                  <span>{subtotal.toLocaleString()} {t('priceCurrency')}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-muted">
                  <span>{t('delivery')}</span>
                  <span>{t('calcCheckout')}</span>
                </div>
                <div className="border-t border-neutral-border pt-4 flex items-center justify-between text-base font-semibold text-neutral-text">
                  <span>{t('total')}</span>
                  <span>{subtotal.toLocaleString()} {t('priceCurrency')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="mt-8 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                {t('checkoutNow')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
