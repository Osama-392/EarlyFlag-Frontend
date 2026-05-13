'use client';

import { useParams } from 'next/navigation';
import AdminStudentProfile from '@/components/AdminStudentProfile';

export default function AdminStudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  return <AdminStudentProfile studentId={studentId} />;
}
