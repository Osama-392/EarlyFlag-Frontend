'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3, Download, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight,
  FileText, Filter, Sparkles, Users, GraduationCap, School, Calendar, Printer, Loader2,
} from 'lucide-react';
import {
  exportSuperGreenJson, downloadSuperGreenCsv,
  getAdminStudentReports, getAdminTeacherReports, getAdminGradeReports,
  SuperGreenExportPayload,
  StudentReportBlock, TeacherReportBlock, GradeReportBlock,
  SignalCountsByType, ReportCategoryBreakdown,
} from '@/lib/adminDashboardService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AdminTeacherReportModal from './AdminTeacherReportModal';
import CreateReportModal from './CreateReportModal';
import ReportView from './ReportView';
import { generateAdminStudentReport } from '@/lib/adminDashboardService';

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300 dark:text-gray-300',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
  bounced: 'bg-red-100 text-red-700',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

// ─── Reusable Helpers ─────────────────────────────────────────────

function SignalCountBar({ counts }: { counts: SignalCountsByType }) {
  const total = counts.super_green + counts.present + counts.yellow + counts.red + counts.absent;
  if (total === 0) return <span className="text-xs text-gray-400">No signals</span>;
  const pct = (val: number) => (val / total) * 100;
  return (
    <div className="w-24 h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c]" title={`SG:${counts.super_green} P:${counts.present} Y:${counts.yellow} R:${counts.red} A:${counts.absent}`}>
      {counts.super_green > 0 && <div className="bg-emerald-600" style={{ width: `${pct(counts.super_green)}%` }} />}
      {counts.present > 0 && <div className="bg-emerald-400" style={{ width: `${pct(counts.present)}%` }} />}
      {counts.yellow > 0 && <div className="bg-yellow-400" style={{ width: `${pct(counts.yellow)}%` }} />}
      {counts.red > 0 && <div className="bg-red-400" style={{ width: `${pct(counts.red)}%` }} />}
      {counts.absent > 0 && <div className="bg-gray-400" style={{ width: `${pct(counts.absent)}%` }} />}
    </div>
  );
}

function CategoryBreakdownTooltip({ cat }: { cat: ReportCategoryBreakdown }) {
  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 space-y-0.5">
      <div className="flex justify-between gap-3"><span className="text-yellow-600">Yellow Academic</span><span className="font-medium">{cat.yellow_academic}</span></div>
      <div className="flex justify-between gap-3"><span className="text-yellow-600">Yellow Behavioral</span><span className="font-medium">{cat.yellow_behavioral}</span></div>
      <div className="flex justify-between gap-3"><span className="text-red-600">Red Academic</span><span className="font-medium">{cat.red_academic}</span></div>
      <div className="flex justify-between gap-3"><span className="text-red-600">Red Behavioral</span><span className="font-medium">{cat.red_behavioral}</span></div>
    </div>
  );
}

function WeightedScoreBadge({ score }: { score: number }) {
  let color = 'bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300 dark:text-gray-300';
  if (score >= 10) color = 'bg-red-100 text-red-700';
  else if (score >= 6) color = 'bg-orange-100 text-orange-700';
  else if (score >= 3) color = 'bg-yellow-100 text-yellow-700';
  else if (score > 0) color = 'bg-blue-100 text-blue-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{score}</span>;
}

function AvgFlagBadge({ pct }: { pct: number }) {
  let color = 'bg-green-100 text-green-700';
  if (pct >= 0.15) color = 'bg-red-100 text-red-700';
  else if (pct >= 0.10) color = 'bg-orange-100 text-orange-700';
  else if (pct >= 0.05) color = 'bg-yellow-100 text-yellow-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{(pct * 100).toFixed(1)}%</span>;
}

