'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { 
  ShoppingBag, 
  Store, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Star,
  Heart,
  Eye
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, profile } = useAuth();
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Agribusiness & Food', countKey: 'categoryCount1200', icon: '🌾' },
    { name: 'Fashion & Fabric', countKey: 'categoryCount850', icon: '👗' },
    { name: 'Electronics', countKey: 'categoryCount450', icon: '💻' },
    { name: 'Home & Living', countKey: 'categoryCount600', icon: '🛋️' },
  ];

  const mockProducts = [
    {
      id: 1,
      title: 'Premium Ndop Fabric (Traditional)',
      price: `25,000 ${t('priceCurrency')}`,
      category: 'Fashion & Fabric',
      rating: 4.9,
      reviews: 24,
      image: '👗',
      seller: 'Bamenda Heritage Store'
    },
    {
      id: 2,
      title: 'Organic Penja White Pepper (500g)',
      price: `8,500 ${t('priceCurrency')}`,
      category: 'Agribusiness & Food',
      rating: 5.0,
      reviews: 48,
      image: '🌶️',
      seller: 'Penja Gold Farms'
    },
    {
      id: 3,
      title: 'Handcrafted Wooden Statues',
      price: `18,000 ${t('priceCurrency')}`,
      category: 'Home & Living',
      rating: 4.7,
      reviews: 12,
      image: '🗿',
      seller: 'Foumban Artisan Collective'
    },
    {
      id: 4,
      title: 'Local Pure Cocoa Powder (1kg)',
      price: `5,000 ${t('priceCurrency')}`,
      category: 'Agribusiness & Food',
      rating: 4.8,
      reviews: 31,
      image: '🍫',
      seller: 'Kumba Cocoa Cooperatives'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 bg-radial from-emerald-50/30 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t('heroBadge')}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-text leading-tight">
              {t('heroTitle')} <span className="text-primary">{t('heroTitleHighlight')}</span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-neutral-muted leading-relaxed">
              {t('heroSub')}
            </p>

            {/* User Type Switcher */}
            <div className="mt-10 inline-flex p-1 bg-white border border-neutral-border rounded-xl shadow-sm">
              <button 
                onClick={() => setUserType('buyer')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'buyer' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {t('wantToBuy')}
              </button>
              <button 
                onClick={() => setUserType('seller')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'seller' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                <Store className="w-4 h-4" />
                {t('wantToSell')}
              </button>
            </div>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {userType === 'buyer' ? (
                <>
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder={t('homeSearchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                    />
                    <Search className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <Link
                    href={`/products?q=${encodeURIComponent(searchQuery)}`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-sm"
                  >
                    {t('exploreMarketplace')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href={user && profile?.role === 'seller' ? '/sellers/dashboard' : '/auth/signup'}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-sm"
                  >
                    {t('openYourStore')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-neutral-border text-neutral-text hover:bg-neutral-bg font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer">
                    {t('sellerHandbook')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="marketplace" className="py-16 bg-white border-y border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-text">{t('shopByCategory')}</h2>
              <p className="mt-2 text-neutral-muted text-sm sm:text-base">{t('shopByCategorySub')}</p>
            </div>
            <a href="#" className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              {t('viewAllCategories')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat, idx) => (
              <div 
                key={idx}
                className="group p-4 sm:p-6 rounded-xl border border-neutral-border bg-neutral-bg/40 hover:bg-white hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-center sm:text-left"
              >
                <div className="text-2xl sm:text-3xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                <h3 className="font-bold text-sm sm:text-lg text-neutral-text group-hover:text-primary transition-colors line-clamp-1">{t(cat.name)}</h3>
                <p className="mt-1 text-[10px] sm:text-sm text-neutral-muted">{t(cat.countKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-neutral-bg/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-text">{t('featuredProducts')}</h2>
            <p className="mt-2 text-neutral-muted text-sm sm:text-base">{t('featuredProductsSub')}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {mockProducts.map((product) => (
              <div 
                key={product.id}
                className="group flex flex-col bg-white border border-neutral-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/10 transition-all duration-300"
              >
                <div className="h-32 sm:h-48 bg-neutral-bg flex items-center justify-center text-4xl sm:text-6xl relative select-none">
                  {product.image}
                  <button className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 sm:p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-neutral-muted hover:text-red-500 hover:bg-white shadow-xs transition-colors">
                    <Heart className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </button>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
                </div>
                
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-neutral-muted mb-1 sm:mb-1.5">
                      <span className="line-clamp-1">{t(product.category)}</span>
                      <span className="flex items-center gap-0.5 text-accent font-medium shrink-0">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                        {product.rating}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-neutral-text group-hover:text-primary transition-colors text-xs sm:text-base line-clamp-2 sm:line-clamp-1 h-8 sm:h-auto leading-tight">
                      {tc(product.title)}
                    </h3>
                    
                    <p className="mt-1 text-[10px] sm:text-xs text-neutral-muted hidden sm:block">
                      {t('seller')}: <span className="font-medium text-neutral-text">{product.seller}</span>
                    </p>
                  </div>
                  
                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-neutral-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-extrabold text-neutral-text text-sm sm:text-base">{product.price}</span>
                    <button className="inline-flex items-center justify-center sm:justify-start gap-1 text-[10px] sm:text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                      {t('viewDetails')}
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee features */}
      <section id="features" className="py-16 bg-white border-t border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-text">{t('whyTradam')}</h2>
            <p className="mt-3 text-neutral-muted text-sm sm:text-base">
              {t('whyTradamSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center px-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-5 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-neutral-text">{t('verifiedVendors')}</h3>
              <p className="mt-3 text-sm text-neutral-muted leading-relaxed">
                {t('verifiedVendorsSub')}
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-5 shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-neutral-text">{t('optimizedPerformance')}</h3>
              <p className="mt-3 text-sm text-neutral-muted leading-relaxed">
                {t('optimizedPerformanceSub')}
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-5 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-neutral-text">{t('mobileWallet')}</h3>
              <p className="mt-3 text-sm text-neutral-muted leading-relaxed">
                {t('mobileWalletSub')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-neutral-text text-white py-12 border-t border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-lg">T</div>
                Tradam
              </div>
              <p className="text-sm text-gray-400 max-w-sm">
                {t('footerTagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{t('platform')}</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="/products" className="hover:text-primary transition-colors">{t('marketplace')}</Link></li>
                <li><Link href="/sellers/dashboard" className="hover:text-primary transition-colors">{t('dashboard')}</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Affiliate Partners</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{t('supportInfo')}</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">{t('contactSupport')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('terms')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('privacy')}</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Tradam. {t('allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
