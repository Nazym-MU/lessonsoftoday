'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading or if user is authenticated
    if (isLoading || user) return;

    // List of protected routes
    const protectedRoutes = ['/chat', '/plan', '/analysis'];
    
    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Redirect to sign-in if on protected route without auth
    if (isProtectedRoute) {
      const redirectUrl = `/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [user, isLoading, pathname, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children if authenticated or on public route
  return <>{children}</>;
}