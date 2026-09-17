'use client';

import { useRef, useState } from 'react';
import { 
  Download, ArrowLeft, Loader2, AlertCircle, AlertTriangle, 
  CheckCircle, Shield, BookOpen, Clock, Activity, Flag, CalendarDays
} from 'lucide-react';
import { logger } from '@/lib/logger';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createTeacherReportPdf } from '@/lib/teacherReportPdf';
import { useAuth } from '@/app/providers';

interface ReportViewProps {
  student: {
    id: string;
    name: string;
    gradeLevel: number;
    initial: string;
    bgColor: string;
  };
  reportData: {
    startDate?: string;
    endDate?: string;
    start_date?: string;
    end_date?: string;
    subject: string;
    includeTeachersNotes?: boolean;
    includeAIRecommendations?: boolean;
    include_teachers_notes?: boolean;
    include_ai_recommendations?: boolean;
    result?: any;
  };
  variant?: 'admin' | 'teacher';
  onBack: () => void;
  backLabel?: string;
}

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  try {
    const parsed = new Date(d.includes('T') ? d : d + 'T00:00:00');
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function CountsCard({ label, counts }: { label: string; counts?: { super_green: number; present: number; yellow: number; red: number; absent: number } }) {
  if (!counts) return null;
  return (
    <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        <div><p className="text-lg font-bold text-emerald-600">{counts.super_green || 0}</p><p className="text-gray-500 dark:text-gray-400">Super Green</p></div>
        <div><p className="text-lg font-bold text-green-600">{counts.present || 0}</p><p className="text-gray-500 dark:text-gray-400">Present</p></div>
        <div><p className="text-lg font-bold text-yellow-600">{counts.yellow || 0}</p><p className="text-gray-500 dark:text-gray-400">Yellow</p></div>
        <div><p className="text-lg font-bold text-red-600">{counts.red || 0}</p><p className="text-gray-500 dark:text-gray-400">Red</p></div>
        <div><p className="text-lg font-bold text-gray-600 dark:text-gray-400">{counts.absent || 0}</p><p className="text-gray-500 dark:text-gray-400">Absent</p></div>
      </div>
    </div>
  );
}

function formatGrade(gradeLevel: number) {
  if (!gradeLevel) return 'Grade not available';
  const mod100 = gradeLevel % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? 'th'
    : gradeLevel % 10 === 1
      ? 'st'
      : gradeLevel % 10 === 2
        ? 'nd'
        : gradeLevel % 10 === 3
          ? 'rd'
          : 'th';

  return `${gradeLevel}${suffix} Grade`;
}

function getReportRangeDays(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  // Count inclusive calendar days without daylight-saving offsets.
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00Z`);
  const endDate = new Date(`${end.slice(0, 10)}T00:00:00Z`);
  const inclusiveDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  return Number.isFinite(inclusiveDays) && inclusiveDays > 0 ? inclusiveDays : null;
}

function getReportPeriodLabel(start?: string, end?: string) {
  const inclusiveDays = getReportRangeDays(start, end);
  if (!inclusiveDays) return 'Selected Date Range';

  if (inclusiveDays === 30) return 'Last 30 Days';
  if (inclusiveDays === 90) return 'Last 90 Days';
  return `${formatDate(start)} - ${formatDate(end)}`;
}


export default function ReportView({
  student,
  reportData,
  variant,
  onBack,
  backLabel = 'Back to Reports',
}: ReportViewProps) {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine active variant (default based on user role if not specified)
  const isTeacherView = variant === 'teacher' || (!variant && user?.role !== 'principal' && user?.role !== 'admin');

  const report = reportData?.result?.report || reportData?.result;
  const rawFlagLog = report?.flag_log || report?.signals || report?.recent_flags || [];

  const today = new Date();
  const d7 = new Date(today.getTime() - 7 * 86400000);
  const d30 = new Date(today.getTime() - 30 * 86400000);

  const isSuperGreenOrGeneral = (s: any): boolean => {
    if (!s) return false;
    const st = String(s.signal_type || '').toLowerCase();
    const cat = String(s.category || '').toLowerCase();
    if (st === 'red' || st === 'yellow' || st === 'absent') return false;
    return st === 'green' || st === 'super_green' || cat === 'super_green' || cat === 'general';
  };

  const parseSignalDate = (s: any): Date => {
    const raw = s.signal_date || s.created_at;
    if (!raw) return new Date(0);
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59);
    }
    return new Date(raw);
  };

  const selectedRangeStart = report?.selected_range_start || reportData.start_date || reportData.startDate;
  const selectedRangeEnd = report?.selected_range_end || reportData.end_date || reportData.endDate;
  const selectedRangeSignals = rawFlagLog.filter((signal: any) => {
    const signalDate = parseSignalDate(signal);
    const startsInRange = !selectedRangeStart || signalDate >= new Date(`${selectedRangeStart}T00:00:00`);
    const endsInRange = !selectedRangeEnd || signalDate <= new Date(`${selectedRangeEnd}T23:59:59`);
    return startsInRange && endsInRange;
  });
  const redFlagsInRange = selectedRangeSignals.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'red');
  const yellowFlagsInRange = selectedRangeSignals.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'yellow');
  const greenFlagsInRange = selectedRangeSignals.filter(isSuperGreenOrGeneral);

  const redCount = report?.counts_selected_range?.red ?? redFlagsInRange.length;
  const yellowCount = report?.counts_selected_range?.yellow ?? yellowFlagsInRange.length;
  const greenCount = report?.counts_selected_range?.super_green
    ?? report?.counts_selected_range?.green
    ?? greenFlagsInRange.length;

  let statusText = 'Normal';
  if (redCount > 0) statusText = 'Red';
  else if (yellowCount > 0) statusText = 'Yellow';
  else if (greenCount > 0) statusText = 'Super Green';

  const fallbackCounts = (sinceDate: Date) => {
    const res = { super_green: 0, present: 0, yellow: 0, red: 0, absent: 0 };
    rawFlagLog.forEach((f: any) => {
      const fDate = new Date(f.signal_date + 'T00:00:00');
      if (fDate >= sinceDate) {
        const st = String(f.signal_type || '').toUpperCase();
        if (st === 'RED') res.red++;
        else if (st === 'YELLOW') res.yellow++;
        else if (st === 'SUPER_GREEN' || st === 'GREEN') res.super_green++;
        else if (st === 'PRESENT') res.present++;
        else if (st === 'ABSENT') res.absent++;
      }
    });
    return res;
  };

  const fallbackCat7 = () => {
    const res = { yellow_academic: 0, yellow_behavioral: 0, red_academic: 0, red_behavioral: 0 };
    rawFlagLog.forEach((f: any) => {
      const fDate = new Date(f.signal_date + 'T00:00:00');
      if (fDate >= d7) {
        const st = String(f.signal_type || '').toUpperCase();
        const cat = String(f.category || '').toUpperCase();
        if (st === 'YELLOW') {
          if (cat === 'ACADEMIC') res.yellow_academic++;
          else if (cat === 'BEHAVIORAL') res.yellow_behavioral++;
          else res.yellow_academic++;
        } else if (st === 'RED') {
          if (cat === 'ACADEMIC') res.red_academic++;
          else if (cat === 'BEHAVIORAL') res.red_behavioral++;
          else res.red_academic++;
        }
      }
    });
    return res;
  };

  const counts7d = report?.counts_7d || report?.summary_counts?.window_7d || fallbackCounts(d7);
  const counts30d = report?.counts_30d || report?.summary_counts?.window_30d || fallbackCounts(d30);
  const countsSemester = report?.counts_semester
    || report?.summary_counts?.window_semester
    || fallbackCounts(new Date(today.getFullYear(), today.getMonth() > 6 ? 7 : 0, 1));
  const cat7d = report?.category_7d || report?.category_breakdown || fallbackCat7();
  const semesterStart = report?.semester_start || `${today.getFullYear()}-08-01`;
  const semesterEnd = report?.semester_end || `${today.getFullYear()}-12-31`;
  const semesterAbsentCount = report?.semester_absent_count ?? countsSemester.absent;

  const unresolvedAlerts = report?.unresolved_alerts || [];
  const recentReferrals = report?.recent_referrals || [];
  const recommendations = report?.talking_points || [];

  // Notes
  const notes = report?.recent_notes && report.recent_notes.length > 0 
    ? report.recent_notes 
    : rawFlagLog.filter((s: any) => s.note && String(s.note).trim() !== '');

  const teachersNotes = report?.one_ask_for_parents;
  const reportPeriodLabel = getReportPeriodLabel(selectedRangeStart, selectedRangeEnd);
  const reportRangeDays = getReportRangeDays(selectedRangeStart, selectedRangeEnd);
  const teacherCountPeriodLabel = reportRangeDays
    ? `${reportRangeDays} ${reportRangeDays === 1 ? 'Day' : 'Days'}`
    : 'Report Period';
  // Use backend selected-range totals (including zero), not dashboard 7-day totals.
  const teacherRedCount = redCount;
  const teacherYellowCount = yellowCount;
  const teacherGreenCount = greenCount;
  const teacherStatusText = teacherRedCount > 0
    ? 'Red'
    : teacherYellowCount > 0
      ? 'Yellow'
      : teacherGreenCount > 0
        ? 'Super Green'
        : 'Normal';
  const teacherHistory = [...selectedRangeSignals].sort(
    (a: any, b: any) => parseSignalDate(b).getTime() - parseSignalDate(a).getTime(),
  );

  const handleExportPDF = async () => {
    if (!reportContentRef.current) return;
    logger.buttonClick('Export as PDF', 'ReportView');
    setExporting(true);
    setExportError(null);
    try {
      if (isTeacherView) {
        // Read the already-filtered report table, so export has exactly the same
        // rows, descriptions and order as the official report preview.
        const root = reportContentRef.current;
        const history = Array.from(root.querySelectorAll<HTMLTableRowElement>('[data-pdf-history-row]')).map((row) => ({
          date: row.cells[0].textContent?.trim() || '',
          level: row.cells[1].textContent?.trim() || '',
          signalType: row.dataset.signalType || '',
          description: row.cells[2].textContent?.trim() || '',
          className: row.cells[3].textContent?.trim() || '',
        }));
        const notesSection = root.querySelector('[data-pdf-section="notes"]');
        const pdfNotes = notesSection ? Array.from(notesSection.querySelectorAll('[data-pdf-note]')).map((note) => ({
          date: note.querySelector('[data-pdf-note-date]')?.textContent?.trim() || '',
          className: note.querySelector('[data-pdf-note-class]')?.textContent?.trim() || '',
          text: note.querySelector('[data-pdf-note-text]')?.textContent?.trim() || '',
        })) : undefined;
        if (pdfNotes && !pdfNotes.length && teachersNotes) {
          pdfNotes.push({ date: '', className: '', text: String(teachersNotes) });
        }
        const nameParts = student.name.trim().split(/\s+/);
        const initials = student.initial?.trim() || [nameParts[0], nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''].map((part) => part.charAt(0)).join('').toUpperCase();
        const pdf = createTeacherReportPdf({
          name: student.name,
          initials,
          grade: formatGrade(student.gradeLevel),
          status: teacherStatusText,
          period: reportPeriodLabel,
          countPeriodLabel: teacherCountPeriodLabel,
          subject: reportData.subject || 'All Subjects',
          counts: { red: teacherRedCount, yellow: teacherYellowCount, superGreen: teacherGreenCount },
          history,
          notes: pdfNotes,
        });
        const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
        pdf.save(`${safeName}_Report.pdf`);
        return;
      }

      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const scrollables = clonedDoc.querySelectorAll('.overflow-y-auto, [class*="max-h-"]');
          scrollables.forEach((el: any) => {
            el.style.maxHeight = 'none';
            el.style.overflow = 'visible';
            el.style.height = 'auto';
          });
          const hiddenWrappers = clonedDoc.querySelectorAll('.overflow-hidden');
          hiddenWrappers.forEach((el: any) => {
            el.style.overflow = 'visible';
          });
        },
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      let yOffset = 0;
      let page = 0;

      while (yOffset < imgHeight) {
        if (page > 0) pdf.addPage();
        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceH = (usableHeight / imgHeight) * canvas.height;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(sourceH, canvas.height - sourceY);
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, pageCanvas.height,
            0, 0, canvas.width, pageCanvas.height,
          );
          const pageImg = pageCanvas.toDataURL('image/png');
          const drawHeight = (pageCanvas.height * imgWidth) / canvas.width;
          pdf.addImage(pageImg, 'PNG', margin, margin, imgWidth, drawHeight);
        }
        yOffset += usableHeight;
        page++;
      }

      const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeName}_Report.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError('The PDF could not be exported. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={isTeacherView ? "max-w-6xl mx-auto space-y-6 pb-12" : "space-y-6 max-w-[1600px] mx-auto pb-12"}>
      {exportError && <p role="alert" className="no-print rounded-lg bg-red-50 p-3 text-sm text-red-700">{exportError}</p>}
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; max-height: none !important; }
          .report-print-area .overflow-y-auto,
          .report-print-area [class*="max-h-"],
          .report-print-area .overflow-hidden {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
          }
          .report-print-area > div,
          .report-print-area .rounded-xl,
          .report-print-area .rounded-2xl {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ─── Top Bar: Back Button and Actions ─── */}
      {isTeacherView ? (
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => {
              logger.buttonClick('Back from Report', 'ReportView');
              onBack();
            }}
            className="inline-flex items-center text-sm text-blue-500 bg-white dark:bg-[#151722] border border-blue-100 dark:border-[#262a3d] px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262a3d] transition-colors text-sm font-bold shadow-sm disabled:opacity-50"
              title="Export Student Report as PDF"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      ) : (
        /* Admin Header Bar (matching Admin Student Profile) */
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => {
                logger.buttonClick('Back from Report', 'ReportView');
                onBack();
              }}
              className="mt-1 flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-[#1b1e2c] dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#262a3d] rounded-lg transition-colors border border-transparent dark:border-[#262a3d] no-print"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight capitalize">
                {student.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                <span>Grade {student.gradeLevel}</span>
                {report?.student?.iep_status && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Shield size={10} />IEP
                  </span>
                )}
                {report?.student?.ell_status && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-semibold flex items-center gap-1">
                    <BookOpen size={10} />ELL
                  </span>
                )}
                {report?.student?.parent_email_on_file && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-semibold">
                    📧 Parent email
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 md:pt-0 no-print flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b1e2c] bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] rounded-lg transition-colors font-semibold text-sm shadow-sm disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Report Content Body ─── */}
      <div ref={reportContentRef} className="report-print-area space-y-6">
        {isTeacherView ? (
          /* =========================================================================
             TEACHER STUDENT REPORT (Identical layout to Teacher Student Profile)
             ========================================================================= */
          <>
            {/* Student identity */}
            <section data-pdf-section="identity" className="flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-[#0b1f41] shadow-sm">
              <div className="flex min-w-0 items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-slate-100 text-2xl font-bold text-slate-500 shadow-md">
                  {student.initial || (student.name ? student.name.charAt(0).toUpperCase() : '??')}
                </div>
                <div className="min-w-0">
                  {teacherStatusText !== 'Normal' && (
                    <span className={`inline-flex rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white ${
                      teacherStatusText === 'Red' ? 'bg-red-400' : teacherStatusText === 'Yellow' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}>
                      {teacherStatusText}
                    </span>
                  )}
                  <h1 className="mt-1 truncate text-3xl font-extrabold capitalize tracking-tight text-[#071b3c]">
                    {student.name}
                  </h1>
                  <p className="mt-1 text-sm font-bold text-slate-400">{formatGrade(student.gradeLevel)}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-xl border px-5 py-2.5 text-xs font-extrabold ${
                teacherStatusText === 'Red'
                  ? 'border-red-100 bg-red-50 text-red-500'
                  : teacherStatusText === 'Yellow'
                    ? 'border-amber-100 bg-amber-50 text-amber-600'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-600'
              }`}>
                Status : {teacherStatusText} Active
              </span>
            </section>

            {/* Selected report range summary */}
            <div data-pdf-section="summary" className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Left Column: Incidents Summary */}
              <div className="contents">
                <div className="contents">
                  {/* Red Incidents */}
                  <div className="flex min-h-28 items-center gap-5 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white px-5 py-4">
                    <div className="shrink-0">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <AlertCircle className="h-8 w-8" strokeWidth={2.2} />
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold leading-none text-red-500">{teacherRedCount}</p>
                      <h3 className="mt-1 text-sm font-extrabold text-[#0b1f41]">Red Incidents ({teacherCountPeriodLabel})</h3>
                      <p className="mt-1 text-xs font-medium text-red-500">Urgent interventions</p>
                    </div>
                  </div>

                  {/* Yellow Incidents */}
                  <div className="flex min-h-28 items-center gap-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-5 py-4">
                    <div className="shrink-0">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                        <AlertTriangle className="h-8 w-8" strokeWidth={2.2} />
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold leading-none text-amber-500">{teacherYellowCount}</p>
                      <h3 className="mt-1 text-sm font-extrabold text-[#0b1f41]">Yellow Incidents ({teacherCountPeriodLabel})</h3>
                      <p className="mt-1 text-xs font-medium text-amber-500">Moderate concerns</p>
                    </div>
                  </div>

                  {/* Super Green */}
                  <div className="flex min-h-28 items-center gap-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4">
                    <div className="shrink-0">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                        <CheckCircle className="h-8 w-8" strokeWidth={2.2} />
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold leading-none text-emerald-500">{teacherGreenCount}</p>
                      <h3 className="mt-1 text-sm font-extrabold text-[#0b1f41]">Super Green ({teacherCountPeriodLabel})</h3>
                      <p className="mt-1 text-xs font-medium text-emerald-500">Positive recognitions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Student History */}
              <div className="hidden">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Student History</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Report Period</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 h-[460px] overflow-y-auto">
                  {rawFlagLog.length > 0 ? (
                    <div className="space-y-5">
                      {rawFlagLog.map((signal: any, idx: number) => {
                        const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
                        const dateString = new Date(dateToUse + (String(dateToUse).includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        
                        let lineColor = 'bg-gray-400';
                        let pillClass = 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
                        const sType = String(signal.signal_type || '').toLowerCase();
                        
                        if (sType === 'red') {
                          lineColor = 'bg-red-400';
                          pillClass = 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
                        } else if (sType === 'yellow') {
                          lineColor = 'bg-amber-400';
                          pillClass = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
                        } else if (sType === 'green' || sType === 'super_green' || sType === 'present') {
                          lineColor = 'bg-emerald-400';
                          pillClass = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
                        } else if (sType === 'absent') {
                          lineColor = 'bg-blue-400';
                          pillClass = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
                        }

                        let catDisplay = signal.signal_type === 'present' ? 'Present' : signal.signal_type === 'absent' ? 'Absent' : (signal.category || 'General');
                        if (signal.category && sType !== 'super_green' && sType !== 'present' && sType !== 'absent') {
                          const cleanCat = String(signal.category).replace(/_/g, ' ');
                          catDisplay = `${sType.charAt(0).toUpperCase() + sType.slice(1)} - ${cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1).toLowerCase()}`;
                        }

                        return (
                          <div key={idx} className="flex items-center space-x-3 group">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 shrink-0">{dateString}</span>
                            
                            {/* Status Line */}
                            <div className={`w-2.5 h-1 rounded-full ${lineColor} shrink-0`}></div>
                            
                            {/* Fixed width category pill for perfect vertical alignment */}
                            <div className={`w-36 shrink-0 text-center py-1.5 rounded-lg text-xs font-bold ${pillClass} border truncate`}>
                              {catDisplay}
                            </div>
                            
                            {/* Content box with min-w-0 for proper truncate */}
                            <div className="flex-1 min-w-0 px-3.5 py-1.5 bg-gray-50 dark:bg-[#1b1e2c] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-[#262a3d] flex justify-between items-center gap-2">
                              <span className="truncate flex-1">
                                {signal.signal_type === 'present' ? '' : (signal.title || signal.reason_description || signal.note || 'Flag Logged')}
                              </span>
                              {signal.class_name && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium shrink-0 bg-white dark:bg-[#262a3d] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                  {signal.class_name.startsWith('Manual Referral') || signal.class_name.startsWith('Global') ? signal.class_name : `Class ${signal.class_name}`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No flags in the selected period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student history */}
            <section data-pdf-section="history" className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 pb-4 pt-5 text-[#0b1f41] shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <Flag className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 data-pdf-history-title className="text-base font-extrabold text-[#0b1f41]">Student History</h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reportPeriodLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {reportPeriodLabel}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] table-fixed border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500">
                      <th className="w-[12%] rounded-l-lg px-3 py-3">Date</th>
                      <th className="w-[22%] px-3 py-3">Incident Level</th>
                      <th className="w-[40%] px-3 py-3">Description</th>
                      <th className="w-[26%] rounded-r-lg px-3 py-3">Category/Class</th>
                    </tr>
                  </thead>
                  <tbody data-pdf-history-body>
                    {teacherHistory.map((signal: any, idx: number) => {
                      const signalType = String(signal.signal_type || '').toLowerCase();
                      const isRed = signalType === 'red';
                      const isYellow = signalType === 'yellow';
                      const isPositive = ['green', 'super_green', 'present'].includes(signalType);
                      const category = signalType === 'present'
                        ? 'Present'
                        : signalType === 'absent'
                          ? 'Absent'
                          : String(signal.category || (isPositive ? 'Super Green' : 'General')).replace(/_/g, ' ');
                      const description = signalType === 'present'
                        ? '—'
                        : signal.title || signal.reason_description || signal.description || signal.note || 'Flag Logged';
                      const className = signal.class_name || reportData.subject || 'All Subjects';
                      const isReferral = Boolean(signal.referral_type)
                        || String(signal.origin || '').includes('manual')
                        || String(className).toLowerCase().includes('referral');
                      const classDisplay = String(className) === 'All Subjects'
                        ? className
                        : isReferral
                          ? String(className).toLowerCase().includes('referral')
                            ? className
                            : `Manual Referral - ${className}`
                          : String(className).startsWith('Class ')
                            ? className
                            : `Class ${className}`;
                      const colorClass = isRed
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : isYellow
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : isPositive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200';
                      const dotClass = isRed
                        ? 'bg-red-400'
                        : isYellow
                          ? 'bg-amber-400'
                          : isPositive
                            ? 'bg-emerald-400'
                            : 'bg-slate-400';

                      return (
                        <tr data-pdf-history-row data-signal-type={signalType} key={signal.id || `${signal.signal_date}-${idx}`} className="text-xs text-slate-600">
                          <td className="border-b border-slate-100 px-3 py-2.5 font-medium">
                            {formatDate(signal.signal_date || signal.created_at).replace(/, \d{4}$/, '')}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className={`h-1 w-2.5 shrink-0 rounded-full ${dotClass}`} />
                              <span className={`inline-flex min-w-24 justify-center rounded-lg border px-3 py-1.5 font-bold capitalize ${colorClass}`}>
                                {category}
                              </span>
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{description}</td>
                          <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{classDisplay}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {teacherHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">No flags in the selected period</p>
                </div>
              )}
            </section>

            {/* Teachers Notes */}
            {(reportData.includeTeachersNotes !== false && reportData.include_teachers_notes !== false) && (
              <section data-pdf-section="notes" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <h2 data-pdf-notes-title className="text-base font-extrabold text-[#0b1f41]">Teachers Notes</h2>
                </div>
                
                <div className="p-6">
                  {notes.length > 0 ? (
                    <div data-pdf-notes-list className="space-y-4">
                      {notes.map((signal: any, idx: number) => {
                        const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
                        const dateString = dateToUse ? new Date(dateToUse + (String(dateToUse).includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                        return (
                          <div data-pdf-note key={idx} className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <div className="flex items-center justify-between">
                              <p data-pdf-note-date className="text-xs font-semibold text-slate-400">{dateString}</p>
                              {signal.class_name && <span data-pdf-note-class className="text-xs font-medium text-slate-500">{signal.class_name}</span>}
                            </div>
                            <p data-pdf-note-text className="text-sm font-medium text-slate-700">{signal.note || signal.excerpt || signal.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : teachersNotes ? (
                    <p className="text-sm leading-relaxed text-slate-600">{teachersNotes}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No notes recorded for this student.</p>
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          /* =========================================================================
             ADMIN STUDENT REPORT (Identical layout to Admin Student Profile)
             ========================================================================= */
          <>
            {/* Signal Count Windows (Row 1) */}
            <div className="grid md:grid-cols-3 gap-4">
              <CountsCard label="Last 7 Days" counts={counts7d} />
              <CountsCard label="Last 30 Days" counts={counts30d} />
              <CountsCard 
                label={`Semester (${formatDate(semesterStart)} — ${formatDate(semesterEnd)})`} 
                counts={countsSemester} 
              />
            </div>

            {/* 7-Day Category Breakdown (Row 2) */}
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">7-Day Category Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{cat7d.yellow_academic || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Academic</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{cat7d.yellow_behavioral || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Behavioral</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-500">{cat7d.red_academic || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Academic</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-500">{cat7d.red_behavioral || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Behavioral</p>
                </div>
              </div>
              {semesterAbsentCount > 0 && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={14} className="inline mr-1 text-slate-400" />
                  Semester absences: <span className="font-bold text-gray-900 dark:text-white">{semesterAbsentCount}</span>
                </p>
              )}
            </div>

            {/* Student History (Row 3 - Full Width) */}
            {rawFlagLog && rawFlagLog.length > 0 && (
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
                  <Activity size={16} className="text-teal-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Student History</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-96 overflow-y-auto">
                  {rawFlagLog.map((flag: any, i: number) => {
                    let rawDate = new Date(flag.signal_date + 'T00:00:00');
                    let shortDate = flag.signal_date;
                    let dayOfWeek = '';
                    try {
                      shortDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      dayOfWeek = rawDate.toLocaleDateString('en-US', { weekday: 'short' });
                    } catch (e) {}

                    const sType = flag.signal_type ? flag.signal_type.toUpperCase() : '';
                    const typeLabel = flag.signal_type ? flag.signal_type.charAt(0).toUpperCase() + flag.signal_type.slice(1).toLowerCase() : '';
                    
                    let catLabel = '';
                    if (flag.category) {
                      if (flag.category.toLowerCase() === 'super_green') catLabel = 'Super Green';
                      else if (flag.category.toLowerCase() === 'referral') catLabel = 'Referral';
                      else catLabel = flag.category.charAt(0).toUpperCase() + flag.category.slice(1).toLowerCase();
                    }
                    const displayType = catLabel && sType !== 'SUPER_GREEN' ? `${typeLabel} - ${catLabel}` : (sType === 'SUPER_GREEN' ? 'Super Green' : typeLabel);

                    return (
                      <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors">
                        <div className="flex flex-col text-left shrink-0 w-14 pt-0.5">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{shortDate}</span>
                          <span className="text-xs font-semibold text-gray-400">{dayOfWeek}</span>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-1 pr-4">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                            {flag.title || 'Flag Logged'}
                          </h3>
                          {flag.description && flag.description.toLowerCase() !== (flag.title || '').toLowerCase() && (
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">
                              {flag.description}
                            </p>
                          )}
                          <div className="text-[11px] font-semibold text-gray-400 mt-1">
                            {flag.class_name} • {flag.teacher_name}
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                            sType === 'RED' 
                              ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                              : sType === 'YELLOW'
                              ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
                              : sType === 'ABSENT'
                              ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${sType === 'RED' ? 'bg-red-500' : sType === 'YELLOW' ? 'bg-amber-500' : sType === 'ABSENT' ? 'bg-slate-500' : 'bg-emerald-500'}`} />
                            {displayType}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unresolved Alerts (Row 4) */}
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Unresolved Alerts</h3>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{unresolvedAlerts.length}</span>
              </div>
              {unresolvedAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No unresolved alerts</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-72 overflow-y-auto">
                  {unresolvedAlerts.map((alert: any) => (
                    <div key={alert.alert_id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityStyles[alert.severity?.toLowerCase()] || 'bg-gray-100 dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300'}`}>{alert.severity}</span>
                        <span className="text-xs text-gray-400">{formatDate(alert.triggered_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{alert.rule_description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.class_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referrals (Row 5) */}
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
                <Shield size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Counselor / Admin Referrals</h3>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{recentReferrals.length}</span>
              </div>
              {recentReferrals.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No referrals recorded for this student</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-72 overflow-y-auto">
                  {recentReferrals.map((ref: any, idx: number) => {
                    const refType = ref.referral_type ? String(ref.referral_type).replace('manual_', '').toUpperCase() : 'REFERRAL';
                    const isAuto = String(ref.referral_type || '').includes('auto');
                    const teacherName = `${ref.referred_by_first_name || ''} ${ref.referred_by_last_name || ''}`.trim() || 'Teacher';
                    const displayClass = ref.class_name || ref.subject || 'Cross-Class';

                    return (
                      <div key={ref.referral_id || idx} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition flex items-start gap-4">
                        <div className="shrink-0 pt-0.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                            {isAuto ? 'Auto Escalation' : `${refType} Referral`}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{ref.note || 'No notes provided'}</p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span>By {teacherName}</span>
                            <span>•</span>
                            <span>{displayClass}</span>
                            {ref.created_at && (
                              <>
                                <span>•</span>
                                <span>{formatDate(ref.created_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Recommendations (Row 6) */}
            {(reportData.includeAIRecommendations || reportData.include_ai_recommendations) && recommendations.length > 0 && (
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#262a3d]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recommended Next Steps</h3>
                </div>
                <div className="p-5">
                  <ul className="space-y-2">
                    {recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 font-semibold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Teachers Notes (Row 7) */}
            {(reportData.includeTeachersNotes || reportData.include_teachers_notes) && (
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#262a3d]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Teachers Notes</h3>
                </div>
                <div className="p-5">
                  {report?.recent_notes && report.recent_notes.length > 0 ? (
                    <div className="space-y-3">
                      {report.recent_notes.map((note: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-[#1b1e2c] rounded-lg border border-gray-100 dark:border-[#262a3d]">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {note.class_name} • {formatDate(note.signal_date)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            {note.note || note.excerpt || note.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {teachersNotes || 'No notes provided.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
