'use client';

import StudentsWrapper from '@/components/StudentsWrapper';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherClassesSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function StudentsRoute() {
 const { isAuthenticated, loading } = useProtectedRoute();

 if (loading) {
 return <TeacherClassesSkeleton />;
 }

 if (!isAuthenticated) {
 return null;
 }

 return <StudentsWrapper />;
}
