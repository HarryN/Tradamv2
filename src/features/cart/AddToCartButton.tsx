'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { addProductToCart } from '@/services/cart-service';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckCircle2, Eye } from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '@/hooks/useLanguage';
import { trackInteraction } from '@/services/interaction-service';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      setMessage(t('loginToAddToCart') || 'Please log in to add items to your cart.');
      return;
    }

    if (profile?.role === 'seller') {
      setMessage(t('sellerCannotBuy') || 'Sellers cannot add products to cart or make purchases.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await addProductToCart(user.id, productId, 1);
      
      // Track cart_add interaction
      trackInteraction(user.id, productId, 'cart_add');
      
      setMessage(t('addedToCart'));
      setTimeout(() => setMessage(null), 3500);
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || t('addToCartError') || 'Could not add to cart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          <ShoppingCart className="w-4 h-4" />
          {loading ? t('adding') : t('addToCart')}
        </button>

        {(!profile || profile.role !== 'seller') && (
          <Link
            href="/buyers/cart"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-neutral-border text-neutral-text rounded-xl font-bold hover:bg-neutral-bg transition-all active:scale-[0.98] shadow-sm"
          >
            <Eye className="w-4 h-4" />
            {t('viewCart')}
          </Link>
        )}
      </div>

      {message && (
        <div className="text-sm text-white bg-neutral-text/90 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
