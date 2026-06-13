'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dispute, DisputeStatus } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { AlertTriangle, CheckCircle2, XCircle, Info, Loader2, Sparkles } from 'lucide-react';
import { updateDisputeStatus } from '@/services/dispute-service';
import DisputeChat from '@/components/DisputeChat';

export default function AdminDisputesPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Resolution State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('disputes')
        .select('*, order_item:order_items(*, product:products(*))')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setDisputes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setSubmitting(true);
    try {
      await updateDisputeStatus(selectedDispute.id, 'resolved', resolution, adminNotes);
      setSelectedDispute(null);
      setResolution('');
      setAdminNotes('');
      await loadDisputes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
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
        <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('reviewDispute') || 'Review Disputes'}</h1>
        <p className="mt-2 text-sm text-neutral-muted font-medium">Investigate and resolve platform disputes between buyers and sellers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {disputes.map((dispute) => (
            <div 
              key={dispute.id} 
              className={`bg-white rounded-3xl border transition-all cursor-pointer ${
                selectedDispute?.id === dispute.id ? 'border-primary ring-2 ring-primary/10' : 'border-neutral-border hover:border-primary/30'
              }`}
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="p-6 border-b border-neutral-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    dispute.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                    dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {dispute.status}
                  </span>
                  <span className="text-xs text-neutral-muted font-bold">
                    {new Date(dispute.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-6 flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-bg overflow-hidden border border-neutral-border shrink-0">
                  {dispute.order_item?.product?.image_url ? (
                    <img src={dispute.order_item.product.image_url} alt="product" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-text">{tc(dispute.order_item?.product?.title) || 'Unknown Product'}</h4>
                  <p className="text-sm text-amber-600 font-bold mt-1">{dispute.reason}</p>
                  <p className="mt-3 text-sm text-neutral-text leading-relaxed italic">"{dispute.description}"</p>
                </div>
              </div>

              {selectedDispute?.id === dispute.id && (
                <div className="px-6 pb-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="pt-6 border-t border-neutral-border">
                    <DisputeChat disputeId={dispute.id} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selectedDispute ? (
            <div className="bg-white rounded-3xl border border-neutral-border p-8 sticky top-10 space-y-6 shadow-xl shadow-black/5 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-neutral-text">Action Center</h3>
              </div>

              <form onSubmit={handleResolve} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-muted">
                      {t('resolutionDesc') || 'Resolution Message'}
                    </label>
                  </div>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                    className="w-full p-4 rounded-2xl border border-neutral-border bg-neutral-bg/30 text-sm font-bold text-neutral-text focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                    placeholder="Describe the final decision to both parties..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-muted">
                    {t('adminNotes') || 'Internal Admin Notes'}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="w-full p-4 rounded-2xl border border-neutral-border bg-neutral-bg/30 text-sm font-bold text-neutral-text focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                    placeholder="Private notes only visible to admins..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('markResolved')}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-neutral-bg/50 rounded-3xl border border-dashed border-neutral-border p-10 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-neutral-muted mx-auto" />
              <p className="text-sm text-neutral-muted font-bold uppercase tracking-widest">Select a dispute to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
