'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch') || 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage(t('passwordUpdated') || 'Password updated successfully. Redirecting to login...');
      setLoading(false);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-border shadow-xs">
        
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-text">
              Tradam
            </span>
          </Link>
          
          <h2 className="text-3xl font-extrabold text-neutral-text tracking-tight">
            {t('setNewPassword') || 'Set New Password'}
          </h2>
          <p className="mt-2 text-sm text-neutral-muted">
            {t('enterNewPasswordDesc') || 'Please enter your new password below.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 text-emerald-700 text-sm p-4 rounded-lg border border-emerald-100">
            {message}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1.5">
                {t('newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Lock className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1.5">
                {t('confirmNewPassword') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Lock className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white py-3 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('updatingPassword') || 'Updating...'}
                </>
              ) : (
                <>
                  {t('updatePassword') || 'Update Password'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
