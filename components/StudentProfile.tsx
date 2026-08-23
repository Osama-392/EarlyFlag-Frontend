'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Mail, MessageSquare, Edit, AlertCircle, CheckCircle, 
  AlertTriangle, Download, Loader2 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getStudentHistory, updateStudentProfile } from '@/lib/studentService';
import { getCategoryStyle } from '@/lib/categoryColors';
import EditStudentProfileModal from '@/components/EditStudentProfileModal';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
import SendAdminModal from '@/components/SendAdminModal';
import { useAuth } from '@/app/providers';
import { logger } from '@/lib/logger';

interface StudentProfileProps {
  studentId?: string;
  classId?: string;
  onBack?: () => void;
}

export default function StudentProfile({ studentId: propStudentId, classId: propClassId, onBack }: StudentProfileProps = {}) {
  const params = useParams();
  const pathname = usePathname();
  const studentId = (propStudentId || params?.studentId || params?.studentSlug) as string;
  const classId = (propClassId || params?.classId || params?.classSlug) as string;
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCategoryState, setEmailCategoryState] = useState<'red' | 'yellow' | 'super_green' | 'absent' | null>(null);
  const [isSendAdminModalOpen, setIsSendAdminModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const profileContentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch student history which contains signal data
      const historyData = await getStudentHistory(studentId);
      setHistory(historyData);
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to load student data';
      setError(message);
      console.error('Error loading student:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </button>
        ) : (
          <Link 
            href={pathname.startsWith('/reports') ? '/reports' : `/classes/${classId}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {pathname.startsWith('/reports') ? 'Back to Reports' : 'Back to Roster'}
          </Link>
        )}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate stats from history data
  const rawSignals = history?.signals || [];
  const rawReferrals = history?.referrals || [];
  
  const mappedReferrals = rawReferrals.map((r: any) => {
    let sType = 'referral';
    if (r.referral_type === 'manual_green') sType = 'super_green';
    else if (r.referral_type === 'manual_yellow') sType = 'yellow';
    else if (r.referral_type === 'manual_admin') sType = 'red';

    return {
      id: r.id,
      created_at: r.created_at,
      signal_type: sType,
      category: 'Referral',
      reason_description: r.note || (r.referral_type === 'manual_admin' ? 'Sent to Admin' : 'Sent to Counselor'),
      note: r.note,
      class_name: 'Admin',
    };
  });

  const SEVERITY_ORDER: Record<string, number> = {
    red: 0,
    yellow: 1,
    super_green: 2,
    green: 2,
    absent: 3,
    present: 4,
  };

  const signals = [...rawSignals, ...mappedReferrals].sort((a, b) => {
    const parseDateOnly = (item: any) => {
      const d = item.signal_date || item.created_at;
      if (!d) return 0;
      return new Date(d.includes('T') ? d.split('T')[0] + 'T00:00:00Z' : d + 'T00:00:00Z').getTime();
    };

    const dateA = parseDateOnly(a);
    const dateB = parseDateOnly(b);
    if (dateB !== dateA) return dateB - dateA;

    const sevA = SEVERITY_ORDER[String(a.signal_type || '').toLowerCase()] ?? 99;
    const sevB = SEVERITY_ORDER[String(b.signal_type || '').toLowerCase()] ?? 99;
    if (sevA !== sevB) return sevA - sevB;

    const timeA = new Date(a.created_at || a.signal_date || 0).getTime();
    const timeB = new Date(b.created_at || b.signal_date || 0).getTime();
    return timeB - timeA;
  });
 
  const isSuperGreenOrGeneral = (s: any): boolean => {
    if (!s) return false;
    const st = String(s.signal_type || '').toLowerCase();
    const cat = String(s.category || '').toLowerCase();
    if (st === 'red' || st === 'yellow' || st === 'absent') return false;
    return st === 'green' || st === 'super_green' || cat === 'super_green' || cat === 'general';
  };

  // Determine overall status (most severe recent signal, or neutral)
  let statusText = 'Normal';
  const hasSuperGreen = signals.some(isSuperGreenOrGeneral);
  const hasRed = signals.some((s: any) => String(s.signal_type || '').toLowerCase() === 'red');
  const hasYellow = signals.some((s: any) => String(s.signal_type || '').toLowerCase() === 'yellow');
  if (hasRed) statusText = 'Red';
  else if (hasYellow) statusText = 'Yellow';
  else if (hasSuperGreen) statusText = 'Super Green';

  const emailCategory = statusText === 'Red' ? 'red' as const
  : statusText === 'Yellow' ? 'yellow' as const
  : statusText === 'Super Green' ? 'super_green' as const
  : null;

  // Calculate absences per class to ensure they aren't cumulative across different classes
  const classAbsenceCounts = signals.reduce((acc: Record<string, number>, s: any) => {
    if (s.signal_type === 'absent') {
      if (classId) {
        if (s.class_id === classId || s.class_slug === classId) {
          acc['current'] = (acc['current'] || 0) + 1;
        }
      } else if (user && s.teacher_id === user.id) {
        acc[s.class_id] = (acc[s.class_id] || 0) + 1;
      }
    }
    return acc;
  }, {});

  const maxAbsencesInSingleClass = classId 
    ? (classAbsenceCounts['current'] || 0)
    : Math.max(0, ...(Object.values(classAbsenceCounts) as number[]));

  const meetsAbsenceThreshold = maxAbsencesInSingleClass >= 3;

  const teacherFullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
  const studentFullName = [history?.first_name, history?.last_name].filter(Boolean).join(' ') || 'Student';

  // Helper to parse signal date without time-of-day cutoff
  const parseSignalDate = (s: any): Date => {
    const raw = s.signal_date || s.created_at;
    if (!raw) return new Date(0);
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59);
    }
    return new Date(raw);
  };

  // Last 30 days (inclusive)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const recentSignals = signals.filter((s: any) => parseSignalDate(s) >= thirtyDaysAgo);

  // Last 7 days (inclusive)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const recent7Days = signals.filter((s: any) => parseSignalDate(s) >= sevenDaysAgo);

  const redFlags = recent7Days.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'red');
  const yellowFlags = recent7Days.filter((s: any) => String(s.signal_type || '').toLowerCase() === 'yellow');
  const greenFlags = recent7Days.filter(isSuperGreenOrGeneral);

  const totalSummaryFlags = redFlags.length + yellowFlags.length + greenFlags.length || 1;
  const redPercent = Math.round((redFlags.length / totalSummaryFlags) * 100);
  const yellowPercent = Math.round((yellowFlags.length / totalSummaryFlags) * 100);
  const greenPercent = Math.round((greenFlags.length / totalSummaryFlags) * 100);

  // Notes
  const notes = signals.filter((s: any) => s.note && s.note.trim() !== '');

  const handleExportPDF = async () => {
    if (!profileContentRef.current) return;
    logger.buttonClick('Export as PDF', 'StudentProfile');
    setExporting(true);
    try {
      const canvas = await html2canvas(profileContentRef.current, {
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

      const safeName = studentFullName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeName}_Report.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={profileContentRef} className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar: Back Button and Actions */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-blue-500 bg-white dark:bg-[#151722] border border-blue-100 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </button>
        ) : (
          <Link
            href={pathname.startsWith('/reports') ? '/reports' : `/classes/${classId}`}
            className="inline-flex items-center text-sm text-blue-500 bg-white dark:bg-[#151722] border border-blue-100 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {pathname.startsWith('/reports') ? 'Back to Reports' : 'Back to Students Roster'}
          </Link>
        )}
        
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

          <button
            onClick={() => setIsSendAdminModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold shadow-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Send to Admin</span>
          </button>

          {emailCategory && emailCategory !== 'super_green' && (
            <button
              onClick={() => {
                setEmailCategoryState(emailCategory);
                setIsEmailModalOpen(true);
              }}
              className={`inline-flex items-center space-x-2 px-5 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm text-white ${
                emailCategory === 'red' ? 'bg-red-600 hover:bg-red-700'
                : emailCategory === 'yellow' ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title="Email Parent (Performance)"
            >
              <Mail className="w-4 h-4" />
              <span>Email Parent</span>
            </button>
          )}

          {meetsAbsenceThreshold && (
            <button
              onClick={() => {
                setEmailCategoryState('absent');
                setIsEmailModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
              title="Email Parent (Absence)"
            >
              <Mail className="w-4 h-4" />
              <span>Absence Notice</span>
            </button>
          )}

          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262a3d] transition-colors text-sm font-bold shadow-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1b1e2c] flex items-center justify-center border-4 border-white dark:border-[#262a3d] shadow-md text-3xl font-bold text-slate-400 dark:text-slate-300 overflow-hidden">
            {history?.first_name ? `${history.first_name[0]}${history.last_name[0]}` : '??'}
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              {statusText === 'Red' && <span className="px-2.5 py-0.5 bg-red-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Red</span>}
              {statusText === 'Yellow' && <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Yellow</span>}
              {statusText === 'Super Green' && <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Super Green</span>}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white ">
              {history?.first_name} {history?.last_name}
            </h1>
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 mt-1">
              {history?.grade_level ? `${history.grade_level}th Grade` : 'Unknown Grade'}
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
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
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
              <p className="text-4xl font-extrabold text-red-500">{redFlags.length}</p>
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
              <p className="text-4xl font-extrabold text-amber-500">{yellowFlags.length}</p>
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
              <p className="text-4xl font-extrabold text-emerald-500">{greenFlags.length}</p>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Super Green (7 Days)</h3>
              <p className="text-xs text-emerald-500/80 mt-1">Positive recognitions</p>
            </div>
          </div>
        </div>

        {/* Right Column: Student History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Student History</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Last 30 days</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 h-[460px] overflow-y-auto">
            {recentSignals.length > 0 ? (
              <div className="space-y-5">
                {recentSignals.map((signal: any, idx: number) => {
                  const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
                  const dateString = new Date(dateToUse + (dateToUse.includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  let lineColor = 'bg-gray-400';
                  let pillClass = 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
                  
                  if (signal.signal_type === 'red') {
                    lineColor = 'bg-red-400';
                    pillClass = 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
                  } else if (signal.signal_type === 'yellow') {
                    lineColor = 'bg-amber-400';
                    pillClass = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
                  } else if (signal.signal_type === 'green' || signal.signal_type === 'super_green' || signal.signal_type === 'present') {
                    lineColor = 'bg-emerald-400';
                    pillClass = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
                  } else if (signal.signal_type === 'absent') {
                    lineColor = 'bg-blue-400';
                    pillClass = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
                  }

                  return (
                    <div key={idx} className="flex items-center space-x-3 group">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 shrink-0">{dateString}</span>
                      
                      {/* Status Line */}
                      <div className={`w-2.5 h-1 rounded-full ${lineColor} shrink-0`}></div>
                      
                      {/* Fixed width category pill for perfect vertical alignment */}
                      <div className={`w-24 shrink-0 text-center py-1.5 rounded-lg text-xs font-bold ${pillClass} border truncate`}>
                        {signal.signal_type === 'present' ? 'Present' : signal.signal_type === 'absent' ? 'Absent' : (signal.category || 'General')}
                      </div>
                      
                      {/* Content box with min-w-0 for proper truncate */}
                      <div className="flex-1 min-w-0 px-3.5 py-1.5 bg-gray-50 dark:bg-[#1b1e2c] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-[#262a3d] flex justify-between items-center gap-2">
                        <span className="truncate flex-1">
                          {signal.signal_type === 'present' ? '' : (signal.reason_description || signal.note || 'No reason provided')}
                        </span>
                        {signal.class_name && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium shrink-0 bg-white dark:bg-[#262a3d] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {signal.class_name.startsWith('Manual Referral') ? signal.class_name : `Class ${signal.class_name}`}
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
                <p className="text-sm font-medium">No flags in the last 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Notes */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Teachers Notes</h2>
        </div>
        
        <div className="p-6">
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((signal: any, idx: number) => {
                const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
                const dateString = new Date(dateToUse + (dateToUse.includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-[#262a3d] bg-slate-50/50 dark:bg-[#1b1e2c]/30 space-y-1">
                    <p className="text-xs font-semibold text-slate-400">{dateString}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{signal.note}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes recorded for this student.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditStudentProfileModal
        isOpen={isEditModalOpen}
        student={{
          firstName: history?.first_name || "Unknown",
          lastName: history?.last_name || "",
          grade: history?.grade_level || 9,
          studentId: history?.student_id || studentId,
          gender: history?.gender || "",
          dateOfBirth: history?.date_of_birth || "",
        }}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (updatedData) => {
          try {
            await updateStudentProfile(history?.student_id || studentId, {
              first_name: updatedData.firstName,
              last_name: updatedData.lastName,
              grade_level: updatedData.grade,
              gender: updatedData.gender,
              date_of_birth: updatedData.dateOfBirth,
            });
            await loadStudent();
            setIsEditModalOpen(false);
          } catch (err) {
            console.error("Failed to update profile", err);
          }
        }}
      />

      <ParentEmailTemplateModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailCategoryState(null);
        }}
        studentId={history?.student_id || studentId}
        flagCategory={emailCategoryState || emailCategory || 'red'}
        studentName={studentFullName}
        teacherName={teacherFullName}
        classId={classId}
      />

      <SendAdminModal
        isOpen={isSendAdminModalOpen}
        onClose={() => setIsSendAdminModalOpen(false)}
        studentId={history?.student_id || studentId}
        studentName={studentFullName}
        onSubmitSuccess={loadStudent}
      />
    </div>
  );
}
