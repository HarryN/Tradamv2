'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getOrdersForSeller } from '@/services/order-service';
import { Order, OrderItem } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { generateReceiptPDF } from '@/services/receipt-service';
import { FileText, Download, Loader2, Search, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function SellerReceiptsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [orderGroups, setOrderGroups] = useState<Array<{ order: Order; items: OrderItem[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        const data = await getOrdersForSeller(user.id);
        // Only show paid or completed orders for receipts
        setOrderGroups(data.filter(g => g.order.status !== 'pending' && g.order.status !== 'cancelled'));
      } catch (err) {
        console.error('Failed to load receipts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  const filteredGroups = orderGroups.filter(g => 
    g.order.id.toLowerCase().includes(filter.toLowerCase()) || 
    g.order.payment_reference?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-neutral-text tracking-tight">Sales Receipts</h1>
          </div>
          <p className="text-neutral-muted font-medium">Official records of your confirmed sales and payouts.</p>
        </div>

        <div className="relative group max-w-sm w-full">
          <input
            type="text"
            placeholder="Search Order ID or Reference..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-5 py-3 pl-12 rounded-2xl border border-neutral-border bg-white text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
          />
          <Search className="w-5 h-5 text-neutral-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-xs font-black text-neutral-muted uppercase tracking-widest animate-pulse">Loading sales receipts...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white border border-neutral-border rounded-[3rem] p-16 text-center space-y-6">
          <div className="w-24 h-24 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-5xl">💰</div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-neutral-text">No sales records yet</h2>
            <p className="text-neutral-muted text-sm max-w-sm mx-auto font-medium">
              Receipts are generated automatically for every successful transaction.
            </p>
          </div>
          <Link href="/sellers/products/new" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-primary-hover transition-all shadow-xl shadow-primary/20">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map(({ order, items }) => {
            const sellerTotal = items.reduce((sum, item) => sum + (item.quantity * (item.unit_price ?? 0)), 0);
            return (
              <div 
                key={order.id} 
                className="bg-white border border-neutral-border rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-black/5 transition-all group"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-bg flex items-center justify-center text-neutral-muted group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-neutral-text">Order #{order.id.substring(0, 8)}</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-muted">
                        <User className="w-3.5 h-3.5" />
                        {order.status === 'paid' ? 'Verified Sale' : order.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-neutral-border/50">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-neutral-muted uppercase tracking-widest mb-1">Total Sale</p>
                    <p className="text-xl font-black text-primary">{sellerTotal.toLocaleString()} FCFA</p>
                  </div>
                  
                  <button
                    onClick={async () => await generateReceiptPDF(order, items, 'seller', language as any)}
                    className="flex items-center gap-3 bg-neutral-text text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Export PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
