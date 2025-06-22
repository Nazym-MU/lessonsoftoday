'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth/sign-in?error=callback_error');
        return;
      }

      if (data.session) {
        router.push('/');
      } else {
        router.push('/auth/sign-in');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}