'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { createDispute } from '@/services/dispute-service';

interface DisputeModalProps {
  orderItemId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DisputeModal({ orderItemId, userId, onClose, onSuccess }: DisputeModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = [
    { id: 'damaged', label: t('damagedProduct') },
    { id: 'not_as_described', label: t('notAsDescribed') },
    { id: 'wrong_item', label: t('wrongItem') },
    { id: 'never_arrived', label: t('neverArrived') },
    { id: 'other', label: t('otherReason') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createDispute(orderItemId, userId, reason, description);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-neutral-border flex justify-between items-center bg-neutral-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-neutral-text">{t('openDispute')}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-border rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-muted">
              {t('disputeReason')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 rounded-2xl border border-neutral-border bg-neutral-bg/30 text-sm font-bold text-neutral-text focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              required
            >
              <option value="">{t('selectReason') || 'Select a reason'}</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.label}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-muted">
              {t('disputeDesc')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-2xl border border-neutral-border bg-neutral-bg/30 text-sm font-bold text-neutral-text focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              placeholder={t('disputeDescPlaceholder') || 'Please provide details about the issue...'}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border border-neutral-border text-sm font-black text-neutral-text hover:bg-neutral-bg transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submitDispute')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
