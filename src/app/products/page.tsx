'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/services/product-service';
import { getCategories } from '@/services/category-service';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { Product, Category } from '@/types';
import { useSearchParams } from 'next/navigation';

function ProductsContent() {
  const { locale, t } = useLanguage();
  const { tc } = useTranslatedContent();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ search: q, category_id: category || undefined, limit: 48 }),
          getCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [q, category]);

  const activeCategory = categories.find((item) => item.id === category);

  return (
    <div className="min-h-screen bg-neutral-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-text">{t('marketplace')}</h1>
            <p className="mt-2 text-sm text-neutral-muted">{t('marketplaceSub')}</p>
            <div className="mt-3 text-xs text-neutral-muted">
              {products.length} {t('activeProducts')}
              {activeCategory ? (locale === 'fr' ? ` dans ${t(activeCategory.name)}` : ` in ${t(activeCategory.name)}`) : ''}.
            </div>
          </div>

          <form action="/products" className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 w-full max-w-3xl">
            <div className="flex items-center gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder={t('searchPlaceholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-border bg-white text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <select
                name="category"
                defaultValue={category}
                className="px-3 py-2 rounded-xl border border-neutral-border bg-white text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{t(c.name)}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
              {t('search')}
            </button>
          </form>
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          <Link
            href="/products"
            className={`whitespace-nowrap text-xs sm:text-sm font-medium px-4 py-2 rounded-full border ${!category ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-text border-neutral-border'} transition-all`}>
            {t('allCategories')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.id)}`}
              className={`whitespace-nowrap text-xs sm:text-sm font-medium px-4 py-2 rounded-full border ${category === cat.id ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-text border-neutral-border hover:bg-neutral-bg'} transition-all`}
            >
              {t(cat.name)}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-neutral-border bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-neutral-text">{t('noProductsFound')}</h2>
            <p className="mt-3 text-sm text-neutral-muted">
              {t('noProductsSub')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block bg-white border border-neutral-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative h-40 sm:h-60 bg-neutral-bg flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-4xl sm:text-5xl">🛍️</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 sm:p-4">
                    <p className="text-[9px] sm:text-xs uppercase tracking-[0.18em] text-white/90 font-semibold">{t(p.category?.name || 'uncategorized')}</p>
                  </div>
                </div>
                <div className="p-3 sm:p-5">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-text line-clamp-2 h-10 sm:h-12 leading-tight">{tc(p.title)}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-muted truncate">
                      {p.seller?.display_name || t('unknownSeller')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-muted line-clamp-1 hidden sm:block">{tc(p.description)}</p>
                  <div className="mt-3 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                    <span className="font-extrabold text-sm sm:text-base text-neutral-text">{p.price.toLocaleString()} {t('priceCurrency')}</span>
                    <span className="text-[10px] sm:text-xs text-neutral-muted">{p.stock} {t('stockAvailable')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
