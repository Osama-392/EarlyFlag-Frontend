'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import {
  generateAdminStudentReport, getAdminStudentProfile,
  StudentClassSnapshot, StudentClassSnapshotRow,
} from '@/lib/adminDashboardService';

const columns = [
  ['present', 'Present', 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300'],
  ['absent', 'Absent', 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'],
  ['yellow', 'Yellow', 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300'],
  ['red', 'Red', 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300'],
  ['super_green', 'Super Green', 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'],
] as const;

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function displayDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

interface Props {
  studentId: string;
  snapshot: StudentClassSnapshot | null | undefined;
  academicStart: string;
  onSnapshot: (snapshot: StudentClassSnapshot) => void;
  onReport: (report: any) => void;
}

export default function AdminClassSnapshot({ studentId, snapshot, academicStart, onSnapshot, onReport }: Props) {
  const yearStart = snapshot?.academic_year_start ?? academicStart;
  const [preset, setPreset] = useState(() => {
    if (!snapshot) return 'academic';
    if (snapshot.range_end !== snapshot.local_today) return 'custom';
    if (snapshot.range_start === yearStart) return 'academic';
    if (snapshot.range_start === shiftDate(snapshot.local_today, -6)) return '7d';
    if (snapshot.range_start === shiftDate(snapshot.local_today, -29)) return '30d';
    return 'custom';
  });
  const [start, setStart] = useState(snapshot?.range_start || '');
  const [end, setEnd] = useState(snapshot?.range_end || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportClass, setReportClass] = useState<string | null>(null);
  const request = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current += 1; };
  }, []);

  const invalidDates = !start || !end || start > end;
  const busy = loading || reportClass !== null;

  async function loadRange() {
    if (invalidDates) return;
    const current = ++request.current;
    setLoading(true);
    setError(null);
    setReportError(null);
    try {
      const result = await getAdminStudentProfile(studentId, { start_date: start, end_date: end });
      if (current !== request.current) return;
      if (!result.class_snapshot) throw new Error('Class snapshot is unavailable.');
      onSnapshot(result.class_snapshot);
    } catch (err: any) {
      if (current === request.current) setError(err?.response?.data?.detail || 'Unable to load class activity. Please retry.');
    } finally {
      if (current === request.current) setLoading(false);
    }
  }

  async function viewReport(row: StudentClassSnapshotRow) {
    if (!snapshot) return;
    setReportClass(row.class_id);
    setReportError(null);
    const options = {
      class_id: row.class_id, start_date: snapshot.range_start, end_date: snapshot.range_end,
      include_teachers_notes: true, include_template: true,
    };
    try {
      const result = await generateAdminStudentReport(studentId, options);
      if (mounted.current) onReport({ ...options, subject: row.class_name, result });
    } catch (err: any) {
      if (mounted.current) setReportError(err?.response?.data?.detail || 'Unable to create the class report. Please retry.');
    } finally {
      if (mounted.current) setReportClass(null);
    }
  }

  return (
    <section aria-labelledby="class-snapshot-heading" className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722]">
      <div className="p-5 space-y-4">
        <div>
          <h2 id="class-snapshot-heading" className="text-lg font-bold text-gray-900 dark:text-white">Class-by-Class Snapshot</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recorded attendance signals and classroom observations for the selected period.</p>
          {snapshot && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{displayDate(snapshot.range_start)} – {displayDate(snapshot.range_end)} · Current enrollments</p>}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void loadRange(); }} className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Period
            <select value={preset} disabled={busy || !snapshot} onChange={(event) => {
              const value = event.target.value;
              setPreset(value);
              if (!snapshot || value === 'custom') return;
              setEnd(snapshot.local_today);
              setStart(value === 'academic' ? yearStart : shiftDate(snapshot.local_today, value === '7d' ? -6 : -29));
            }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]">
              <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
              <option value="academic">Academic year to date</option><option value="custom">Custom range</option>
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">From
            <input type="date" required value={start} disabled={busy} onChange={(event) => { setStart(event.target.value); setPreset('custom'); }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]" />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">To
            <input type="date" required value={end} min={start} disabled={busy} onChange={(event) => { setEnd(event.target.value); setPreset('custom'); }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]" />
          </label>
          <button type="submit" disabled={invalidDates || busy} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
            {loading && <RefreshCw size={14} className="animate-spin" />} {error ? 'Retry' : 'Apply'}
          </button>
        </form>
        {start && end && start > end && <p role="alert" className="text-sm text-red-600">From must be on or before To.</p>}
        {reportError && <p role="alert" className="text-sm text-red-600">{reportError}</p>}
      </div>
      {loading ? <p role="status" className="px-5 pb-5 text-sm text-gray-500">Loading class activity…</p>
        : error ? <p role="alert" className="px-5 pb-5 text-sm text-red-600">{error}</p>
        : !snapshot ? <p role="status" className="px-5 pb-5 text-sm text-gray-500">Class activity is currently unavailable.</p>
        : snapshot.classes.length === 0 ? <p className="px-5 pb-5 text-sm text-gray-500">This student has no active classes.</p>
        : <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-y border-gray-100 bg-gray-50/50 text-xs text-gray-600 dark:border-[#262a3d] dark:bg-[#1b1e2c] dark:text-gray-300">
              <tr><th scope="col" className="px-5 py-3">Subject / Teacher</th>
                {columns.map(([key, label]) => <th key={key} scope="col" className="px-3 py-3 text-center">{label}</th>)}
                <th scope="col" className="px-5 py-3">Latest Note</th><th scope="col" className="px-5 py-3"><span className="sr-only">Report</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
              {snapshot.classes.map((row) => <tr key={row.class_id}>
                <th scope="row" className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{row.class_name}<span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">{row.teacher.display_name}</span></th>
                {columns.map(([key, label, style]) => <td key={key} className="px-3 py-3 text-center"><span aria-label={`${label}: ${row.counts[key]}`} className={`inline-block min-w-9 rounded-md border px-2 py-0.5 text-xs font-semibold ${style}`}>{row.counts[key]}</span></td>)}
                <td className="max-w-xs px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{row.latest_note
                  ? <><time dateTime={row.latest_note.signal_date}>{displayDate(row.latest_note.signal_date)}</time> · <span className="break-words">{row.latest_note.excerpt}</span></>
                  : 'No notes in this period'}</td>
                <td className="px-5 py-3 text-right"><button type="button" disabled={busy} aria-label={`View report for ${row.class_name}`} onClick={() => void viewReport(row)} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400">
                  {reportClass === row.class_id ? 'Creating…' : 'View report'} <ArrowRight size={13} />
                </button></td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      <p className="border-t border-gray-100 p-5 text-xs text-gray-500 dark:border-[#262a3d] dark:text-gray-400">Present and Absent count recorded signals, not days attended. Super Green includes automatic entries. Cross-class Reds appear in the student summary.</p>
    </section>
  );
}
