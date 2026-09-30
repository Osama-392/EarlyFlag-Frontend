'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, AlertCircle, Shield, BookOpen, Clock,
  FileText, ChevronRight, RefreshCw, Activity, Calendar, UserMinus, Mail
} from 'lucide-react';
import {
  getAdminStudentProfile,
  AdminStudentProfileBlock,
  SignalCountsByType,
  deactivateStudentAdmin,
  generateAdminStudentReport,
} from '@/lib/adminDashboardService';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ReportView from '@/components/ReportView';
import AdminClassSnapshot from '@/components/AdminClassSnapshot';
import AdminProfileDateFilter from '@/components/AdminProfileDateFilter';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/app/providers';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
import { logger } from '@/lib/logger';
import { AdminStudentProfileSkeleton } from '@/components/AdminLoadingSkeletons';
import { formatTeacherDisplayName } from '@/lib/teacherTitle';

const priorityStyles: Record<string, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  low: 'bg-gray-100 dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300',
};

function formatDate(d: string) {
  try { return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function CountsCard({ label, counts }: { label: string; counts: SignalCountsByType }) {
  return (
    <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        <div><p className="text-lg font-bold text-emerald-600">{counts.super_green}</p><p className="text-gray-500 dark:text-gray-400">Super Green</p></div>
        <div><p className="text-lg font-bold text-green-600">{counts.present}</p><p className="text-gray-500 dark:text-gray-400">Present</p></div>
        <div><p className="text-lg font-bold text-yellow-600">{counts.yellow}</p><p className="text-gray-500 dark:text-gray-400">Yellow</p></div>
        <div><p className="text-lg font-bold text-red-600">{counts.red}</p><p className="text-gray-500 dark:text-gray-400">Red</p></div>
        <div><p className="text-lg font-bold text-gray-600 dark:text-gray-400">{counts.absent}</p><p className="text-gray-500 dark:text-gray-400">Absent</p></div>
      </div>
    </div>
  );
}

export default function AdminStudentProfile({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSource = searchParams ? searchParams.get('from') : null;
  const [profile, setProfile] = useState<AdminStudentProfileBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const profileRequest = useRef(0);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const reportPending = useRef(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const adminFullName = user ? formatTeacherDisplayName(user) || 'Admin' : 'Admin';

  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    student: any;
    category: 'super_green' | 'red' | 'yellow' | 'absent' | 'admin_concern' | 'admin_commendation';
    adminEmailConcerns?: string;
  } | null>(null);

  useEffect(() => {
    const request = ++profileRequest.current;
    setRangeLoading(false);
    setRangeError(null);
    setReportLoading(false);
    setReportError(null);
    (async () => {
      try {
        setLoading(true); setError(null);
        const data = await getAdminStudentProfile(studentId);
        if (request === profileRequest.current) setProfile(data);
      } catch (err: any) {
        if (request === profileRequest.current) setError(err?.response?.data?.detail || 'Failed to load student profile.');
      } finally { if (request === profileRequest.current) setLoading(false); }
    })();
    return () => { profileRequest.current += 1; };
  }, [studentId]);

  async function applyRange(start: string, end: string) {
    const request = ++profileRequest.current;
    setRangeLoading(true);
    setRangeError(null);
    try {
      const data = await getAdminStudentProfile(studentId, { start_date: start, end_date: end });
      if (request === profileRequest.current) setProfile(data);
    } catch (err: any) {
      if (request === profileRequest.current) setRangeError('Unable to update the profile. The previous range is still shown. Please retry.');
    } finally {
      if (request === profileRequest.current) setRangeLoading(false);
    }
  }

  if (loading) {
    return <AdminStudentProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Unable to load profile</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">Go Back</button>
      </div>
    );
  }

  const handleDeactivateStudent = async () => {
    try {
      await deactivateStudentAdmin(studentId);
      showToast('Student deactivated successfully.', 'success');
      router.back();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to deactivate student.', 'error');
    }
  };

  const { student } = profile;

  if (generatedReport) {
    const studentName = `${student.first_name} ${student.last_name}`.trim();
    return (
      <ReportView
        student={{
          id: student.student_id,
          name: studentName,
          gradeLevel: Number(student.grade_level) || 0,
          initial: `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase(),
          bgColor: 'from-blue-400 to-blue-600',
        }}
        reportData={generatedReport}
        variant="admin"
        onBack={() => setGeneratedReport(null)}
        backLabel="Back to Student Profile"
      />
    );
  }

  const counts = profile.counts_selected_range ?? profile.counts_30d;
  const category = profile.category_selected_range ?? profile.category_7d;
  const rangeStart = profile.range_start ?? profile.class_snapshot?.range_start;
  const rangeEnd = profile.range_end ?? profile.class_snapshot?.range_end;
  const rangeLabel = rangeStart && rangeEnd ? `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}` : 'Selected period';
  const crossClassRed = category?.red_cross_class ?? 0;

  async function createReport() {
    if (reportPending.current || rangeLoading || !rangeStart || !rangeEnd) return;
    reportPending.current = true;
    setReportLoading(true);
    setReportError(null);
    const request = profileRequest.current;
    const options = {
      start_date: rangeStart, end_date: rangeEnd, subject: 'All Subjects',
      include_teachers_notes: true, include_ai_recommendations: false, include_template: true,
    };
    try {
      const result = await generateAdminStudentReport(studentId, options);
      if (request === profileRequest.current) setGeneratedReport({ ...options, result });
    } catch {
      if (request === profileRequest.current) setReportError('Unable to create the report. Please try again.');
    } finally {
      reportPending.current = false;
      if (request === profileRequest.current) setReportLoading(false);
    }
  }


  return (
    <div className="space-y-6">

      {/* Back + Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else if (fromSource === 'heatmap') {
                router.push('/principal-dashboard');
              } else {
                router.push('/principal-students');
              }
            }}
            className="mt-1 flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-[#1b1e2c] dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#262a3d] rounded-lg transition-colors border border-transparent dark:border-[#262a3d]"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight capitalize">
              {student.first_name} {student.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Grade {student.grade_level}</span>
              {student.iep_status && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1"><Shield size={10} />IEP</span>}
              {student.ell_status && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1"><BookOpen size={10} />ELL</span>}
              {student.parent_email_on_file && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">📧 Parent email</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 pt-1 md:pt-0">
          {profile.class_snapshot && <AdminProfileDateFilter
            key={`${studentId}:${rangeStart}:${rangeEnd}`}
            snapshot={profile.class_snapshot}
            busy={rangeLoading || reportLoading}
            onApply={(start, end) => void applyRange(start, end)}
          />}
          <button
            disabled={rangeLoading || reportLoading || !rangeStart || !rangeEnd}
            onClick={() => {
              logger.buttonClick(`Create Report for ${student.first_name} ${student.last_name}`, 'AdminStudentProfile');
              void createReport();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#1b1e2c] hover:bg-gray-100 dark:hover:bg-[#262a3d] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors border border-gray-200 dark:border-[#262a3d]"
          >
            {reportLoading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
            {reportLoading ? 'Creating Report...' : 'Create Report'}
          </button>
          {(counts.red > 0 || counts.super_green >= 5) && (
            <button
              disabled={rangeLoading}
              onClick={() => {
                const category = counts.red > 0 ? 'admin_concern' : (counts.super_green >= 5 ? 'admin_commendation' : (counts.yellow > 0 ? 'yellow' : 'super_green'));
                const adminEmailConcerns = profile?.flag_log
                  ?.filter((f: any) => f.signal_type === 'red' || f.signal_type === 'yellow')
                  ?.map((f: any) => `- ${f.class_name || 'Class'}: ${f.rule_description || f.description || f.note || 'Concern logged'}`)
                  ?.join('\n');

                setEmailModalData({
                  isOpen: true,
                  student,
                  category,
                  adminEmailConcerns
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-900/50"
            >
              <Mail size={16} />
              Email Parent
            </button>
          )}
          <button
            onClick={() => setIsDeactivateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors border border-red-200 dark:border-red-900/50"
          >
            <UserMinus size={16} />
            Deactivate Student
          </button>
        </div>
      </div>

      {reportError && <p role="alert" className="text-sm text-red-600">{reportError}</p>}
      {rangeError && <p role="alert" className="text-sm text-red-600">{rangeError}</p>}
      {rangeLoading && <p role="status" className="text-sm text-gray-500">Updating all profile sections...</p>}
      <div aria-busy={rangeLoading || reportLoading} className={rangeLoading ? 'pointer-events-none opacity-50 space-y-6' : 'space-y-6'}>
      <CountsCard label={`Selected Period (${rangeLabel})`} counts={counts} />

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-2 gap-3 text-center text-sm md:grid-cols-4">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">{category?.yellow_academic ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Academic</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">{category?.yellow_behavioral ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Behavioral</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-2xl font-bold text-red-600">{category?.red_academic ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Academic</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-2xl font-bold text-red-600">{category?.red_behavioral ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Behavioral</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 md:col-span-2 md:col-start-2">
            <p className="text-2xl font-bold text-red-600">{crossClassRed}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Cross-Class</p>
          </div>
        </div>
        {counts.absent > 0 && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} className="inline mr-1" />Absences in selected period: <span className="font-bold text-gray-900 dark:text-white">{counts.absent}</span>
          </p>
        )}
      </div>


      <AdminClassSnapshot
        key={`${studentId}:${rangeStart}:${rangeEnd}`}
        disabled={rangeLoading || reportLoading}
        studentId={studentId}
        snapshot={profile.class_snapshot}
        onReport={setGeneratedReport}
      />

      {/* Student History */}
      {(
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
            <Activity size={16} className="text-teal-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Student History</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-96 overflow-y-auto">
            {!profile.flag_log?.length && <p className="p-4 text-sm text-gray-500">No student history in this period.</p>}
            {profile.flag_log?.map((flag: any, i: number) => {
              let rawDate = new Date(flag.signal_date + 'T00:00:00');
              let shortDate = flag.signal_date;
              let dayOfWeek = '';
              try {
                shortDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dayOfWeek = rawDate.toLocaleDateString('en-US', { weekday: 'short' });
              } catch (e) { }

              const sType = flag.signal_type ? flag.signal_type.toUpperCase() : '';
              const typeLabel = flag.signal_type ? flag.signal_type.charAt(0).toUpperCase() + flag.signal_type.slice(1).toLowerCase() : '';

              let catLabel = '';
              if (flag.category) {
                if (flag.category.toLowerCase() === 'super_green') catLabel = 'Super Green';
                else catLabel = flag.category.charAt(0).toUpperCase() + flag.category.slice(1).toLowerCase();
              }
              const displayType = catLabel && sType !== 'SUPER_GREEN' ? `${typeLabel} - ${catLabel}` : (sType === 'SUPER_GREEN' ? 'Super Green' : typeLabel);

              return (
                <div key={i} className="grid grid-cols-1 gap-2 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1b1e2c] lg:grid-cols-[5rem_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_10rem] lg:items-center lg:gap-4">
                  <div className="flex flex-col whitespace-nowrap text-left">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{shortDate}</span>
                    <span className="text-xs font-bold text-gray-400">{dayOfWeek}</span>
                  </div>

                  <h3 className="min-w-0 break-words text-sm font-bold leading-tight text-slate-800 dark:text-white">
                    {flag.title || 'Flag Logged'}
                  </h3>

                  <p className="min-w-0 break-words text-[13px] leading-snug text-gray-500 dark:text-gray-400">
                    {flag.description && flag.description.toLowerCase() !== (flag.title || '').toLowerCase() ? flag.description : '—'}
                  </p>

                  <span className="min-w-0 break-words text-xs font-bold text-slate-500 dark:text-slate-400">
                    {[flag.class_name, flag.teacher_name].filter(Boolean).join(' • ') || '—'}
                  </span>

                  <div className="shrink-0 lg:justify-self-end">
                    <div className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${sType === 'RED'
                        ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                        : sType === 'YELLOW'
                          ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
                          : sType === 'ABSENT' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sType === 'RED' ? 'bg-red-500' : sType === 'YELLOW' ? 'bg-amber-500' : sType === 'ABSENT' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                      {displayType}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>

      <ConfirmDeleteModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivateStudent}
        title="Deactivate Student"
        description={`Are you sure you want to deactivate ${student.first_name} ${student.last_name}? This will perform a global soft delete, making the student inactive across the entire school.`}
        confirmText="Deactivate"
        requireConfirmationText={`${student.first_name} ${student.last_name}`}
      />

      {emailModalData && (
        <ParentEmailTemplateModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          studentName={`${emailModalData.student.first_name} ${emailModalData.student.last_name}`}
          teacherName={adminFullName}
          flagCategory={emailModalData.category}
          recentFlags={profile?.flag_log}
          studentId={emailModalData.student.student_id || emailModalData.student.id}
          adminEmailConcerns={emailModalData.adminEmailConcerns}
        />
      )}
    </div>
  );
}
