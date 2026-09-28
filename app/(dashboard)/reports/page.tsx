'use client';

import ReportsPage from '@/components/ReportsPage';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherClassesSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function ReportsRoute() {
 const { isAuthenticated, loading } = useProtectedRoute();

 if (loading) {
 return <TeacherClassesSkeleton label="Loading reports" />;
 }

 if (!isAuthenticated) {
 return null;
 }

 return <ReportsPage />;
}
