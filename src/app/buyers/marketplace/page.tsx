'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/services/product-service';
import { getCategories } from '@/services/category-service';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { Product, Category } from '@/types';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, ShoppingBag, LayoutGrid, List, Sparkles, Loader2 } from 'lucide-react';
import { getSmartSearchKeywords } from '@/services/ai-service';

function MarketplaceContent() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ search: q, category_id: categoryId || undefined, limit: 50 }),
          getCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [q, categoryId]);

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      {/* Header / Search Area */}
      <div className="bg-white border-b border-neutral-border pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('marketplace')}</h1>
              <p className="text-neutral-muted text-sm mt-1">Discover authentic Cameroonian quality</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <form action="/buyers/marketplace" className="relative w-full md:w-96 group">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-11 pr-12 py-3 rounded-2xl border border-neutral-border bg-neutral-bg/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-sm"
                />
                <Search className="w-5 h-5 text-neutral-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input type="hidden" name="category" value={categoryId} />
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Categories */}
          <aside className="w-full lg:w-64 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black text-neutral-text uppercase tracking-widest">{t('category')}</h2>
              </div>
              
              <div className="space-y-1">
                <Link
                  href="/buyers/marketplace"
                  className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    !categoryId 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-neutral-muted hover:bg-white hover:text-neutral-text'
                  }`}
                >
                  {t('allCategories')}
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/buyers/marketplace?category=${encodeURIComponent(cat.id)}${q ? `&q=${q}` : ''}`}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      categoryId === cat.id 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-neutral-muted hover:bg-white hover:text-neutral-text'
                    }`}
                  >
                    {t(cat.name)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-text text-white space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest">Tradam Verified</h3>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Every vendor is manually verified to ensure product authenticity.
              </p>
            </div>
          </aside>

          {/* Main Content: Products */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-neutral-muted">
                {products.length} <span className="uppercase tracking-widest text-[10px] ml-1">{t('activeProducts')}</span>
              </p>
              
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-neutral-border shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neutral-bg text-primary' : 'text-neutral-muted'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-neutral-bg text-primary' : 'text-neutral-muted'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] border border-neutral-border p-5 space-y-4 animate-pulse h-96">
                    <div className="aspect-square bg-neutral-bg rounded-[2rem]" />
                    <div className="h-4 bg-neutral-bg rounded-full w-2/3" />
                    <div className="h-4 bg-neutral-bg rounded-full w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[3rem] border border-neutral-border p-20 text-center">
                <div className="w-20 h-20 bg-neutral-bg rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-muted text-3xl">
                  🔍
                </div>
                <h2 className="text-2xl font-black text-neutral-text">{t('noProductsFound')}</h2>
                <p className="mt-2 text-neutral-muted max-w-sm mx-auto">{t('noProductsSub')}</p>
                <Link href="/buyers/marketplace" className="mt-8 inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {products.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/products/${p.id}`} 
                    className={`group bg-white border border-neutral-border transition-all duration-500 hover:shadow-2xl hover:border-primary/20 ${
                      viewMode === 'grid' ? "rounded-[2.5rem] overflow-hidden" : "rounded-3xl p-4 flex gap-6"
                    }`}
                  >
                    <div className={`${viewMode === 'grid' ? "relative aspect-square m-2 rounded-[2rem]" : "w-40 h-40 rounded-2xl"} bg-neutral-bg flex items-center justify-center overflow-hidden shrink-0`}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="text-5xl">🛍️</div>
                      )}
                      
                      {viewMode === 'grid' && (
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                              {t(p.category?.name || 'Others')}
                           </p>
                        </div>
                      )}
                    </div>

                    <div className={`p-6 ${viewMode === 'grid' ? "pt-2" : "flex-1 flex flex-col justify-center"} space-y-3`}>
                      {viewMode === 'list' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {t(p.category?.name || 'Others')}
                        </p>
                      )}
                      <h3 className="text-base font-black text-neutral-text leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {tc(p.title)}
                      </h3>
                      <p className="text-xs text-neutral-muted line-clamp-2 leading-relaxed">
                        {tc(p.description)}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-muted truncate">
                          {p.seller?.display_name || t('unknownSeller')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xl font-black text-neutral-text">
                          {p.price.toLocaleString()} <span className="text-[10px] text-primary uppercase ml-1">{t('priceCurrency')}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-neutral-muted uppercase">{p.stock} {t('inStock')}</span>
                          <div className="p-2 rounded-xl bg-neutral-bg text-neutral-muted group-hover:bg-primary group-hover:text-white transition-colors">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BuyerMarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
