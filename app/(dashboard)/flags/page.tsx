'use client';

import FlagsPage from '@/components/FlagsPage';
import { useProtectedRoute } from '@/lib/useProtectedRoute';

export default function FlagsRoute() {
  const { isAuthenticated, loading } = useProtectedRoute();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <FlagsPage />;
}
