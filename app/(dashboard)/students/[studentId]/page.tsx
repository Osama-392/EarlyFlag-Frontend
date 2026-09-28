'use client';

import { useParams, useRouter } from 'next/navigation';
import StudentProfile from '@/components/StudentProfile';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { TeacherStudentProfileSkeleton } from '@/components/TeacherLoadingSkeletons';

export default function DashboardStudentProfileRoute() {
  const { isAuthenticated, loading } = useProtectedRoute();
  const params = useParams();
  const router = useRouter();

  if (loading) {
    return <TeacherStudentProfileSkeleton />;
  }

  if (!isAuthenticated) return null;

  return (
    <StudentProfile
      studentId={params.studentId as string}
      onBack={() => router.back()}
    />
  );
}
