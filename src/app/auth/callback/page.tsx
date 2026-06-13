'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const type = searchParams.get('type');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (data?.session) {
        if (type === 'recovery') {
          // If this is a password recovery, redirect to reset password page
          router.push('/auth/reset-password');
          return;
        }

        // Fetch profile to decide where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profile?.role === 'seller') {
          router.push('/sellers/dashboard');
        } else if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-text">Completing sign in...</h2>
        <p className="text-neutral-muted mt-2">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
