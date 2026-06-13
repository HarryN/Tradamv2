'use client';

import React from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import Link from 'next/link';
import { Shield, LayoutDashboard, AlertTriangle, LogOut, Users } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  if (loading) return <div>{t('loading')}...</div>;

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-bg">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black">{t('adminAccessDenied')}</h1>
        <p className="text-neutral-muted">{t('adminAccessDeniedSub')}</p>
        <Link href="/" className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-bold">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      <aside className="w-64 bg-white border-r border-neutral-border flex flex-col">
        <div className="p-6 border-b border-neutral-border">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-text rounded-lg flex items-center justify-center text-white font-black">A</div>
            <span className="font-black text-neutral-text">{t('adminPanel')}</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              pathname === '/admin' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('dashboard')}
          </Link>
          <Link 
            href="/admin/disputes" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              pathname === '/admin/disputes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            {t('disputes')}
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              pathname === '/admin/users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text'
            }`}
          >
            <Users className="w-5 h-5" />
            {t('users')}
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-border">
          <button 
            onClick={() => signOut().then(() => router.push('/'))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            {t('signOut')}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
