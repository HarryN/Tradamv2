'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getCartItems, removeCartItem, updateCartItemQuantity } from '@/services/cart-service';
import { CartItem } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { Trash2, ChevronDown, ChevronUp, ShoppingCart, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BuyerCartPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect sellers
  useEffect(() => {
    if (!authLoading && profile?.role === 'seller') {
      router.push('/products');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadCart = async () => {
      try {
        const cartItems = await getCartItems(user.id);
        setItems(cartItems);
      } catch (err: any) {
        setError(err?.message || 'Unable to load cart.');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  const handleQuantity = async (item: CartItem, newQuantity: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateCartItemQuantity(item.id, newQuantity);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated ?? i : i)));
    } catch (err: any) {
      setError(err?.message || 'Could not update quantity.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await removeCartItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err: any) {
      setError(err?.message || 'Could not remove item.');
    } finally {
      setSaving(false);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('shoppingCart')}</h1>
        <p className="mt-2 text-sm text-neutral-muted font-medium">{t('cartSubtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-border p-16 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-neutral-muted">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-text">{t('emptyCart')}</h2>
            <p className="mt-2 text-sm text-neutral-muted max-w-xs mx-auto">{t('emptyCartSub')}</p>
          </div>
          <Link href="/products" className="inline-flex px-8 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-hover transition-all">
            {t('browseProducts')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:gap-10 grid-cols-1 lg:grid-cols-[1fr_350px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-border shadow-sm group hover:border-primary/20 transition-all">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-neutral-bg overflow-hidden border border-neutral-border shrink-0">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-neutral-text truncate">{tc(item.product?.title)}</h4>
                        <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">{t(item.product?.category?.name || 'others')}</p>
                      </div>
                      <p className="text-base sm:text-lg font-black text-neutral-text whitespace-nowrap">
                        {(item.product?.price ?? 0).toLocaleString()} <span className="text-xs text-neutral-muted font-bold">{t('priceCurrency')}</span>
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 bg-neutral-bg rounded-xl p-1 border border-neutral-border">
                        <button 
                          onClick={() => handleQuantity(item, item.quantity - 1)}
                          disabled={saving || item.quantity <= 1}
                          className="p-1.5 rounded-lg hover:bg-white text-neutral-muted hover:text-primary transition-all disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-black text-neutral-text">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantity(item, item.quantity + 1)}
                          disabled={saving}
                          className="p-1.5 rounded-lg hover:bg-white text-neutral-muted hover:text-primary transition-all"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => handleRemove(item.id)}
                        disabled={saving}
                        className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-border shadow-sm lg:sticky lg:top-24 space-y-6 sm:space-y-8">
              <h3 className="text-sm font-black text-neutral-muted uppercase tracking-[0.2em]">{t('orderSummary')}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-neutral-muted">
                  <span>{t('subtotal')}</span>
                  <span>{subtotal.toLocaleString()} {t('priceCurrency')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-muted">
                  <span>{t('delivery')}</span>
                  <span className="italic text-[10px]">{t('calcCheckout')}</span>
                </div>
                <div className="pt-6 border-t border-neutral-border flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-text">{t('total')}</span>
                  <span className="text-2xl font-black text-primary">{subtotal.toLocaleString()} {t('priceCurrency')}</span>
                </div>
              </div>

              <button 
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {t('checkoutNow')}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-4 bg-neutral-bg rounded-2xl border border-neutral-border">
                <p className="text-[10px] text-neutral-muted leading-relaxed font-medium">
                  Prices include all applicable taxes. Final delivery fees will be calculated at checkout based on your location.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
