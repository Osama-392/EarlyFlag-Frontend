'use client';

import StudentProfilePage from '@/components/StudentProfilePage';

export default function StudentDetail({ params }: { params: { classId: string; studentId: string } }) {
  return <StudentProfilePage params={{ id: params.studentId }} />;
}
