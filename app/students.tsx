'use client';

import StudentRoster from '@/components/StudentRoster';
import StudentProfilePage from '@/components/StudentProfilePage';
import { usePathname } from 'next/navigation';

export default function StudentsPage() {
  const pathname = usePathname();
  
  // Check if this is a dynamic route like /students/[id]
  const isDetailPage = pathname?.includes('/students/') && pathname?.split('/').length === 3;
  const studentId = pathname?.split('/')[2];

  if (isDetailPage && studentId) {
    return <StudentProfilePage params={{ id: studentId }} />;
  }

  return <StudentRoster />;
}
