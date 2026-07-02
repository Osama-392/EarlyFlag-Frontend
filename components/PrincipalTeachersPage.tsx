"use client";

import { Users, Search, Clock, CheckCircle2, XCircle, UserCheck, UserX, RefreshCw, Mail, Calendar, Shield, AlertCircle, Eye, Flag } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getPendingTeachers, approveTeacher, rejectTeacher, PendingTeacher } from '@/lib/adminService';
import { getAdminTeacherFlags, acknowledgeTeacherFlag, TeacherObservationFlagRow, getAdminTeacherReports, TeacherReportItem } from '@/lib/adminDashboardService';
import AdminTeacherReportModal from './AdminTeacherReportModal';
import { FileText } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export default function PrincipalTeachersPage() {
  const [tab, setTab] = useState<'observation' | 'pending' | 'approved'>('observation');
  const [searchTerm, setSearchTerm] = useState('');
  const [pending, setPending] = useState<PendingTeacher[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherReportItem[]>([]);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; teacher: PendingTeacher } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{id: string, name: string} | null>(null);

  // Teacher Observation Flags state
  const [obsFlags, setObsFlags] = useState<TeacherObservationFlagRow[]>([]);
  const [obsFlagsLoading, setObsFlagsLoading] = useState(true);
  const [obsFlagStatus, setObsFlagStatus] = useState<'open' | 'all'>('open');
  const [ackLoading, setAckLoading] = useState<string | null>(null);

  // Stats derived from pending/approved list
  const approvedCount = approvedTeachers.length;
  const pendingCount = pending.length;

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadPending = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoadingPending(true);

      const data = await getPendingTeachers();
      setPending(data || []);
    } catch (err) {
      console.error('Failed to load pending teachers', err);
      showToast('Failed to load pending teachers. Please try again.', 'error');
    } finally {
      setLoadingPending(false);
      setRefreshing(false);
    }
  }, []);

  const loadApproved = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoadingApproved(true);

      const data = await getAdminTeacherReports({ range: '30d' });
      setApprovedTeachers(data.teachers || []);
    } catch (err) {
      console.error('Failed to load approved teachers', err);
      showToast('Failed to load approved teachers. Please try again.', 'error');
    } finally {
      setLoadingApproved(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
    loadApproved();
  }, [loadPending, loadApproved]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab === 'pending' || urlTab === 'approved' || urlTab === 'observation') {
        setTab(urlTab as any);
      }
      const q = params.get('q');
      if (q) {
        setSearchTerm(q);
        if (!urlTab) setTab('approved');
      }
    }
  }, []);

  const loadObsFlags = useCallback(async () => {
    try {
      setObsFlagsLoading(true);
      const data = await getAdminTeacherFlags(obsFlagStatus);
      setObsFlags(data.flags || []);
    } catch (err) {
      console.error('Failed to load teacher flags', err);
    } finally {
      setObsFlagsLoading(false);
    }
  }, [obsFlagStatus]);

  useEffect(() => { loadObsFlags(); }, [loadObsFlags]);

  const handleAcknowledge = async (flagId: string) => {
    try {
      setAckLoading(flagId);
      await acknowledgeTeacherFlag(flagId);
      setObsFlags(f => f.filter(fl => fl.flag_id !== flagId));
      showToast('Flag acknowledged successfully', 'success');
    } catch (err) {
      console.error('Acknowledge failed', err);
      showToast('Failed to acknowledge flag', 'error');
    } finally {
      setAckLoading(null);
    }
  };

  const handleApprove = async (teacher: PendingTeacher) => {
    try {
      setActionLoading(teacher.id);
      setConfirmAction(null);
      await approveTeacher(teacher.id);
      setPending((p) => p.filter((t) => t.id !== teacher.id));
      showToast(`${teacher.first_name} ${teacher.last_name} has been approved!`, 'success');
      loadApproved();
    } catch (err) {
      console.error('Approve failed', err);
      showToast(`Failed to approve ${teacher.first_name} ${teacher.last_name}. Please try again.`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (teacher: PendingTeacher) => {
    try {
      setActionLoading(teacher.id);
      setConfirmAction(null);
      await rejectTeacher(teacher.id);
      setPending((p) => p.filter((t) => t.id !== teacher.id));
      showToast(`${teacher.first_name} ${teacher.last_name} has been rejected.`, 'success');
    } catch (err) {
      console.error('Reject failed', err);
      showToast(`Failed to reject ${teacher.first_name} ${teacher.last_name}. Please try again.`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPending = pending.filter((t) => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || t.email.toLowerCase().includes(term);
  });

  const filteredApproved = approvedTeachers.filter((t) => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || t.email.toLowerCase().includes(term);
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100px); }
        }

        @keyframes pulse-border {
          0%, 100% { border-color: rgba(59, 130, 246, 0.3); }
          50% { border-color: rgba(59, 130, 246, 0.6); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .teacher-card {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .teacher-card:nth-child(1) { animation-delay: 0.05s; }
        .teacher-card:nth-child(2) { animation-delay: 0.1s; }
        .teacher-card:nth-child(3) { animation-delay: 0.15s; }
        .teacher-card:nth-child(4) { animation-delay: 0.2s; }
        .teacher-card:nth-child(5) { animation-delay: 0.25s; }
        .teacher-card:nth-child(6) { animation-delay: 0.3s; }
        .teacher-card:nth-child(7) { animation-delay: 0.35s; }
        .teacher-card:nth-child(8) { animation-delay: 0.4s; }

        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        .toast-enter {
          animation: slideInRight 0.3s ease-out forwards;
        }

        .toast-exit {
          animation: slideOutRight 0.3s ease-in forwards;
        }

        .confirm-overlay {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .confirm-modal {
          animation: slideInUp 0.3s ease-out forwards;
        }

        .refresh-spin {
          animation: spin 1s linear infinite;
        }

        .pending-pulse {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3" style={{ pointerEvents: 'none' }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-sm"
            style={{
              pointerEvents: 'auto',
              background: toast.type === 'success'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
              borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              minWidth: '300px',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="text-white flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-white flex-shrink-0" />
            )}
            <span className="text-white text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="confirm-overlay fixed inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="confirm-modal bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
              confirmAction.type === 'approve' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {confirmAction.type === 'approve' ? (
                <UserCheck size={28} className="text-emerald-600" />
              ) : (
                <UserX size={28} className="text-red-600" />
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white text-center mb-2" style={{ fontFamily: 'Sora' }}>
              {confirmAction.type === 'approve' ? 'Approve Teacher?' : 'Reject Teacher?'}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-center text-sm mb-2">
              {confirmAction.type === 'approve'
                ? 'This will grant full access to the EarlyFlag platform for:'
                : 'This will deny access to the EarlyFlag platform for:'}
            </p>

            <div className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-xl p-4 mb-6 border border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
              <p className="font-semibold text-gray-900 dark:text-white dark:text-white text-center">
                {confirmAction.teacher.first_name} {confirmAction.teacher.last_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center">{confirmAction.teacher.email}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#151722] dark:bg-[#151722] border-2 border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'approve') {
                    handleApprove(confirmAction.teacher);
                  } else {
                    handleReject(confirmAction.teacher);
                  }
                }}
                className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-semibold transition-all ${
                  confirmAction.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                    : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                }`}
              >
                {confirmAction.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontFamily: 'Playfair Display' }}>
              Teachers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mt-1">Monitor observation flags and manage teacher approvals</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border-2 border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow pending-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock size={18} className="text-amber-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Pending Approval</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-2">
            {pendingCount === 0 ? 'All clear!' : pendingCount === 1 ? 'Needs your review' : 'Need your review'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-emerald-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTab('approved')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Approved</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-2">Active teachers in platform</p>
        </div>
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Flag size={18} className="text-red-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Observation Flags</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{obsFlags.filter(f => !f.is_acknowledged).length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-2">Unacknowledged class alerts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
        {[
          { id: 'observation' as const, label: 'Teacher Observation', icon: Flag },
          { id: 'pending' as const, label: 'Pending Teacher Approval', icon: Clock },
          { id: 'approved' as const, label: 'Approved Teachers', icon: CheckCircle2 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:text-gray-300'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Teacher Observation Tab ──────────────────────────── */}
      {tab === 'observation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Class-level threshold flags (Rule 5: ≥30% yellow)</p>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg p-1">
                {(['open', 'all'] as const).map(s => (
                  <button key={s} onClick={() => setObsFlagStatus(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${obsFlagStatus === s ? 'bg-white dark:bg-[#151722] dark:bg-[#151722] text-teal-700 shadow-sm' : 'text-gray-600 dark:text-gray-400 dark:text-gray-400'}`}>
                    {s === 'open' ? 'Open' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {obsFlagsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : obsFlags.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 font-medium">No {obsFlagStatus === 'open' ? 'open' : ''} observation flags</p>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mt-1">All class thresholds are healthy</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {obsFlags.map(flag => (
                <div key={flag.flag_id} className={`bg-white dark:bg-[#151722] dark:bg-[#151722] border-2 ${flag.is_acknowledged ? 'border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]' : 'border-amber-200'} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${!flag.is_acknowledged ? 'hover:-translate-y-1' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">{flag.class_name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-0.5">Grade {flag.grade_level}</p>
                    </div>
                    {flag.is_acknowledged ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Ack'd</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse">Open</span>
                    )}
                  </div>
                  <div className="mb-3 pb-3 border-b border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 dark:text-gray-200">{flag.teacher_first_name} {flag.teacher_last_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs mb-3">
                    <span className="text-yellow-700 font-semibold">🟡 {flag.yellow_count} yellow</span>
                    <span className="text-red-700 font-semibold">🔴 {flag.red_count} red</span>
                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{Math.round(flag.threshold_percentage * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(flag.triggered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {!flag.is_acknowledged && (
                      <button onClick={() => handleAcknowledge(flag.flag_id)} disabled={ackLoading === flag.flag_id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                        {ackLoading === flag.flag_id ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                        Acknowledge
                      </button>
                    )}
                    {flag.is_acknowledged && flag.acknowledged_by_first_name && (
                      <span className="text-xs text-gray-400">by {flag.acknowledged_by_first_name} {flag.acknowledged_by_last_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pending Teacher Approval Tab ─────────────────────── */}
      {tab === 'pending' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Search Pending Teachers</label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="teacher-search-input"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
            </div>
            <button
              id="refresh-teachers-btn"
              onClick={() => loadPending(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white dark:hover:text-white dark:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'refresh-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Loading State */}
          {loadingPending && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="skeleton w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-3/4 mb-2" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-3 w-full mb-3" />
                  <div className="skeleton h-3 w-2/3 mb-5" />
                  <div className="flex gap-3">
                    <div className="skeleton h-10 flex-1" />
                    <div className="skeleton h-10 flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Teacher Cards */}
          {!loadingPending && filteredPending.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPending.map((teacher) => (
                <div
                  key={teacher.id}
                  className="teacher-card bg-white dark:bg-[#151722] dark:bg-[#151722] border-2 border-amber-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 group"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                      >
                        {getInitials(teacher.first_name, teacher.last_name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">{teacher.first_name} {teacher.last_name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold mt-1">
                          <Clock size={10} />
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Rows */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300 truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300">Signed up {formatDate(teacher.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
                    <button
                      id={`approve-teacher-${teacher.id}`}
                      onClick={() => setConfirmAction({ type: 'approve', teacher })}
                      disabled={actionLoading === teacher.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === teacher.id ? (
                        <RefreshCw size={14} className="refresh-spin" />
                      ) : (
                        <UserCheck size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      id={`reject-teacher-${teacher.id}`}
                      onClick={() => setConfirmAction({ type: 'reject', teacher })}
                      disabled={actionLoading === teacher.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#151722] dark:bg-[#151722] border-2 border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserX size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - No pending teachers */}
          {!loadingPending && pending.length === 0 && (
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2" style={{ fontFamily: 'Sora' }}>All Caught Up!</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                There are no pending teacher approval requests right now. New teachers who sign up will appear here for your review.
              </p>
              <button
                onClick={() => loadPending(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition"
              >
                <RefreshCw size={16} className={refreshing ? 'refresh-spin' : ''} />
                Check Again
              </button>
            </div>
          )}

          {/* Empty State - Search returned no results */}
          {!loadingPending && pending.length > 0 && filteredPending.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 font-medium">No matching teachers found</p>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mt-1">Try a different search term</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Approved Teachers Tab ─────────────────────────────── */}
      {tab === 'approved' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Search Approved Teachers</label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="approved-teacher-search-input"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
            </div>
            <button
              id="refresh-approved-teachers-btn"
              onClick={() => loadApproved(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white dark:hover:text-white dark:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'refresh-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Loading State */}
          {loadingApproved && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="skeleton w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-3/4 mb-2" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-3 w-full mb-3" />
                  <div className="skeleton h-3 w-2/3 mb-5" />
                </div>
              ))}
            </div>
          )}

          {/* Approved Teacher Cards */}
          {!loadingApproved && filteredApproved.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApproved.map((teacher) => (
                <div
                  key={teacher.teacher_id}
                  className="teacher-card bg-white dark:bg-[#151722] dark:bg-[#151722] border border-emerald-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        {getInitials(teacher.first_name, teacher.last_name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">{teacher.first_name} {teacher.last_name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mt-1">
                          <CheckCircle2 size={10} />
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Rows */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300 truncate">{teacher.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg text-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 block uppercase font-bold tracking-wider">Classes</span>
                        <span className="text-base font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200">{teacher.class_count}</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg text-center">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 block uppercase font-bold tracking-wider">Students</span>
                        <span className="text-base font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200">{teacher.total_enrollments}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity and alerts indicators */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                    <span>
                      {teacher.most_recent_signal_date
                        ? `Active ${formatDate(teacher.most_recent_signal_date)}`
                        : 'No activity logged'}
                    </span>
                    {(teacher.pending_observation_flag_count || 0) > 0 && (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <Flag size={12} /> {teacher.pending_observation_flag_count} alerts
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTeacher({ id: teacher.teacher_id, name: `${teacher.first_name} ${teacher.last_name}` });
                      setReportModalOpen(true);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <FileText size={16} />
                    Generate Report
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - No approved teachers */}
          {!loadingApproved && approvedTeachers.length === 0 && (
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-full flex items-center justify-center mb-6">
                <Users size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-2" style={{ fontFamily: 'Sora' }}>No Approved Teachers</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                There are no approved teachers registered in your school yet. Pending approval requests in the "Pending" tab can be reviewed to approve them.
              </p>
            </div>
          )}

          {/* Empty State - Search returned no results */}
          {!loadingApproved && approvedTeachers.length > 0 && filteredApproved.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 font-medium">No matching approved teachers found</p>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mt-1">Try a different search term</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition"
              >
                Clear search
              </button>
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
