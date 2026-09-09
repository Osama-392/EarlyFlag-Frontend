'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowDown, ArrowUp, Minus, RefreshCw } from 'lucide-react';
import {
  AtRiskStudentsBlock,
  StudentsImprovingBlock,
  getAdminAtRisk,
  getAdminImproving,
} from '@/lib/adminDashboardService';

const PAGE_SIZE = 20;

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Trend({ value }: { value: number }) {
  if (value > 0) return <span className="inline-flex items-center font-bold text-red-600" aria-label="Increasing"><ArrowUp size={14} /></span>;
  if (value < 0) return <span className="inline-flex items-center font-bold text-emerald-600" aria-label="Decreasing"><ArrowDown size={14} /></span>;
  return <span className="inline-flex items-center text-gray-400"><Minus size={14} /></span>;
}

export default function PrincipalStudentRankingPage({ mode }: { mode: 'at-risk' | 'improving' }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AtRiskStudentsBlock | StudentsImprovingBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async (background = false) => {
    if (background) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = mode === 'at-risk'
        ? await getAdminAtRisk(PAGE_SIZE, offset)
        : await getAdminImproving(PAGE_SIZE, offset);
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load student rankings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, page]);

  useEffect(() => { void fetchRanking(); }, [fetchRanking]);

  useEffect(() => {
    const refresh = () => void fetchRanking(true);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('dashboard-refresh', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('dashboard-refresh', refresh);
      window.clearInterval(interval);
    };
  }, [fetchRanking]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = mode === 'at-risk' ? 'Most At-Risk Students' : 'Students Improving';
  const subtitle = mode === 'at-risk'
    ? 'Students ranked by current Red events and active flags.'
    : 'Students with the largest decrease in active flags and no current seven-day Red.';

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => router.push('/principal-dashboard')} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-gray-50 dark:border-[#262a3d] dark:bg-[#151722] dark:text-blue-400">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button onClick={() => void fetchRanking(true)} disabled={refreshing} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-[#1b1e2c]" aria-label="Refresh rankings">
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 py-16 text-red-700">
          <AlertCircle size={36} className="mb-3" />
          <p className="mb-4 text-sm font-semibold">{error}</p>
          <button onClick={() => void fetchRanking()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Try Again</button>
        </div>
      ) : loading ? (
        <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-[#1b1e2c]" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-[#262a3d] dark:bg-[#1b1e2c]">
                {mode === 'at-risk' ? (
                  <tr><th className="px-5 py-3">Student</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">A</th><th className="px-4 py-3">B</th><th className="px-4 py-3">Active Reds</th><th className="px-4 py-3">Trend</th><th className="px-4 py-3">Last Activity</th></tr>
                ) : (
                  <tr><th className="px-5 py-3">Student</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Change (7 Days)</th><th className="px-4 py-3">Last Activity</th></tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                {mode === 'at-risk'
                  ? (data as AtRiskStudentsBlock)?.students.map(student => (
                    <tr key={student.student_id} onClick={() => router.push(`/principal-students/${student.student_id}`)} className="cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/10">
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{student.grade_level}</td>
                      <td className="px-4 py-3"><span className="rounded bg-amber-100 px-2 py-1 font-bold text-amber-700">A: {student.academic_active_flags}</span></td>
                      <td className="px-4 py-3"><span className="rounded bg-red-100 px-2 py-1 font-bold text-red-700">B: {student.behavioral_active_flags}</span></td>
                      <td className="px-4 py-3 font-bold text-red-600">{student.red_count_7d}</td>
                      <td className="px-4 py-3"><Trend value={student.active_flag_change_7d} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(student.last_activity_date)}</td>
                    </tr>
                  ))
                  : (data as StudentsImprovingBlock)?.students.map(student => (
                    <tr key={student.student_id} onClick={() => router.push(`/principal-students/${student.student_id}`)} className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{student.grade_level}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{student.previous_active_flag_count} → {student.current_active_flag_count} ↓{student.net_decrease}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(student.last_activity_date)}</td>
                    </tr>
                  ))}
                {data?.students.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-gray-500">No students currently match this ranking.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 text-sm dark:border-[#262a3d]">
            <span className="text-gray-500">{total} students</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-[#262a3d]">Previous</button>
              <span className="text-gray-600 dark:text-gray-300">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="rounded border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-[#262a3d]">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
