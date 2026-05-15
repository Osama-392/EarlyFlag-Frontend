'use client';

import { useParams } from 'next/navigation';
import PrincipalClassRoster from '@/components/PrincipalClassRoster';

export default function PrincipalClassRosterPage() {
  const params = useParams();
  const classId = params.classId as string;

  return <PrincipalClassRoster classId={classId} />;
}
