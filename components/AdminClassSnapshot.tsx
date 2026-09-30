'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  generateAdminStudentReport,
  StudentClassSnapshot, StudentClassSnapshotRow,
} from '@/lib/adminDashboardService';

const columns = [
  ['present', 'Present', 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300'],
  ['absent', 'Absent', 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'],
  ['yellow', 'Yellow', 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300'],
  ['red', 'Red', 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300'],
  ['super_green', 'Super Green', 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'],
] as const;

function displayDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

interface Props {
  studentId: string;
  snapshot: StudentClassSnapshot | null | undefined;
  disabled?: boolean;
  onReport: (report: any) => void;
}

export default function AdminClassSnapshot({ studentId, snapshot, disabled = false, onReport }: Props) {
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportClass, setReportClass] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const busy = disabled || reportClass !== null;

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
        {reportError && <p role="alert" className="text-sm text-red-600">{reportError}</p>}
      </div>
      {!snapshot ? <p role="status" className="px-5 pb-5 text-sm text-gray-500">Class activity is currently unavailable.</p>
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
