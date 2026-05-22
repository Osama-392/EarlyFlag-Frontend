'use client';

import { useAuth } from '@/app/providers';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useProtectedRoute() {
  const { isAuthenticated, isPending, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If not authenticated and not on auth pages, redirect to login
    if (!isAuthenticated && !pathname?.startsWith('/auth') && !pathname?.startsWith('/principal-auth') && !pathname?.startsWith('/principal-signup') && pathname !== '/pending-approval') {
      if (pathname?.startsWith('/principal-')) {
        router.push('/principal-auth');
      } else {
        router.push('/auth');
      }
    }

    // If pending approval and not on pending page, redirect
    if (isPending && pathname !== '/pending-approval' && !pathname?.startsWith('/auth')) {
      router.push('/pending-approval');
    }
  }, [isAuthenticated, isPending, loading, pathname, router]);

  return { isAuthenticated, isPending, loading };
}
