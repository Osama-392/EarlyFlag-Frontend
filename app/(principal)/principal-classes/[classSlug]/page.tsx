'use client';

import { useParams } from 'next/navigation';
import PrincipalClassRoster from '@/components/PrincipalClassRoster';

export default function PrincipalClassRosterPage() {
 const params = useParams();
 const classId = params.classSlug as string;

 return <PrincipalClassRoster classId={classId} />;
}
