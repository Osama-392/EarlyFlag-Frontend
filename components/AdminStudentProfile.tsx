'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, AlertCircle, AlertTriangle, Shield, BookOpen, Clock,
  FileText, ChevronRight, RefreshCw, Activity, Calendar, UserMinus, Mail
} from 'lucide-react';
import { getAdminStudentProfile, AdminStudentProfileBlock, SignalCountsByType, deactivateStudentAdmin } from '@/lib/adminDashboardService';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/app/providers';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
};

const priorityStyles: Record<string, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  low: 'bg-gray-100 dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300',
};

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
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
  const [profile, setProfile] = useState<AdminStudentProfileBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const adminFullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin' : 'Admin';
  
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    student: any;
    category: 'super_green' | 'red' | 'yellow' | 'absent' | 'admin_concern' | 'admin_commendation';
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const data = await getAdminStudentProfile(studentId);
        setProfile(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load student profile.');
      } finally { setLoading(false); }
    })();
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}</div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
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
  const maxDayCount = Math.max(1, ...profile.timeline_30d.map(d => d.counts.yellow + d.counts.red + d.counts.absent));

  return (
    <div className="space-y-6">

      {/* Back + Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => router.back()} 
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
      <div className="flex items-center gap-2 pt-1 md:pt-0">
        <button
            onClick={() => setEmailModalData({
              isOpen: true,
              student,
              category: (profile.counts_30d.red + profile.counts_30d.yellow) > 0 ? 'admin_concern' : 'admin_commendation'
            })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-900/50"
          >
            <Mail size={16} />
            Email Parent
          </button>
          <button
            onClick={() => setIsDeactivateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors border border-red-200 dark:border-red-900/50"
          >
            <UserMinus size={16} />
            Deactivate Student
          </button>
        </div>
      </div>

      {/* Signal Count Windows */}
      <div className="grid md:grid-cols-3 gap-4">
        <CountsCard label="Last 7 Days" counts={profile.counts_7d} />
        <CountsCard label="Last 30 Days" counts={profile.counts_30d} />
        <CountsCard label={`Semester (${formatDate(profile.semester_start)} — ${formatDate(profile.semester_end)})`} counts={profile.counts_semester} />
      </div>

      {/* Category Breakdown 7d */}
      <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">7-Day Category Breakdown</h3>
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">{profile.category_7d.yellow_academic}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Academic</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">{profile.category_7d.yellow_behavioral}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Yellow Behavioral</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-2xl font-bold text-red-600">{profile.category_7d.red_academic}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Academic</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-2xl font-bold text-red-600">{profile.category_7d.red_behavioral}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Red Behavioral</p>
          </div>
        </div>
        {profile.semester_absent_count > 0 && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} className="inline mr-1" />Semester absences: <span className="font-bold text-gray-900 dark:text-white">{profile.semester_absent_count}</span>
          </p>
        )}
      </div>


      {/* Flag History */}
      {profile.flag_log && profile.flag_log.length > 0 && (
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
            <Activity size={16} className="text-teal-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Flag History</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-96 overflow-y-auto">
            {profile.flag_log.map((flag: any, i: number) => {
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
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sType === 'RED' ? 'bg-red-500' : sType === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {displayType}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-column: Alerts + Referrals */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unresolved Alerts */}
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Unresolved Alerts</h3>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{profile.unresolved_alerts.length}</span>
          </div>
          {profile.unresolved_alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No unresolved alerts</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {profile.unresolved_alerts.map(alert => (
                <div key={alert.alert_id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityStyles[alert.severity] || 'bg-gray-100 dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300'}`}>{alert.severity}</span>
                    <span className="text-xs text-gray-400">{formatDate(alert.triggered_at)}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{alert.rule_description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.class_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Referrals */}
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{profile.recent_referrals.length}</span>
          </div>
          {profile.recent_referrals.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No recent referrals</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {profile.recent_referrals.map(ref => (
                <div key={ref.referral_id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityStyles[ref.priority] || 'bg-gray-100 dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300'}`}>{ref.priority}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ref.referral_type}</span>
                    <span className="ml-auto text-xs text-gray-400">{formatDate(ref.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">By {ref.referred_by_first_name} {ref.referred_by_last_name} · Status: {ref.email_status}</p>
                  {ref.follow_up_needed && <p className="text-xs text-orange-600 mt-1">⚡ Follow-up needed{ref.follow_up_date ? ` by ${formatDate(ref.follow_up_date)}` : ''}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
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
        />
      )}
    </div>
  );
}
