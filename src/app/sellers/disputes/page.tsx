'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getDisputesByUserId } from '@/services/dispute-service';
import { Dispute } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { AlertTriangle, Clock, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';
import DisputeChat from '@/components/DisputeChat';

export default function SellerDisputesPage() {
  const { t } = useLanguage();
  const { tc } = useTranslatedContent();
  const { user, loading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDisputes = async () => {
      try {
        const data = await getDisputesByUserId(user.id);
        setDisputes(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load disputes');
      }
    };

    loadDisputes();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const activeDisputeCount = disputes.length;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('disputeCenter') || 'Dispute Center'}</h1>
          <p className="mt-2 text-sm text-neutral-muted font-medium">{t('disputeCenterSellerSub') || 'Manage disputes opened against your orders.'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-bold">
          <span>{activeDisputeCount}</span>
          <span className="uppercase tracking-[0.2em]">Active</span>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-border p-16 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-neutral-bg rounded-full flex items-center justify-center mx-auto text-neutral-muted">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-text">{t('noDisputes') || 'No disputes found'}</h2>
            <p className="mt-2 text-sm text-neutral-muted max-w-xs mx-auto">{t('noDisputesSellerSub') || 'No disputes have been opened against your store.'}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden group hover:border-primary/30 transition-all">
              <div className="p-6 border-b border-neutral-border flex justify-between items-center bg-neutral-bg/30">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    dispute.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                    dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {t(dispute.status)}
                  </span>
                  <span className="text-xs text-neutral-muted font-bold">
                    Opened on {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-neutral-muted uppercase tracking-widest">Dispute ID</p>
                  <p className="text-xs font-mono font-bold text-neutral-text">{dispute.id.split('-')[0]}...</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-4">
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
                  </div>
                </div>

                <div className="bg-neutral-bg/50 p-4 rounded-2xl">
                  <p className="text-sm text-neutral-text leading-relaxed italic">"{dispute.description}"</p>
                </div>

                {dispute.resolution && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Resolution</span>
                    </div>
                    <p className="text-sm text-neutral-text font-medium">{dispute.resolution}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-neutral-border">
                  <DisputeChat disputeId={dispute.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
