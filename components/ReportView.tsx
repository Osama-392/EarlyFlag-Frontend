'use client';

import { useRef, useState } from 'react';
import { 
  Download, ArrowLeft, Loader2, AlertCircle, AlertTriangle, 
  CheckCircle, Mail, Shield, BookOpen, Clock, Activity, FileText
} from 'lucide-react';
import { logger } from '@/lib/logger';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
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

export default function ReportView({
  student,
  reportData,
  variant,
  onBack,
}: ReportViewProps) {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { user } = useAuth();
  const teacherOrAdminName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Staff' : 'Staff';

  // Determine active variant (default based on user role if not specified)
  const isTeacherView = variant === 'teacher' || (!variant && user?.role !== 'principal' && user?.role !== 'admin');

  const report = reportData?.result?.report || reportData?.result;
  const rawFlagLog = report?.flag_log || report?.signals || [];

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

  // Recent 7 days flags
  const recent7Days = rawFlagLog.filter((s: any) => parseSignalDate(s) >= d7);
  const redFlags7d = recent7Days.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'red');
  const yellowFlags7d = recent7Days.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'yellow');
  const greenFlags7d = recent7Days.filter(isSuperGreenOrGeneral);

  const redCount = report?.counts_7d?.red ?? redFlags7d.length;
  const yellowCount = report?.counts_7d?.yellow ?? yellowFlags7d.length;
  const greenCount = (report?.counts_7d?.super_green || report?.counts_7d?.green) ?? greenFlags7d.length;

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

  const counts7d = report?.counts_7d || fallbackCounts(d7);
  const counts30d = report?.counts_30d || fallbackCounts(d30);
  const countsSemester = report?.counts_semester || fallbackCounts(new Date(today.getFullYear(), today.getMonth() > 6 ? 7 : 0, 1));
  const cat7d = report?.category_7d || report?.category_breakdown || fallbackCat7();
  const semesterStart = report?.semester_start || `${today.getFullYear()}-08-01`;
  const semesterEnd = report?.semester_end || `${today.getFullYear()}-12-31`;
  const semesterAbsentCount = report?.semester_absent_count ?? countsSemester.absent;

  const unresolvedAlerts = report?.unresolved_alerts || [];
  const recentReferrals = report?.recent_referrals || [];
  const recommendations = report?.talking_points || [];

  const teacherEmailCategory = statusText === 'Red' ? ('red' as const)
    : statusText === 'Yellow' ? ('yellow' as const)
    : statusText === 'Super Green' ? ('super_green' as const)
    : null;

  const adminEmailCategory = counts7d.red > 0 ? ('admin_concern' as const) 
    : (counts7d.super_green >= 5 ? ('admin_commendation' as const) 
    : (counts7d.yellow > 0 ? ('yellow' as const) : ('super_green' as const)));

  const activeEmailCategory = isTeacherView ? (teacherEmailCategory || 'red') : adminEmailCategory;

  // Notes
  const notes = report?.recent_notes && report.recent_notes.length > 0 
    ? report.recent_notes 
    : rawFlagLog.filter((s: any) => s.note && String(s.note).trim() !== '');

  const teachersNotes = report?.one_ask_for_parents;

  const handleExportPDF = async () => {
    if (!reportContentRef.current) return;
    logger.buttonClick('Export as PDF', 'ReportView');
    setExporting(true);
    try {
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
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={isTeacherView ? "max-w-6xl mx-auto space-y-6 pb-12" : "space-y-6 max-w-[1600px] mx-auto pb-12"}>
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
            Back to Reports
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

            {teacherEmailCategory && teacherEmailCategory !== 'super_green' && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className={`inline-flex items-center space-x-2 px-5 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm text-white ${
                  teacherEmailCategory === 'red' ? 'bg-red-600 hover:bg-red-700'
                  : teacherEmailCategory === 'yellow' ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title="Email Parent"
              >
                <Mail className="w-4 h-4" />
                <span>Email Parent</span>
              </button>
            )}
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
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-900/50 shadow-sm"
            >
              <Mail size={16} />
              <span>Email Parent</span>
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
            {/* Profile Header Card */}
            <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-8 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1b1e2c] flex items-center justify-center border-4 border-white dark:border-[#262a3d] shadow-md text-3xl font-bold text-slate-400 dark:text-slate-300 overflow-hidden">
                  {student.initial || (student.name ? student.name.charAt(0).toUpperCase() : '??')}
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    {statusText === 'Red' && <span className="px-2.5 py-0.5 bg-red-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Red</span>}
                    {statusText === 'Yellow' && <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Yellow</span>}
                    {statusText === 'Super Green' && <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Super Green</span>}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">
                    {student.name}
                  </h1>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 mt-1">
                    {student.gradeLevel ? `${student.gradeLevel}th Grade` : 'Grade 6'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  statusText === 'Red' ? 'bg-red-50 text-red-500 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
                  : statusText === 'Yellow' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50'
                  : statusText === 'Super Green' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
                }`}>
                  Status : {statusText} Active
                </span>
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Incidents Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Last 7-Day</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Incidents Summary</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Red Incidents */}
                  <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-100 dark:border-red-900/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="w-8 h-8 rounded-full border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-4xl font-extrabold text-red-500">{redCount}</p>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Red Incidents (7 Days)</h3>
                    <p className="text-xs text-red-500/80 mt-1">Urgent interventions</p>
                  </div>

                  {/* Yellow Incidents */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-900/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="w-8 h-8 rounded-full border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-4xl font-extrabold text-amber-500">{yellowCount}</p>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Yellow Incidents (7 Days)</h3>
                    <p className="text-xs text-amber-500/80 mt-1">Moderate concerns</p>
                  </div>

                  {/* Super Green */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-500">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-4xl font-extrabold text-emerald-500">{greenCount}</p>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Super Green (7 Days)</h3>
                    <p className="text-xs text-emerald-500/80 mt-1">Positive recognitions</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Student History */}
              <div className="lg:col-span-7 space-y-4">
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

            {/* Teachers Notes */}
            {(reportData.includeTeachersNotes !== false && reportData.include_teachers_notes !== false) && (
              <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Teachers Notes</h2>
                </div>
                
                <div className="p-6">
                  {notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((signal: any, idx: number) => {
                        const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
                        const dateString = dateToUse ? new Date(dateToUse + (String(dateToUse).includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                        return (
                          <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-[#262a3d] bg-slate-50/50 dark:bg-[#1b1e2c]/30 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-400">{dateString}</p>
                              {signal.class_name && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{signal.class_name}</span>}
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{signal.note || signal.excerpt || signal.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : teachersNotes ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{teachersNotes}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No notes recorded for this student.</p>
                  )}
                </div>
              </div>
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

      {/* Parent Email Modal */}
      {isEmailModalOpen && (
        <ParentEmailTemplateModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          studentName={student.name}
          teacherName={teacherOrAdminName}
          flagCategory={activeEmailCategory}
          studentId={student.id}
          adminEmailReason={report?.admin_email_reason}
          adminEmailConcerns={report?.admin_email_concerns}
        />
      )}
    </div>
  );
}
