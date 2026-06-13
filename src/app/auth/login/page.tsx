'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

function LoginContent() {
  const { t } = useLanguage();
  const { signIn, signInWithGoogle, resetPassword, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (profile?.role === 'admin') {
        router.push('/admin');
      } else if (profile?.role === 'seller') {
        router.push('/sellers/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('suspended') === '1') {
      setError(t('sellerSuspendedAccess'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || t('loginError'));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError.message || t('googleLoginError'));
      setGoogleLoading(false);
    } else {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('enterEmailForReset'));
      return;
    }

    setResetLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(t('passwordResetSent'));
      }
    } catch (err: any) {
      setError(err.message || t('resetLinkError'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-border shadow-xs">
        
        {/* Header */}
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
            {t('welcomeBack')}
          </h2>
          <p className="mt-2 text-sm text-neutral-muted">
            {t('accessAccount')}
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

        {/* Google Login */}
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex justify-center items-center gap-3 bg-white hover:bg-neutral-bg border border-neutral-border text-neutral-text py-3 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-muted" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t('continueWithGoogle')}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-muted font-bold tracking-widest">
              {t('or')}
            </span>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1.5">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Mail className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-border bg-white text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Lock className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-neutral-muted select-none">
                {t('rememberMe')}
              </label>
            </div>

            <div className="text-xs">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {resetLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {t('forgotPassword')}
              </button>
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
                  {t('signingIn')}
                </>
              ) : (
                <>
                  {t('signIn')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs">
          <span className="text-neutral-muted">{t('dontHaveAccount')} </span>
          <Link href="/auth/signup" className="font-semibold text-primary hover:text-primary-hover">
            {t('registerHere')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
