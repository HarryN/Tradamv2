"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, User, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useLanguage } from '@/hooks/useLanguage';

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const tabs = [
    {
      label: t('home'),
      href: '/',
      icon: Home,
    },
    {
      label: t('marketplace'),
      href: '/products',
      icon: Store,
    },
  ];

  // Add Cart for buyers
  if (user && profile?.role === 'buyer') {
    tabs.push({
      label: t('cart'),
      href: '/buyers/cart',
      icon: ShoppingCart,
    });
  }

  // Add Dashboard/Account based on role
  if (user) {
    const dashboardHref = profile?.role === 'seller' 
      ? '/sellers/dashboard' 
      : profile?.role === 'admin'
        ? '/admin/disputes'
        : '/buyers/dashboard';
    
    tabs.push({
      label: t('dashboard'),
      href: dashboardHref,
      icon: LayoutDashboard,
    });
  } else {
    tabs.push({
      label: t('logIn'),
      href: '/auth/login',
      icon: User,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-neutral-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-primary' : 'text-neutral-muted hover:text-neutral-text'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