function PaginationControls({
  page, totalPages, total, pageSize, onChange,
}: {
  page: number; totalPages: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c]">
      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-2">
        <button disabled={page === 0} onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"><ChevronLeft size={16} /></button>
        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{page + 1} / {Math.max(totalPages, 1)}</span>
        <button disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function ReportFilterBar({
  range, setRange, from, setFrom, to, setTo, gradeLevel, setGradeLevel, showGrade, onRefresh, loading,
}: {
  range: '1d' | '7d' | '30d'; setRange: (r: '1d' | '7d' | '30d') => void;
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  gradeLevel: string; setGradeLevel: (v: string) => void;
  showGrade: boolean; onRefresh: () => void; loading: boolean;
}) {
  const hasCustomDate = from && to;
  return (
    <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300"><Filter size={14} /> Filters</div>
      <div className="flex flex-wrap items-end gap-4">
        {/* Range */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1.5">Date Range</p>
          <div className="flex rounded-lg border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] overflow-hidden">
            {(['1d', '7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition ${range === r && !hasCustomDate ? 'bg-teal-600 text-white' : 'bg-white dark:bg-[#151722] dark:bg-[#151722] text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c]'}`}>
                {r === '1d' ? 'Today' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
        {/* Custom date */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1.5">Custom Date (overrides range)</p>
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
        </div>
        {/* Grade filter */}
        {showGrade && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1.5">Grade</p>
            <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-[#151722] dark:bg-[#151722]">
              <option value="">All Grades</option>
              {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        )}
        {/* Refresh */}
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3 animate-pulse">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}</div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
      <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{message}</p>
      <button onClick={onRetry} className="mt-3 text-teal-600 text-sm font-medium">Retry</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function PrincipalReportsPage() {
  const [tab, setTab] = useState<'supergreen' | 'student-reports' | 'teacher-reports' | 'grade-reports'>('supergreen');
  const studentTableRef = useRef<HTMLDivElement>(null);
  const [studentExporting, setStudentExporting] = useState(false);



  // Super Green state
  const [sgData, setSgData] = useState<SuperGreenExportPayload | null>(null);
  const [sgLoading, setSgLoading] = useState(false);
  const [sgError, setSgError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Student Reports state
  const [studentData, setStudentData] = useState<StudentReportBlock | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentPage, setStudentPage] = useState(0);
  const [studentRange, setStudentRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [studentFrom, setStudentFrom] = useState('');
  const [studentTo, setStudentTo] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);
  const [generatedStudentReport, setGeneratedStudentReport] = useState<any>(null);
  const REPORT_PAGE_SIZE = 50;

  // Teacher Reports state
  const [teacherData, setTeacherData] = useState<TeacherReportBlock | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{id: string, name: string} | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [teacherPage, setTeacherPage] = useState(0);
  const [teacherRange, setTeacherRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [teacherFrom, setTeacherFrom] = useState('');
  const [teacherTo, setTeacherTo] = useState('');

  // Grade Reports state
  const [gradeData, setGradeData] = useState<GradeReportBlock | null>(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradePage, setGradePage] = useState(0);
  const [gradeRange, setGradeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [gradeFrom, setGradeFrom] = useState('');
  const [gradeTo, setGradeTo] = useState('');
  const [gradeGrade, setGradeGrade] = useState('');

  // ─── Fetchers ──────────────────────────────────────────────────



  const fetchSuperGreen = async () => {
    try {
      setSgLoading(true); setSgError(null);
      const data = await exportSuperGreenJson();
      setSgData(data);
    } catch (err: any) {
      setSgError(err?.response?.data?.detail || 'Failed to load Super Green data.');
    } finally { setSgLoading(false); }
  };

  useEffect(() => { if (tab === 'supergreen' && !sgData) fetchSuperGreen(); }, [tab]);

  const fetchStudentReports = useCallback(async () => {
    try {
      setStudentLoading(true); setStudentError(null);
      const params: any = { limit: REPORT_PAGE_SIZE, offset: studentPage * REPORT_PAGE_SIZE };
      if (studentFrom && studentTo) {
        params.from = studentFrom;
        params.to = studentTo;
      } else if (studentRange === '1d') {
        const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        params.from = todayStr;
        params.to = todayStr;
      } else {
        params.range = studentRange;
      }
      if (studentGrade) params.grade_level = parseInt(studentGrade);
      const data = await getAdminStudentReports(params);
      setStudentData(data);
    } catch (err: any) {
      setStudentError(err?.response?.data?.detail || 'Failed to load student reports.');
    } finally { setStudentLoading(false); }
  }, [studentPage, studentRange, studentFrom, studentTo, studentGrade]);

  useEffect(() => { if (tab === 'student-reports') fetchStudentReports(); }, [fetchStudentReports, tab]);

  const fetchTeacherReports = useCallback(async () => {
    try {
      setTeacherLoading(true); setTeacherError(null);
      const params: any = { limit: REPORT_PAGE_SIZE, offset: teacherPage * REPORT_PAGE_SIZE };
      if (teacherFrom && teacherTo) {
        params.from = teacherFrom;
        params.to = teacherTo;
      } else if (teacherRange === '1d') {
        const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        params.from = todayStr;
        params.to = todayStr;
      } else {
        params.range = teacherRange;
      }
      const data = await getAdminTeacherReports(params);
      setTeacherData(data);
    } catch (err: any) {
      setTeacherError(err?.response?.data?.detail || 'Failed to load teacher reports.');
    } finally { setTeacherLoading(false); }
  }, [teacherPage, teacherRange, teacherFrom, teacherTo]);

  useEffect(() => { if (tab === 'teacher-reports') fetchTeacherReports(); }, [fetchTeacherReports, tab]);

  const fetchGradeReports = useCallback(async () => {
    try {
      setGradeLoading(true); setGradeError(null);
      const params: any = { limit: REPORT_PAGE_SIZE, offset: gradePage * REPORT_PAGE_SIZE };
      if (gradeFrom && gradeTo) {
        params.from = gradeFrom;
        params.to = gradeTo;
      } else if (gradeRange === '1d') {
        const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        params.from = todayStr;
        params.to = todayStr;
      } else {
        params.range = gradeRange;
      }
      if (gradeGrade) params.grade_level = parseInt(gradeGrade);
      const data = await getAdminGradeReports(params);
      setGradeData(data);
    } catch (err: any) {
      setGradeError(err?.response?.data?.detail || 'Failed to load grade reports.');
    } finally { setGradeLoading(false); }
  }, [gradePage, gradeRange, gradeFrom, gradeTo, gradeGrade]);

  useEffect(() => { if (tab === 'grade-reports') fetchGradeReports(); }, [fetchGradeReports, tab]);

  const handleDownloadCsv = async () => {
    try { setDownloading(true); await downloadSuperGreenCsv(); }
    catch (err) { console.error('CSV download failed:', err); }
    finally { setDownloading(false); }
  };


  const totalStudentPages = studentData ? Math.ceil(studentData.total / REPORT_PAGE_SIZE) : 0;
  const totalTeacherPages = teacherData ? Math.ceil(teacherData.total / REPORT_PAGE_SIZE) : 0;
  const totalGradePages = gradeData ? Math.ceil(gradeData.total / REPORT_PAGE_SIZE) : 0;

  const handleStudentPrint = () => {
    window.print();
  };

  const handleStudentExportPDF = async () => {
    if (!studentTableRef.current) return;
    setStudentExporting(true);
    try {
      const canvas = await html2canvas(studentTableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
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

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`Student_Reports_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setStudentExporting(false);
    }
  };

  const handleCreateStudentReport = (student: any) => {
    setSelectedStudentForReport(student);
    setIsStudentReportModalOpen(true);
  };

  const handleGenerateStudentReport = (reportData: any) => {
    setGeneratedStudentReport({
      student: selectedStudentForReport,
      reportData: reportData,
    });
    setIsStudentReportModalOpen(false);
  };

  if (generatedStudentReport) {
    return (
      <ReportView
        student={{
          id: generatedStudentReport.student.student_id,
          name: `${generatedStudentReport.student.first_name} ${generatedStudentReport.student.last_name}`,
          gradeLevel: parseInt(generatedStudentReport.student.grade_level) || 9,
          initial: `${generatedStudentReport.student.first_name.charAt(0)}${generatedStudentReport.student.last_name.charAt(0)}`.toUpperCase(),
          bgColor: 'from-blue-400 to-blue-600'
        }}
        reportData={generatedStudentReport.reportData}
        onBack={() => {
          setGeneratedStudentReport(null);
          setSelectedStudentForReport(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .principal-report-print-area, .principal-report-print-area * { visibility: visible; }
          .principal-report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontFamily: 'Playfair Display' }}>Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Recognition exports and admin analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] overflow-x-auto">
        {[
          { id: 'supergreen' as const, label: 'Super Green Export', icon: Sparkles },
          { id: 'student-reports' as const, label: 'Student Report', icon: Users },
          { id: 'teacher-reports' as const, label: 'Teacher Report', icon: GraduationCap },
          { id: 'grade-reports' as const, label: 'Grade Report', icon: School },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>



      {/* ── Super Green Tab ────────────────────────────────────── */}
      {tab === 'supergreen' && (
        <div className="space-y-4">
          {sgLoading ? (
            <LoadingSkeleton rows={3} />
          ) : sgError ? (
            <ErrorState message={sgError} onRetry={fetchSuperGreen} />
          ) : sgData && (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white dark:text-white text-lg flex items-center gap-2"><Sparkles size={20} className="text-emerald-600" /> Super Green Recognition</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">{sgData.academic_year_label} · Threshold: {sgData.threshold}+ signals · {sgData.row_count} qualifying students</p>
                  </div>
                  <button onClick={handleDownloadCsv} disabled={downloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50">
                    <Download size={16} />{downloading ? 'Downloading...' : 'Download CSV'}
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Top Reasons</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Last Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sgData.students.map(s => (
                        <tr key={s.student_id} className="border-b border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{s.student_id_external}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{s.grade_level}</td>
                          <td className="px-4 py-3"><span className="text-lg font-bold text-emerald-600">{s.super_green_count}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {s.top_reasons.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">{r.replace(/_/g, ' ')}</span>
                              ))}
                              {s.top_reasons.length === 0 && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{formatDate(s.last_super_green_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {s.iep_status && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-bold">IEP</span>}
                              {s.ell_status && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-bold">ELL</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sgData.students.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No qualifying students this year</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Student Reports Tab ────────────────────────────────── */}
      {tab === 'student-reports' && (
        <div className="space-y-4">
          <ReportFilterBar
            range={studentRange} setRange={setStudentRange}
            from={studentFrom} setFrom={setStudentFrom}
            to={studentTo} setTo={setStudentTo}
            gradeLevel={studentGrade} setGradeLevel={setStudentGrade}
            showGrade={true} onRefresh={fetchStudentReports} loading={studentLoading}
          />
          {/* Export Buttons */}
          {!studentLoading && !studentError && (studentData?.students || []).length > 0 && (
            <div className="flex items-center gap-3 no-print">
              <button
                onClick={handleStudentPrint}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Printer size={16} />
                Print Report
              </button>
              <button
                onClick={handleStudentExportPDF}
                disabled={studentExporting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                {studentExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {studentExporting ? 'Exporting...' : 'Export as PDF'}
              </button>
            </div>
          )}
          {studentLoading ? (
            <LoadingSkeleton rows={5} />
          ) : studentError ? (
            <ErrorState message={studentError} onRetry={fetchStudentReports} />
          ) : (
            <div ref={studentTableRef} className="principal-report-print-area bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Signals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Categories</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Alerts</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Referrals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Last Flag</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Classes</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentData?.students || []).map(s => (
                      <tr key={s.student_id} className="border-b border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{s.external_student_id} · Grade {s.grade_level}</p>
                          <div className="flex gap-1 mt-1">
                            {s.iep_status && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">IEP</span>}
                            {s.ell_status && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">ELL</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><SignalCountBar counts={s.signal_counts} /></td>
                        <td className="px-4 py-3">
                          <div className="group relative inline-block">
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 cursor-help underline decoration-dotted">
                              Y:{s.category_breakdown.yellow_academic + s.category_breakdown.yellow_behavioral} R:{s.category_breakdown.red_academic + s.category_breakdown.red_behavioral}
                            </span>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg shadow-lg p-3 w-44">
                              <CategoryBreakdownTooltip cat={s.category_breakdown} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><WeightedScoreBadge score={s.weighted_score} /></td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{s.unresolved_alert_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{s.open_referral_count}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{formatDate(s.last_flag_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{s.enrolled_class_count}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCreateStudentReport(s)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Create Report"
                          >
                            <FileText size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(studentData?.students || []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No students found for selected filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalStudentPages > 1 && (
                <PaginationControls page={studentPage} totalPages={totalStudentPages} total={studentData?.total || 0} pageSize={REPORT_PAGE_SIZE} onChange={setStudentPage} />
              )}
            </div>
          )}
          {selectedStudentForReport && (
            <CreateReportModal
              isOpen={isStudentReportModalOpen}
              student={{
                id: selectedStudentForReport.student_id,
                name: `${selectedStudentForReport.first_name} ${selectedStudentForReport.last_name}`,
                status: 'neutral',
                initial: `${selectedStudentForReport.first_name.charAt(0)}${selectedStudentForReport.last_name.charAt(0)}`.toUpperCase(),
                bgColor: 'from-blue-400 to-blue-600',
                redCount: selectedStudentForReport.signal_counts?.red,
                yellowCount: selectedStudentForReport.signal_counts?.yellow,
              }}
              defaultSubject="Student Overview"
              gradeSubjects={[]}
              onClose={() => {
                setIsStudentReportModalOpen(false);
                setSelectedStudentForReport(null);
              }}
              onGenerate={handleGenerateStudentReport}
              customGenerateFunction={generateAdminStudentReport}
            />
          )}
        </div>
      )}

      {/* ── Teacher Reports Tab ────────────────────────────────── */}
      {tab === 'teacher-reports' && (
        <div className="space-y-4">
          <ReportFilterBar
            range={teacherRange} setRange={setTeacherRange}
            from={teacherFrom} setFrom={setTeacherFrom}
            to={teacherTo} setTo={setTeacherTo}
            gradeLevel="" setGradeLevel={() => {}}
            showGrade={false} onRefresh={fetchTeacherReports} loading={teacherLoading}
          />
          {teacherLoading ? (
            <LoadingSkeleton rows={5} />
          ) : teacherError ? (
            <ErrorState message={teacherError} onRetry={fetchTeacherReports} />
          ) : (
            <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Teacher</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Workload</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Signals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Categories</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Alerts</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Referrals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Obs. Flags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Last Signal</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(teacherData?.teachers || []).map(t => (
                      <tr key={t.teacher_id} className="border-b border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{t.first_name} {t.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{t.class_count} classes · {t.total_enrollments} students</td>
                        <td className="px-4 py-3"><SignalCountBar counts={t.signal_counts} /></td>
                        <td className="px-4 py-3">
                          <div className="group relative inline-block">
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 cursor-help underline decoration-dotted">
                              Y:{t.category_breakdown.yellow_academic + t.category_breakdown.yellow_behavioral} R:{t.category_breakdown.red_academic + t.category_breakdown.red_behavioral}
                            </span>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg shadow-lg p-3 w-44">
                              <CategoryBreakdownTooltip cat={t.category_breakdown} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{t.unresolved_alert_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{t.open_referral_count}</td>
                        <td className="px-4 py-3">
                          {t.pending_observation_flag_count > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700" title="Class triggered 30% yellow threshold">
                              {t.pending_observation_flag_count}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{formatDate(t.most_recent_signal_date)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedTeacher({ id: t.teacher_id, name: `${t.first_name} ${t.last_name}` });
                              setReportModalOpen(true);
                            }}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Generate Report"
                          >
                            <FileText size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(teacherData?.teachers || []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No teachers found for selected filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalTeacherPages > 1 && (
                <PaginationControls page={teacherPage} totalPages={totalTeacherPages} total={teacherData?.total || 0} pageSize={REPORT_PAGE_SIZE} onChange={setTeacherPage} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Grade Reports Tab ──────────────────────────────────── */}
      {tab === 'grade-reports' && (
        <div className="space-y-4">
          <ReportFilterBar
            range={gradeRange} setRange={setGradeRange}
            from={gradeFrom} setFrom={setGradeFrom}
            to={gradeTo} setTo={setGradeTo}
            gradeLevel={gradeGrade} setGradeLevel={setGradeGrade}
            showGrade={true} onRefresh={fetchGradeReports} loading={gradeLoading}
          />
          {gradeLoading ? (
            <LoadingSkeleton rows={5} />
          ) : gradeError ? (
            <ErrorState message={gradeError} onRetry={fetchGradeReports} />
          ) : (
            <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Population</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Signals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Categories</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Alerts</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Referrals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Obs. Flags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase">Avg Flag %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gradeData?.grades || []).map(g => (
                      <tr key={g.grade_level} className="border-b border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white dark:text-white">Grade {g.grade_level}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{g.student_count} students · {g.class_count} classes · {g.teacher_count} teachers</td>
                        <td className="px-4 py-3"><SignalCountBar counts={g.signal_counts} /></td>
                        <td className="px-4 py-3">
                          <div className="group relative inline-block">
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 cursor-help underline decoration-dotted">
                              Y:{g.category_breakdown.yellow_academic + g.category_breakdown.yellow_behavioral} R:{g.category_breakdown.red_academic + g.category_breakdown.red_behavioral}
                            </span>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-lg shadow-lg p-3 w-44">
                              <CategoryBreakdownTooltip cat={g.category_breakdown} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{g.unresolved_alert_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">{g.open_referral_count}</td>
                        <td className="px-4 py-3">
                          {g.pending_observation_flag_count > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                              {g.pending_observation_flag_count}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><AvgFlagBadge pct={g.avg_flag_percentage} /></td>
                      </tr>
                    ))}
                    {(gradeData?.grades || []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No grades found for selected filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalGradePages > 1 && (
                <PaginationControls page={gradePage} totalPages={totalGradePages} total={gradeData?.total || 0} pageSize={REPORT_PAGE_SIZE} onChange={setGradePage} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTeacher && (
        <AdminTeacherReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setSelectedTeacher(null);
          }}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
        />
      )}
    </div>
  );
}
