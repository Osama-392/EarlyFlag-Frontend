'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { createAdminReportPdf, AdminReportPdfData } from '@/lib/adminReportPdf';
import { reportDate, reportHistory, scrollReportToTop } from '@/lib/reportPresentation';
import StudentReportHistory from '@/components/StudentReportHistory';

interface ReportViewProps {
  student: { id: string; name: string; gradeLevel: number; initial: string; bgColor: string };
  reportData: {
    startDate?: string; endDate?: string; start_date?: string; end_date?: string;
    subject: string; class_id?: string;
    includeTeachersNotes?: boolean; include_teachers_notes?: boolean;
    includeAIRecommendations?: boolean; include_ai_recommendations?: boolean;
    result?: any;
  };
  variant?: 'admin' | 'teacher';
  onBack: () => void;
  backLabel?: string;
}

export default function ReportView({ student, reportData, variant, onBack, backLabel = 'Back to Reports' }: ReportViewProps) {
  const { user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { scrollReportToTop(root.current); }, [reportData]);

  const response = reportData.result;
  const report = response?.report || response || {};
  const teacherView = variant === 'teacher' || (!variant && !['admin', 'principal'].includes(user?.role || ''));
  const classReport = Boolean(report.report_class || reportData.class_id);
  const start = report.selected_range_start || reportData.start_date || reportData.startDate;
  const end = report.selected_range_end || reportData.end_date || reportData.endDate;
  const range = `${reportDate(start)} – ${reportDate(end)}`;
  const includeNotes = reportData.includeTeachersNotes !== false && reportData.include_teachers_notes !== false;
  const className = report.report_class?.class_name || reportData.subject || 'All Subjects';
  const classTeacher = report.report_class?.teacher_name || '';
  const snapshot = response?.class_snapshot;
  const history = reportHistory(report.class_history ?? report.flag_log ?? report.signals ?? [], includeNotes, start, end);
  const snapshotRows = snapshot?.classes || [];
  const selected = report.counts_selected_range;
  // Overview cards and table share class-scoped counts. Cross-class alerts stay separate.
  const counts = !classReport && !teacherView && snapshot ? snapshotRows.reduce((sum: any, row: any) => {
    for (const key of ['super_green', 'yellow', 'red', 'present', 'absent']) sum[key] += row.counts[key] || 0;
    return sum;
  }, { super_green: 0, yellow: 0, red: 0, present: 0, absent: 0 }) : selected || {
    super_green: history.filter(row => ['super_green', 'green'].includes(row.signalType)).length,
    yellow: history.filter(row => row.signalType === 'yellow').length,
    red: history.filter(row => row.signalType === 'red').length,
    present: 0, absent: history.filter(row => row.signalType === 'absent').length,
  };
  const crossClassAlerts = !classReport && !teacherView ? report.cross_class_alerts || [] : [];
  const pdfData: AdminReportPdfData = {
    name: student.name, initials: student.initial, grade: `Grade ${student.gradeLevel}`,
    studentId: report.student?.external_student_id, iep: false, ell: false,
    period: range, dateRange: range, subject: className,
    kind: classReport ? 'class' : 'overview', teacherName: classTeacher, includeNotes,
    counts: { superGreen: counts.super_green || 0, yellow: counts.yellow || 0, red: counts.red || 0, present: counts.present || 0, absent: counts.absent || 0 },
    crossClassAlerts: crossClassAlerts.map((alert: any) => ({
      date: reportDate(alert.occurred_on), description: alert.description,
      contributions: (alert.contributions || []).map((item: any) => `${item.class_name || 'Class'} ${reportDate(item.signal_date)}${item.is_inferred ? ' (inferred)' : ''}`).join(' + '),
    })),
    classSnapshot: !classReport && !teacherView && snapshot ? {
      range, rows: snapshotRows.map((row: any) => ({
        className: row.class_name, teacherName: row.teacher.display_name,
        superGreen: row.counts.super_green, present: row.counts.present, absent: row.counts.absent,
        yellow: row.counts.yellow, red: row.counts.red, latestNote: '',
      })),
    } : undefined,
    history,
  };
  async function exportPdf() {
    setExporting(true); setError(null);
    try { createAdminReportPdf(pdfData).save(`${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`); }
    catch { setError('The PDF could not be exported. Please try again.'); }
    finally { setExporting(false); }
  }

  return <div ref={root} className="w-full min-w-0 space-y-6 pb-12 text-slate-900 dark:text-white">
    <div className="no-print flex items-center justify-between gap-3">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-blue-600"><ArrowLeft size={16} />{backLabel}</button>
      <button title="Export Student Report as PDF" onClick={() => void exportPdf()} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export PDF
      </button>
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <article className="report-print-area space-y-6 rounded-xl bg-white p-6 dark:bg-[#151722]">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">{student.initial}</div>
          <div><p className="text-xs text-slate-500">{classReport ? 'CLASS REPORT' : 'STUDENT REPORT'}</p>
            <h1 className="mt-1 text-xl font-bold">{student.name}</h1>
            <p className="mt-2 text-xs text-slate-500">Grade {student.gradeLevel}{classReport ? ` | ${className}${classTeacher ? ` | ${classTeacher}` : ''}` : report.student?.external_student_id ? ` | ${report.student.external_student_id}` : ''}</p>
          </div>
        </div>
        <div className="text-right text-xs"><p className="font-semibold">{range}</p>{!classReport && <p className="mt-3 text-slate-500">{className}</p>}</div>
      </header>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Super Green', counts.super_green, 'bg-emerald-50 text-emerald-700'],
          ['Yellow Incidents', counts.yellow, 'bg-amber-50 text-amber-700'],
          ['Red Incidents', counts.red, 'bg-red-50 text-red-700'],
        ].map(([label, value, style]) => <div key={String(label)} className={`flex flex-wrap items-center gap-4 rounded-lg p-4 ${style}`}>
          <span className="text-2xl font-bold">{value || 0}</span><span className="text-xs font-semibold">{label}</span>
        </div>)}
      </div>
      {pdfData.crossClassAlerts?.length ? <aside className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-900">
        <h2 className="font-semibold">{pdfData.crossClassAlerts.length} Cross-Class {pdfData.crossClassAlerts.length === 1 ? 'Alert' : 'Alerts'}</h2>
        {pdfData.crossClassAlerts.map((alert, index) => <div key={index}><p>{alert.date} · {alert.description}</p>{alert.contributions && <p className="mt-1">{alert.contributions}</p>}</div>)}
        <p>Admin-only; does not add a Red to any class.</p>
      </aside> : null}
      {classReport && <section>
        <h2 className="font-semibold">{className} Attendance</h2><p className="mt-1 text-xs text-gray-500">Recorded class signals for {range}; not a school-wide attendance total.</p>
        <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-lg bg-emerald-50 p-4 text-emerald-700"><strong className="mr-4 text-2xl">{counts.present || 0}</strong> Present</div><div className="rounded-lg bg-slate-50 p-4 text-slate-500"><strong className="mr-4 text-2xl">{counts.absent || 0}</strong> Absent</div></div>
        <p className="mt-2 text-xs text-gray-500">A recorded zero does not confirm every class period was logged.</p>
      </section>}
      {pdfData.classSnapshot && <section>
        <h2 className="font-semibold">Class-by-Class Snapshot</h2><p className="my-2 text-xs text-gray-500">{range} | Class-scoped counts</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500"><tr>{['Subject / Teacher', 'Super Green', 'Present', 'Absent', 'Yellow', 'Red'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{pdfData.classSnapshot.rows.map((row, index) => <tr key={index}>
            <th className="p-3 font-semibold">{row.className}<span className="mt-1 block font-normal text-gray-500">{row.teacherName}</span></th>
            {[row.superGreen, row.present, row.absent, row.yellow, row.red].map((value, i) => <td key={i} className="p-3"><span className={`inline-block rounded px-3 py-1 ${i === 4 ? 'bg-red-50 text-red-700' : i === 3 ? 'bg-amber-50 text-amber-700' : i === 2 ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{value}</span></td>)}
          </tr>)}</tbody>
        </table></div>
        {!pdfData.classSnapshot.rows.length && <p className="py-4 text-sm text-gray-500">No active classes match this report.</p>}
        <p className="mt-2 text-xs text-gray-500">Present and Absent are recorded class signals, not verified days attended.</p>
      </section>}
      <section><h2 className="font-semibold">Student History{classReport ? ` · ${className}` : ''}</h2>
        <p className="my-2 text-xs text-gray-500">{range}{!classReport ? ' | Grouped by class' : ''}</p>
        <StudentReportHistory rows={history} grouped={!classReport} includeNotes={includeNotes} />
      </section>
    </article>
  </div>;
}
