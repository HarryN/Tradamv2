'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import type { LucideIcon } from 'lucide-react';
import {
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Store,
  User,
  ChevronRight,
  Star,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

type SellerNavLink = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
};

function SidebarContent({
  pathname,
  email,
  onLogout,
  onClose,
}: {
  pathname: string;
  email?: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const navLinks: SellerNavLink[] = useMemo(() => [
    { href: '/sellers/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { href: '/sellers/profile', labelKey: 'profile', icon: User },
    { href: '/sellers/products', labelKey: 'myProducts', icon: Package },
    { href: '/sellers/orders', labelKey: 'orders', icon: ShoppingBag },
    { href: '/sellers/disputes', labelKey: 'disputes', icon: ShieldAlert },
    { href: '/sellers/reviews', labelKey: 'reviews', icon: Star },
    { href: '/sellers/insights', labelKey: 'aiInsights', icon: Sparkles },
  ], []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-border/60 shrink-0">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            T
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-neutral-text">Tradam</span>
            <span className="block text-[10px] font-semibold text-primary leading-none tracking-wider uppercase">{t('vendorPortal')}</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-bg text-neutral-muted transition-colors md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navLinks.map(({ href, labelKey, icon: Icon, disabled, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <div key={href}>
              {disabled ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-muted/50 cursor-not-allowed">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold flex-1">{t(labelKey)}</span>
                </div>
              ) : (
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                    {badge && !isActive && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold flex-1">{t(labelKey)}</span>
                  {isActive ? (
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  ) : (
                    badge && <span className="text-[10px] font-bold bg-neutral-border/60 text-neutral-muted px-2 py-0.5 rounded-full">{badge}</span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 pb-6 pt-3 border-t border-neutral-border/60 space-y-2 bg-neutral-bg/30 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-neutral-border/50 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-text truncate">{t('sellerAccount')}</p>
            <p className="text-[11px] text-neutral-muted truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { t, languages, locale, setLanguage } = useLanguage();
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  // Auth check
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-neutral-bg">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-neutral-muted font-medium">{t('verifyingAccess')}</p>
      </div>
    );
  }

  if (!user || (profile && profile.role !== 'seller')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-neutral-bg px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-5">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-neutral-text">{t('accessRestricted')}</h3>
        <p className="mt-2 text-sm text-neutral-muted max-w-sm leading-relaxed">
          {t('accessRestrictedSub')}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="text-sm font-bold bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {t('logInAsSeller')}
          </Link>
          <Link
            href="/"
            className="text-sm font-bold bg-white border border-neutral-border text-neutral-text hover:bg-neutral-bg px-5 py-2.5 rounded-xl transition-colors"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-bg overflow-hidden">

      {/* ─── Desktop Sidebar (fixed, visible on md+) ─────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-neutral-border h-full">
        <SidebarContent
          pathname={pathname}
          email={user.email}
          onLogout={handleLogout}
        />
      </aside>

      {/* ─── Mobile Drawer Overlay ────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ─── Mobile Drawer Panel ──────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          pathname={pathname}
          email={user.email}
          onLogout={handleLogout}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Topbar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-neutral-border shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-neutral-bg text-neutral-text transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-neutral-border bg-neutral-bg px-2 py-1 text-[10px] font-bold text-neutral-text">
              {/* @ts-ignore */}
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  // @ts-ignore
                  onClick={() => setLanguage(language.code)}
                  // @ts-ignore
                  className={`px-2 py-0.5 rounded-full transition-colors ${locale === language.code ? 'bg-primary text-white' : 'text-neutral-text'}`}
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="text-sm font-extrabold text-neutral-text">Tradam</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
