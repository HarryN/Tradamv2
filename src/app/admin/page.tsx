'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  BarChart3,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { getPlatformDailyStats, DailyStats } from '@/services/analytics-service';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    disputes: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeResult, setRecomputeResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          { count: userCount },
          { count: productCount },
          { count: orderCount },
          { count: disputeCount },
          dailyData
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('disputes').select('*', { count: 'exact', head: true }),
          getPlatformDailyStats(14)
        ]);

        setStats({
          users: userCount || 0,
          products: productCount || 0,
          orders: orderCount || 0,
          disputes: disputeCount || 0
        });
        setDailyStats(dailyData);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1000);

  const handleRecomputeClusters = async () => {
    setRecomputing(true);
    setRecomputeResult(null);
    try {
      const res = await fetch('/api/admin/recompute-clusters', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRecomputeResult('Successfully recomputed AI product clusters!');
      } else {
        setRecomputeResult('Error: ' + data.error);
      }
    } catch (err) {
      setRecomputeResult('Failed to connect to recompute API.');
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-neutral-text tracking-tight">System Overview</h1>
        <p className="mt-2 text-sm text-neutral-muted font-medium">Platform performance and administrative control center.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Total Users</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{stats.users}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Live Products</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{stats.products}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Total Orders</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{stats.orders}</p>
        </div>

        <Link href="/admin/disputes" className="bg-white p-6 rounded-3xl border border-neutral-border shadow-sm hover:border-red-500 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Active Disputes</p>
          <p className="mt-1 text-2xl font-black text-neutral-text">{stats.disputes}</p>
        </Link>
      </div>

      {/* Revenue Growth Chart */}
      <div className="bg-white rounded-[2.5rem] border border-neutral-border p-8 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-neutral-text">Platform Growth</h3>
              <p className="text-xs font-bold text-neutral-muted uppercase tracking-widest mt-0.5">Revenue & Order Velocity (14 Days)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-bg text-neutral-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Live Tracking</span>
          </div>
        </div>

        <div className="h-64 flex items-end gap-3 sm:gap-6 px-2">
          {dailyStats.map((day, idx) => {
            const height = (day.revenue / maxRevenue) * 100;
            const hasData = day.revenue > 0 || day.order_count > 0;
            
            return (
              <div key={idx} className="flex-1 group relative flex flex-col items-center">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                  <div className="bg-neutral-text text-white p-3 rounded-2xl text-center shadow-xl min-w-[120px]">
                    <p className="text-[9px] font-bold text-white/50 uppercase mb-1">{new Date(day.stats_date).toLocaleDateString()}</p>
                    <p className="text-sm font-black">{day.revenue.toLocaleString()} {t('priceCurrency')}</p>
                    <p className="text-[10px] font-bold text-primary">{day.order_count} {t('orders')}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-text" />
                  </div>
                </div>

                {/* The Bar */}
                <div className="w-full flex flex-col items-center gap-1.5 h-full justify-end">
                   <div 
                    className={`w-full rounded-t-xl transition-all duration-700 delay-${idx * 50} ${
                      hasData ? 'bg-primary shadow-lg shadow-primary/20 group-hover:bg-primary-hover' : 'bg-neutral-bg border border-dashed border-neutral-border'
                    }`}
                    style={{ height: hasData ? `${Math.max(height, 5)}%` : '2%' }}
                   />
                   <span className="text-[9px] font-bold text-neutral-muted uppercase rotate-45 sm:rotate-0 mt-2">
                      {new Date(day.stats_date).toLocaleDateString([], { weekday: 'short' })}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
