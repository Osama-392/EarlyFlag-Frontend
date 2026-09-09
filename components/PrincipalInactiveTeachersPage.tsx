'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ChevronRight, RefreshCw, UserRoundX } from 'lucide-react';
import {
  getAdminInactiveTeachers,
  type TeachersNotLoggingInBlock,
} from '@/lib/adminDashboardService';

const formatRecordedDate = (value: string | null) => {
  if (!value) return 'Never';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function PrincipalInactiveTeachersPage() {
  const router = useRouter();
  const [data, setData] = useState<TeachersNotLoggingInBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await getAdminInactiveTeachers(7, 50, 0));
    } catch (err: any) {
      console.error('Inactive teachers fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load inactive teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTeachers(); }, [loadTeachers]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-12">
      <button onClick={() => router.push('/principal-dashboard')} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-gray-50 dark:border-[#262a3d] dark:bg-[#151722] dark:text-blue-400">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-50 p-3 text-red-500 dark:bg-red-950/40"><UserRoundX size={24} /></div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Teachers Not Logging In</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Classes where teachers haven&apos;t recorded data in {data?.threshold_days ?? 7}+ days.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600 dark:bg-red-950/50">{data?.total ?? 0} classes · {data?.total_teachers ?? 0} teachers</span>
          <button onClick={() => void loadTeachers()} disabled={loading} aria-label="Refresh inactive teachers" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-[#1b1e2c]">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722]">
        {loading ? (
          <div className="space-y-1 p-5">
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="grid grid-cols-3 gap-5 border-b border-gray-100 py-5 dark:border-[#262a3d]">
                {[1, 2, 3].map(cell => <div key={cell} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-[#262a3d]" />)}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <AlertCircle size={36} className="mb-3 text-red-400" />
            <p className="font-semibold text-gray-900 dark:text-white">Unable to load inactive teachers</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button onClick={() => void loadTeachers()} className="mt-5 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600">Try again</button>
          </div>
        ) : data && data.total === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">All teachers have been active recently</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:border-[#262a3d]">
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">Class / Period</th>
                  <th className="px-6 py-4">Last Recorded</th>
                  <th className="px-6 py-4 text-center">Days Since</th>
                  <th className="w-12" aria-label="Open class" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                {data?.teachers.map(teacher => (
                  <tr
                    key={`${teacher.teacher_id}-${teacher.class_id}`}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/principal-classes/${teacher.class_id}?from=dashboard`)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') router.push(`/principal-classes/${teacher.class_id}?from=dashboard`);
                    }}
                    className="cursor-pointer hover:bg-red-50/40 dark:hover:bg-red-950/10"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{teacher.teacher_first_name} {teacher.teacher_last_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.class_name}{teacher.class_period != null ? ` · Period ${teacher.class_period}` : ''}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatRecordedDate(teacher.last_data_recorded_at)}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-red-500">{teacher.days_since_recording} days</td>
                    <td className="pr-5 text-gray-400"><ChevronRight size={17} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
