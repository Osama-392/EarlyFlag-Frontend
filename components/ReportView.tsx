'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { createAdminReportPdf, AdminReportPdfData } from '@/lib/adminReportPdf';
import { reportCategoryCounts, reportDate, reportHistory, scrollReportToTop } from '@/lib/reportPresentation';
import StudentReportDocument from '@/components/StudentReportDocument';

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
    categories: reportCategoryCounts(history),
    crossClassAlerts: crossClassAlerts.map((alert: any) => ({
      date: reportDate(alert.occurred_on), description: alert.description || 'Yellow incidents occurred across different classes within a 7-day period.',
      items: (alert.contributions || []).map((item: any) => ({
        title: item.title || item.reason_description || item.reason || '',
        className: item.class_name || 'Class', date: reportDate(item.signal_date), inferred: Boolean(item.is_inferred),
      })),
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
    <StudentReportDocument data={pdfData} />
  </div>;
}
