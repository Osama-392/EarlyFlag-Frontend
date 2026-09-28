'use client';

import StudentRoster from '@/components/StudentRoster';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherStudentListSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function ClassStudentsRoute() {
 const { isAuthenticated, loading } = useProtectedRoute();

 if (loading) {
 return <TeacherStudentListSkeleton />;
 }

 if (!isAuthenticated) {
 return null;
 }

 return <StudentRoster />;
}
