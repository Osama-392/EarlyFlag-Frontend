'use client';

import StudentProfile from '@/components/StudentProfile';

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  return <StudentProfile params={params} />;
}
