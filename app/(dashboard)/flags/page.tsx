'use client';

import { useProtectedRoute } from '@/lib/useProtectedRoute';

export default function FlagsRoute() {
  const { isAuthenticated, loading } = useProtectedRoute();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flags</h1>
        <p className="text-gray-500 mt-1">Manage and review student flags - Coming soon</p>
      </div>
    </div>
  );
}
