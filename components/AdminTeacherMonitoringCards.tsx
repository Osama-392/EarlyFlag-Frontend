'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Flag, UserRoundX } from 'lucide-react';
import type {
  TeacherEscalationsBlock,
  TeacherObservationFlagRow,
  TeachersNotLoggingInBlock,
} from '@/lib/adminDashboardService';

interface AdminTeacherMonitoringCardsProps {
  escalations?: TeacherEscalationsBlock | null;
  inactiveTeachers?: TeachersNotLoggingInBlock | null;
  pendingTeacherFlags?: TeacherObservationFlagRow[];
  loading?: boolean;
}

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

const SkeletonRows = () => (
  <div className="space-y-1 px-4 pb-4">
    {[1, 2, 3].map(row => (
      <div key={row} className="grid grid-cols-4 gap-3 border-t border-gray-100 py-4 dark:border-[#262a3d]">
        {[1, 2, 3, 4].map(cell => (
          <div key={cell} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-[#262a3d]" />
        ))}
      </div>
    ))}
  </div>
);

export default function AdminTeacherMonitoringCards({
  escalations,
  inactiveTeachers,
  pendingTeacherFlags = [],
  loading = false,
}: AdminTeacherMonitoringCardsProps) {
  const router = useRouter();
  const escalationBlock = escalations ?? {
    total: pendingTeacherFlags.length,
    limit: Math.max(pendingTeacherFlags.length, 1),
    escalations: pendingTeacherFlags.map(flag => ({
      ...flag,
      class_period: flag.class_period ?? null,
      total_student_count: flag.total_student_count ?? Math.max(flag.yellow_count, 1),
      severity: flag.severity ?? (flag.threshold_percentage >= 40 ? 'high' : 'moderate'),
    })),
  };
  const inactivityBlock = inactiveTeachers ?? {
    threshold_days: 7,
    total: 0,
    total_teachers: 0,
    limit: 5,
    offset: 0,
    teachers: [],
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-900/30 dark:bg-[#151722]">
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-50 p-2 text-red-500 dark:bg-red-950/40">
              <Flag size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">Teacher Escalations (30%+ Yellow Flagged)</h2>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Teachers with 30% or more of their class on the Yellow Watch List</p>
            </div>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/50">
            {loading ? '—' : escalationBlock.total}
          </span>
        </div>

        {loading ? <SkeletonRows /> : (
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:border-[#262a3d]">
                  <th className="px-2 py-2.5">Teacher</th>
                  <th className="px-2 py-2.5">Class / Period</th>
                  <th className="px-2 py-2.5 text-center">% Yellow Flagged</th>
                  <th className="px-2 py-2.5 text-center">Students</th>
                  <th className="w-8" aria-label="Open class" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                {escalationBlock.escalations.map(escalation => {
                  const high = escalation.severity === 'high';
                  return (
                    <tr
                      key={escalation.flag_id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/principal-classes/${escalation.class_id}?from=dashboard`)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') router.push(`/principal-classes/${escalation.class_id}?from=dashboard`);
                      }}
                      className="cursor-pointer transition-colors hover:bg-red-50/50 dark:hover:bg-red-950/10"
                    >
                      <td className="px-2 py-3.5 font-bold text-gray-900 dark:text-white">{escalation.teacher_first_name} {escalation.teacher_last_name}</td>
                      <td className="px-2 py-3.5 text-gray-600 dark:text-gray-300">
                        {escalation.class_name}{escalation.class_period != null ? ` · Period ${escalation.class_period}` : ''}
                      </td>
                      <td className="px-2 py-3.5 text-center">
                        <span className={`inline-flex rounded-full px-2 py-1 font-extrabold ${high ? 'bg-red-100 text-red-600 dark:bg-red-950/50' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50'}`}>
                          {Math.round(escalation.threshold_percentage)}%
                        </span>
                        <span className={`mt-1 block text-[10px] font-bold capitalize ${high ? 'text-red-500' : 'text-amber-600'}`}>{escalation.severity}</span>
                      </td>
                      <td className="px-2 py-3.5 text-center font-bold text-gray-700 dark:text-gray-200">{escalation.yellow_count} / {escalation.total_student_count}</td>
                      <td className="pr-1 text-gray-400"><ChevronRight size={16} /></td>
                    </tr>
                  );
                })}
                {escalationBlock.total === 0 && (
                  <tr><td colSpan={5} className="px-3 py-12 text-center text-sm text-gray-400">No active teacher escalations</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <Link href="/principal-teachers?tab=observation" className="mt-2 flex items-center justify-center gap-1.5 border-t border-red-100 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20">
            View all ({escalationBlock.total}) <ChevronRight size={14} />
          </Link>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-900/30 dark:bg-[#151722]">
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-50 p-2 text-red-500 dark:bg-red-950/40">
              <UserRoundX size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">Teachers Not Logging In</h2>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Classes where teachers haven&apos;t recorded data in {inactivityBlock.threshold_days}+ days</p>
              {!loading && inactivityBlock.total > 0 && <p className="mt-1 text-[10px] font-semibold text-red-500">{inactivityBlock.total_teachers} affected {inactivityBlock.total_teachers === 1 ? 'teacher' : 'teachers'}</p>}
            </div>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/50">
            {loading ? '—' : inactivityBlock.total}
          </span>
        </div>

        {loading ? <SkeletonRows /> : (
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:border-[#262a3d]">
                  <th className="px-2 py-2.5">Teacher</th>
                  <th className="px-2 py-2.5">Class / Period</th>
                  <th className="px-2 py-2.5">Last Recorded</th>
                  <th className="px-2 py-2.5 text-center">Days Since</th>
                  <th className="w-8" aria-label="Open class" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                {inactivityBlock.teachers.map(teacher => (
                  <tr
                    key={`${teacher.teacher_id}-${teacher.class_id}`}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/principal-classes/${teacher.class_id}?from=dashboard`)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') router.push(`/principal-classes/${teacher.class_id}?from=dashboard`);
                    }}
                    className="cursor-pointer transition-colors hover:bg-red-50/50 dark:hover:bg-red-950/10"
                  >
                    <td className="px-2 py-4 font-bold text-gray-900 dark:text-white">{teacher.teacher_first_name} {teacher.teacher_last_name}</td>
                    <td className="px-2 py-4 text-gray-600 dark:text-gray-300">{teacher.class_name}{teacher.class_period != null ? ` · Period ${teacher.class_period}` : ''}</td>
                    <td className="px-2 py-4 text-gray-600 dark:text-gray-300">{formatRecordedDate(teacher.last_data_recorded_at)}</td>
                    <td className="px-2 py-4 text-center font-extrabold text-red-500">{teacher.days_since_recording} days</td>
                    <td className="pr-1 text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))}
                {inactivityBlock.total === 0 && (
                  <tr><td colSpan={5} className="px-3 py-12 text-center text-sm text-gray-400">All teachers have been active recently</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <Link href="/principal-inactive-teachers" className="mt-2 flex items-center justify-center gap-1.5 border-t border-red-100 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20">
            View all ({inactivityBlock.total} classes) <ChevronRight size={14} />
          </Link>
        )}
      </section>
    </div>
  );
}
