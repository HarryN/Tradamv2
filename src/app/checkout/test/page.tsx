'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useLanguage } from '@/hooks/useLanguage';
import { Loader2, CheckCircle2, AlertCircle, Phone, Smartphone, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestPaymentPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('1'); // Default to 1 FCFA as requested
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'pending' | 'success' | 'failed'>('idle');
  const [reference, setReference] = useState<string | null>(null);

  // Poll for status if pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStep === 'pending' && reference) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status/${reference}`);
          const data = await res.json();

          if (data.status === 'SUCCESSFUL') {
            setPaymentStep('success');
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setPaymentStep('failed');
            setError('Payment failed or was canceled.');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStep, reference]);

  const handleTestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation for Cameroonian numbers
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 9) {
      finalPhone = '237' + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('237')) {
      finalPhone = cleanPhone;
    } else {
      setError('Please enter a valid phone number (e.g., 6xxxxxxxx or 2376xxxxxxxx)');
      return;
    }

    const amt = parseInt(amount);
    if (isNaN(amt) || amt < 1 || amt > 25) {
      setError('Amount must be between 1 and 25 FCFA for testing.');
      return;
    }

    setLoading(true);
    setPaymentStep('initiating');

    try {
      const res = await fetch('/api/payments/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          phoneNumber: finalPhone,
          description: `Tradam Test Payment - ${user?.email || 'Guest'}`,
          externalReference: `test_${Date.now()}`
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment initiation failed');
      }

      setReference(data.reference);
      setPaymentStep('pending');
    } catch (err: any) {
      setError(err.message);
      setPaymentStep('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-6 lg:p-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-neutral-border bg-neutral-bg/30">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white mb-4 shadow-sm">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-text">Payment Test</h1>
          <p className="mt-2 text-sm text-neutral-muted leading-relaxed">
            Test the Campay Mobile Money integration with a small amount.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Demo Mode (Max 25 FCFA)</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {paymentStep === 'idle' || paymentStep === 'failed' ? (
            <form onSubmit={handleTestPayment} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-neutral-muted mb-2">
                  Phone Number (MTN/Orange)
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="6xxxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-5 py-3.5 pl-12 rounded-2xl border border-neutral-border focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-neutral-text font-medium"
                    required
                  />
                  <Phone className="w-5 h-5 text-neutral-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                </div>
                <p className="mt-2 text-[10px] text-neutral-muted italic">Format: 6xxxxxxxx or 2376xxxxxxxx</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-neutral-muted mb-2">
                  Amount (FCFA)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '5', '10', '25'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 ${
                        amount === amt 
                          ? 'bg-primary border-primary text-white shadow-md scale-[1.05]' 
                          : 'border-neutral-border text-neutral-muted hover:border-primary/50'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-neutral-border disabled:cursor-not-allowed text-white py-4 rounded-2xl font-extrabold text-sm shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay Now"}
              </button>
            </form>
          ) : paymentStep === 'initiating' ? (
            <div className="text-center py-10 space-y-4">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Smartphone className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-text">Initiating Payment</h3>
                <p className="text-sm text-neutral-muted mt-2">Connecting to Campay server...</p>
              </div>
            </div>
          ) : paymentStep === 'pending' ? (
            <div className="text-center py-10 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-25" />
                <div className="relative w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="w-10 h-10 text-primary animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-neutral-text">Check Your Phone!</h3>
                <p className="text-sm text-neutral-muted mt-3 leading-relaxed">
                  We've sent a <span className="font-bold text-neutral-text">Mobile Money PIN prompt</span> to your phone.<br/>
                  Enter your PIN to complete the test payment of <span className="font-bold text-primary">{amount} FCFA</span>.
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-neutral-bg rounded-full border border-neutral-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-bold text-neutral-muted uppercase tracking-widest">Waiting for PIN confirmation</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-100">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-neutral-text">Payment Successful!</h3>
                <p className="text-sm text-neutral-muted mt-3 leading-relaxed">
                  Excellent! The Campay integration is working perfectly.<br/>
                  Transaction reference: <span className="font-mono text-xs text-neutral-text font-bold">{reference}</span>
                </p>
              </div>
              <div className="pt-6 space-y-3">
                <button 
                  onClick={() => { setPaymentStep('idle'); setPhoneNumber(''); setReference(null); }}
                  className="w-full py-4 bg-white border border-neutral-border rounded-2xl text-sm font-bold text-neutral-text hover:bg-neutral-bg transition-colors"
                >
                  Run Another Test
                </button>
                <Link 
                  href="/products"
                  className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors shadow-md"
                >
                  Back to Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-bg/30 border-t border-neutral-border text-center">
          <p className="text-[10px] text-neutral-muted uppercase tracking-[0.2em] font-bold">
            Powered by Campay Cameroon
          </p>
        </div>
      </div>
    </div>
  );
}
