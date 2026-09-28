'use client';

import StudentProfile from '@/components/StudentProfile';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherStudentProfileSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function StudentDetailRoute() {
 const { isAuthenticated, loading } = useProtectedRoute();

 if (loading) {
 return <TeacherStudentProfileSkeleton />;
 }

 if (!isAuthenticated) {
 return null;
 }

 return <StudentProfile />;
}
