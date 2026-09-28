'use client';

import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherPageSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function FlagsRoute() {
 const { isAuthenticated, loading } = useProtectedRoute();

 if (loading) {
 return <TeacherPageSkeleton label="Loading flags" />;
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
