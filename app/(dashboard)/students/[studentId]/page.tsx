'use client';

import { useParams, useRouter } from 'next/navigation';
import StudentProfile from '@/components/StudentProfile';
import { useProtectedRoute } from '@/lib/useProtectedRoute';

export default function DashboardStudentProfileRoute() {
  const { isAuthenticated, loading } = useProtectedRoute();
  const params = useParams();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <StudentProfile
      studentId={params.studentId as string}
      onBack={() => router.back()}
    />
  );
}
