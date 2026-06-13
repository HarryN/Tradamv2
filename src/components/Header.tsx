"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { useLanguage } from '@/hooks/useLanguage';
import { ShoppingBag, Store, ArrowRight, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { locale, setLanguage, languages, t } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isDashboard = pathname ? (pathname.startsWith('/sellers') || pathname.startsWith('/buyers') || pathname.startsWith('/admin')) : false;

  const handleLogout = async () => {
    setAccountOpen(false);
    setMobileMenuOpen(false);
    await signOut();
  };

  const navLinks = [
    { href: '/products', label: t('marketplace'), icon: Store },
  ];

  if (user) {
    if (profile?.role === 'seller') {
      navLinks.push(
        { href: '/sellers/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/sellers/products', label: t('myProducts'), icon: ShoppingBag },
        { href: '/sellers/orders', label: t('orders'), icon: ShoppingBag }
      );
    } else if (profile?.role === 'buyer') {
      navLinks.push(
        { href: '/buyers/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/buyers/cart', label: t('cart'), icon: ShoppingBag },
        { href: '/buyers/orders', label: t('orders'), icon: ShoppingBag }
      );
    } else if (profile?.role === 'admin') {
      navLinks.push({ href: '/admin/disputes', label: t('adminPanel'), icon: LayoutDashboard });
    }
  }

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white border-b border-neutral-border backdrop-blur-md bg-white/90 ${isDashboard ? 'hidden md:block' : 'block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Hamburger Button - Mobile Only */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl hover:bg-neutral-bg text-neutral-text transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm">T</div>
              <span className="text-xl font-bold tracking-tight text-neutral-text">Trada<span className="text-primary">m</span></span>
            </Link>
          </div>

          {/* Middle Navigation - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm font-medium text-neutral-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher - Desktop */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-neutral-border bg-neutral-bg px-2 py-1 text-[11px] font-semibold text-neutral-text">
              <span>{t('language')}:</span>
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => setLanguage(language.code)}
                  className={`px-2 py-1 rounded-full transition-colors ${locale === language.code ? 'bg-primary text-white' : 'text-neutral-text hover:bg-neutral-border'}`}
                >
                  {language.label}
                </button>
              ))}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-bg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-neutral-text leading-none capitalize">{profile?.role || t('user')}</p>
                    <p className="text-[10px] text-neutral-muted truncate max-w-[120px]">{user.email}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-border rounded-2xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-4 bg-neutral-bg/50 border-b border-neutral-border">
                      <p className="text-xs font-bold text-neutral-muted uppercase tracking-wider">{t('account')}</p>
                      <p className="text-sm font-semibold text-neutral-text mt-1 truncate">{user.email}</p>
                    </div>
                    <Link 
                      href={profile?.role === 'seller' ? '/sellers/dashboard' : '/buyers/dashboard'} 
                      onClick={() => setAccountOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-neutral-text hover:bg-neutral-bg transition-colors text-sm font-semibold border-b border-neutral-border"
                    >
                      <LayoutDashboard className="w-4 h-4 text-neutral-muted" />
                      {t('dashboard')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-neutral-text hover:text-primary px-4 py-2 transition-colors">{t('logIn')}</Link>
                <Link href="/auth/signup" className="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-all shadow-sm">{t('getStarted')}</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Hamburger Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 border-b border-neutral-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">T</div>
                <span className="text-lg font-bold text-neutral-text">Tradam</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-neutral-bg text-neutral-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-6 space-y-2">
              <p className="text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em] mb-4">{t('menu')}</p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-neutral-text hover:bg-neutral-bg active:scale-95 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-bg flex items-center justify-center text-neutral-muted">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">{link.label}</span>
                  </Link>
                );
              })}

              <div className="pt-6 mt-6 border-t border-neutral-border">
                <p className="text-[10px] font-black text-neutral-muted uppercase tracking-[0.2em] mb-4">{t('language')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => { setLanguage(language.code); setMobileMenuOpen(false); }}
                      className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        locale === language.code 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-neutral-border text-neutral-muted'
                      }`}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <div className="p-6 border-t border-neutral-border bg-neutral-bg/30">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 font-bold text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  {t('signOut')}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20"
                >
                  <User className="w-5 h-5" />
                  {t('logIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
