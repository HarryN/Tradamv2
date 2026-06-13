'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getSellerProducts, deleteProduct, toggleProductActive } from '@/services/product-service';
import { Product } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function SellerProductsPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSellerProducts(user.id);
      setProducts(data);
    } catch (e: any) {
      setError(e.message || t('loadProductsError') || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await toggleProductActive(product.id, !product.is_active);
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p)
      );
      showSuccess(`"${tc(product.title)}" ${t('isNow')} ${!product.is_active ? t('live').toLowerCase() : t('draft').toLowerCase()}.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    setDeletingId(product.id);
    setConfirmDeleteId(null);
    try {
      await deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      showSuccess(`"${tc(product.title)}" ${t('hasBeenDeleted') || 'has been deleted'}.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-text">{t('myProducts')}</h1>
          <p className="mt-1 text-sm text-neutral-muted">
            {loading ? `${t('loading')}…` : `${products.length} ${t('totalProducts').toLowerCase()}`}
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

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-sm animate-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      {!loading && products.length > 0 && (
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder={t('searchProductsOrCats')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <Search className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-neutral-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="divide-y divide-neutral-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-neutral-border/40 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-neutral-border/40 rounded w-1/2" />
                  <div className="h-2.5 bg-neutral-border/30 rounded w-1/3" />
                </div>
                <div className="h-3 bg-neutral-border/40 rounded w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-5">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-neutral-text">
              {search ? t('noMatchingProducts') : t('noProductsYet')}
            </h3>
            <p className="mt-2 text-sm text-neutral-muted max-w-xs leading-relaxed">
              {search
                ? t('noMatchingSub')
                : t('startByAdding')}
            </p>
            {!search && (
              <Link
                href="/sellers/products/new"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('addFirstProduct')}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table Header (desktop only) */}
            <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr_auto] items-center px-5 py-3 bg-neutral-bg/50 border-b border-neutral-border text-xs font-bold text-neutral-muted uppercase tracking-wider">
              <span>{t('product')}</span>
              <span>{t('category')}</span>
              <span>{t('price')}</span>
              <span>{t('status')}</span>
              <span>{t('actions')}</span>
            </div>

            <div className="divide-y divide-neutral-border">
              {filtered.map((product) => (
                <div key={product.id} className="group">
                  {/* Delete confirmation inline */}
                  {confirmDeleteId === product.id && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex flex-col sm:flex-row sm:items-center gap-3">
                      <p className="text-sm text-red-700 flex-1">
                        <span className="font-bold">{t('deleteConfirm')}</span>
                        {' '}{t('undoneWarning')}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-border bg-white text-neutral-text hover:bg-neutral-bg transition-colors"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Product Row */}
                  <div className="sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr_auto] items-center px-5 py-4 gap-4 hover:bg-neutral-bg/20 transition-colors flex flex-col sm:flex-row">
                    {/* Product info */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-neutral-bg border border-neutral-border overflow-hidden shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-neutral-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-text group-hover:text-primary transition-colors line-clamp-1">
                          {tc(product.title)}
                        </p>
                        <p className="text-xs text-neutral-muted mt-0.5">{product.stock} {t('inStock')}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden sm:block">
                      <span className="text-xs font-semibold text-neutral-muted bg-neutral-bg px-2 py-1 rounded-lg">
                        {t(product.category?.name || 'uncategorized')}
                      </span>
                    </div>

                    {/* Price */}
                    <p className="hidden sm:block text-sm font-extrabold text-neutral-text">
                      {product.price.toLocaleString()} {t('priceCurrency')}
                    </p>

                    {/* Status */}
                    <div className="hidden sm:flex">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        product.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-border/50 text-neutral-muted'
                      }`}>
                        {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.is_active ? t('live') : t('draft')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                      {/* Mobile info */}
                      <div className="flex items-center gap-2 sm:hidden flex-1">
                        <span className="text-sm font-extrabold text-neutral-text">
                          {product.price.toLocaleString()} {t('priceCurrency')}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-border/50 text-neutral-muted'
                        }`}>
                          {product.is_active ? t('live') : t('draft')}
                        </span>
                      </div>

                      {/* Toggle visibility */}
                      <button
                        onClick={() => handleToggle(product)}
                        disabled={togglingId === product.id}
                        title={product.is_active ? t('hideProduct') : t('makeLive')}
                        className="p-2 rounded-lg text-neutral-muted hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                      >
                        {togglingId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : product.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/sellers/products/${product.id}/edit`}
                        title={t('editProduct')}
                        className="p-2 rounded-lg text-neutral-muted hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDeleteId(product.id === confirmDeleteId ? null : product.id)}
                        title={t('delete')}
                        className="p-2 rounded-lg text-neutral-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
