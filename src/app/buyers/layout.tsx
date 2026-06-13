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
  ShoppingBag,
  ShoppingCart,
  LayoutDashboard,
  Store,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Star,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

type BuyerNavLink = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
};

function BuyerSidebarContent({
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

  const navLinks: BuyerNavLink[] = useMemo(() => [
    { href: '/buyers/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { href: '/buyers/cart', labelKey: 'cart', icon: ShoppingCart },
    { href: '/buyers/orders', labelKey: 'orders', icon: ShoppingBag },
    { href: '/buyers/receipts', labelKey: 'receipts', icon: ShoppingBag },
    { href: '/buyers/disputes', labelKey: 'disputes', icon: ShieldAlert },
    { href: '/buyers/insights', labelKey: 'aiInsights', icon: Sparkles },
  ], []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Section */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-neutral-border/50 shrink-0">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
            T
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-neutral-text">Tradam</span>
            <span className="block text-[10px] font-bold text-primary leading-none tracking-widest uppercase mt-0.5">{t('buyer')}</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-bg text-neutral-muted transition-colors md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navLinks.map(({ href, labelKey, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                  : 'text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {badge && !isActive && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold flex-1">{t(labelKey)}</span>
              {isActive ? (
                <ChevronRight className="w-4 h-4 opacity-70 animate-in slide-in-from-left-1" />
              ) : (
                badge && <span className="text-[10px] font-black bg-neutral-bg text-neutral-text px-2 py-0.5 rounded-full border border-neutral-border">{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section (Bottom - Fixed) */}
      <div className="px-4 pb-6 pt-4 border-t border-neutral-border/50 space-y-2 bg-neutral-bg/30 shrink-0">
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white border border-neutral-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-neutral-text uppercase tracking-wider leading-none mb-1">{t('buyer')}</p>
            <p className="text-[11px] font-bold text-neutral-muted truncate max-w-[140px]">{email}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all rounded-2xl text-sm font-black uppercase tracking-widest group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { t, languages, locale, setLanguage } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Auth check
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-neutral-muted uppercase tracking-widest">{t('verifyingAccess')}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-neutral-bg overflow-hidden">
      {/* ─── Desktop Sidebar (Fixed Left) ─────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white border-r border-neutral-border h-full shadow-2xl shadow-black/5 z-30">
        <BuyerSidebarContent
          pathname={pathname}
          email={user.email}
          onLogout={handleLogout}
        />
      </aside>

      {/* ─── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ─── Mobile Sidebar Drawer ──────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <BuyerSidebarContent
          pathname={pathname}
          email={user.email}
          onLogout={handleLogout}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ─── Main Viewport Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="md:hidden flex items-center justify-between px-6 h-16 bg-white border-b border-neutral-border shrink-0 z-20">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2.5 rounded-xl bg-neutral-bg text-neutral-text hover:bg-neutral-border transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-neutral-border bg-neutral-bg px-2 py-1 text-[10px] font-bold text-neutral-text">
              {/* @ts-ignore - useLanguage hook properties */}
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

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">
              T
            </div>
            <span className="text-sm font-black text-neutral-text tracking-tight">Tradam</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-bg/50">
          <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
