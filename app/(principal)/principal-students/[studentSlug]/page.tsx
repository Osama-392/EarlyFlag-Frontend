'use client';

import { useParams } from 'next/navigation';
import AdminStudentProfile from '@/components/AdminStudentProfile';

export default function AdminStudentProfilePage() {
 const params = useParams();
 const studentId = params.studentSlug as string;

 return <AdminStudentProfile studentId={studentId} />;
}
