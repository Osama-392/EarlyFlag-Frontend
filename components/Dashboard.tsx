'use client';

import { Mail, RefreshCw, AlertCircle, MessageSquare, CheckCircle2, Clock, User, Star, ClipboardList, ChevronRight } from 'lucide-react';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import EmailCounselorModal from '@/components/EmailCounselorModal';
import ParentNotifyModal from '@/components/ParentNotifyModal';
import GoodMorningBanner from '@/components/GoodMorningBanner';
import {
  getTeacherDashboard,
  TeacherDashboardResponse,
  RedUrgentRow,
  UnfinishedLogRow,
  getUnfinishedAlerts,
  dismissUnfinishedAlert
} from '@/lib/dashboardService';

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function Dashboard() {
  const { loading: authLoading } = useProtectedRoute();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [emailModalStudent, setEmailModalStudent] = useState<RedUrgentRow | null>(null);
  const [notifyModalStudent, setNotifyModalStudent] = useState<RedUrgentRow | null>(null);
  const [unfinishedAlerts, setUnfinishedAlerts] = useState<UnfinishedLogRow[]>([]);
  const { user } = useAuth();

  const loadDashboard = useCallback(async (refreshMode: boolean | 'silent' = false) => {
    try {
      if (refreshMode === true) setRefreshing(true);
      else if (!refreshMode) setLoading(true);
      // If 'silent', we don't set any loading state to keep the UI uninterrupted
      setError(null);

      const [data, alerts] = await Promise.all([
        getTeacherDashboard(),
        getUnfinishedAlerts()
      ]);
      setDashboardData(data);
      setUnfinishedAlerts(alerts);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadDashboard();
    }
  }, [authLoading, loadDashboard]);

  // Listen for refresh events triggered by QuickLog submission
  useEffect(() => {
    const handleRefresh = () => {
      loadDashboard('silent');
    };

    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
    };
  }, [loadDashboard]);

  const handleDismissAlert = async (sessionId: string) => {
    try {
      await dismissUnfinishedAlert(sessionId);
      setUnfinishedAlerts(prev => prev.filter(a => a.session_id !== sessionId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  // ── End-of-Day QuickLog Reminder Logic ─────────────────────────────
  const { isEndOfDay, unloggedClasses, currentHour } = useMemo(() => {
    if (!dashboardData) return { isEndOfDay: false, unloggedClasses: [], currentHour: 0 };

    const tz = dashboardData.school_timezone || 'America/New_York';
    let hour = new Date().getHours(); // fallback to local time
    try {
      const timeStr = new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
      hour = parseInt(timeStr, 10);
    } catch { /* fallback to local */ }

    const unlogged = dashboardData.classes.filter(c => !c.logged_today);
    // Show reminder after 2 PM school time, only if there are unlogged classes
    return {
      isEndOfDay: hour >= 14 && unlogged.length > 0,
      unloggedClasses: unlogged,
      currentHour: hour,
    };
  }, [dashboardData]);

  const handleQuickLogForClass = (classId: string) => {
    // Dispatch custom event to Header → opens QuickLogModal with this class pre-selected
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-quicklog-for-class', { detail: classId }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skeleton {
            background: linear-gradient(90deg, var(--skel-color-1) 25%, var(--skel-color-2) 50%, var(--skel-color-1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
          }
          :root {
            --skel-color-1: #f0f0f0;
            --skel-color-2: #e0e0e0;
          }
          .dark {
            --skel-color-1: #1f2937;
            --skel-color-2: #374151;
          }
        `}</style>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1d27] p-6">
              <div className="skeleton h-4 w-2/3 mb-3" />
              <div className="skeleton h-10 w-1/3 mb-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
        <p className="text-gray-500 text-sm mb-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => loadDashboard()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const {
    kpis,
    yellow_watch_list,
    red_urgent,
    super_green_highlights,
    classes,
    recommendations
  } = dashboardData;

  const statCards = [
    {
      label: 'Yellow Flags This Week',
      value: kpis.yellow_total,
      icon: '⚠️',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      textColor: 'text-amber-700 dark:text-amber-500',
    },
    {
      label: 'Red Flags This Week',
      value: kpis.red_total,
      icon: '🚨',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      textColor: 'text-red-700 dark:text-red-500',
    },
    {
      label: 'Super Greens This Week',
      value: kpis.super_green_total,
      icon: '⭐',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      textColor: 'text-green-700 dark:text-green-500',
    },
    {
      label: 'Absences This Week',
      value: kpis.absent_total || 0,
      icon: '📅',
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      textColor: 'text-slate-700 dark:text-slate-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      
      {refreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg text-sm">
          <RefreshCw size={14} className="animate-spin" /> Refreshing...
        </div>
      )}

      <GoodMorningBanner 
        name={user?.first_name || 'Teacher'}
        metric1={<>You have <span className="text-orange-600 dark:text-orange-500 font-bold">{dashboardData?.yellow_watch_list?.length || 0}</span> students on your watch list</>}
        metric2={<><span className="text-emerald-600 dark:text-emerald-500 font-bold">{dashboardData?.super_green_highlights?.length || 0}</span> students showing exceptional growth</>}
        metric3={<><span className="text-orange-600 dark:text-orange-500 font-bold">{dashboardData?.classes?.filter((c: any) => !c.logged_today).length || 0}</span> classes that still need logging today</>}
        recommendation={dashboardData?.recommendations?.[0]}
      />

      {/* ── End-of-Day QuickLog Reminder ── */}
      {isEndOfDay && (
        <div className="relative overflow-hidden rounded-xl shadow-lg">
          <style>{`
            @keyframes eod-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
            @keyframes eod-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .eod-pulse-icon {
              animation: eod-pulse 2s ease-in-out infinite;
            }
            .eod-card:hover .eod-shimmer {
              animation: eod-shimmer 0.6s ease-out;
            }
          `}</style>
          <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-purple-700 p-6">
            <div className="absolute right-4 top-4 opacity-10">
              <Clock size={120} />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="eod-pulse-icon flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm">
                <Clock size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora' }}>
                  End-of-Day Reminder
                </h2>
                <p className="text-orange-100 text-sm">
                  {unloggedClasses.length} class{unloggedClasses.length !== 1 ? 'es' : ''} still need logging today — tap to complete
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {unloggedClasses.map(c => (
                <button
                  key={c.class_id}
                  onClick={() => handleQuickLogForClass(c.class_id)}
                  className="eod-card group relative bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md border border-white/10 overflow-hidden"
                >
                  <div className="eod-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{c.class_name}</p>
                      <p className="text-orange-100 text-xs mt-0.5">
                        {c.student_count_active} student{c.student_count_active !== 1 ? 's' : ''} • Not logged
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 group-hover:bg-white/30 rounded-lg transition-colors">
                      <span className="text-white text-xs font-semibold">Log Now</span>
                      <span className="text-white text-sm">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 12-Hour Unfinished Alerts */}
      {unfinishedAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-xl p-4 shadow-sm mb-6 flex items-start gap-4 transition-colors">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-800 dark:text-amber-500 font-bold text-lg mb-1">Unfinished Quick Logs (12+ hours)</h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
              You started logging signals for the following classes but did not submit them. Would you like to resume?
            </p>
            <div className="flex flex-wrap gap-2">
              {unfinishedAlerts.map(log => (
                <div key={log.session_id} className="bg-white dark:bg-[#1a1d27] border border-amber-200 dark:border-amber-900/30 px-3 py-2 rounded-lg flex items-center gap-3">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 block text-sm">{log.class_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Started {log.elapsed_hours}h ago &bull; {log.student_count} student{log.student_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(log.session_id)}
                    className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                    title="Dismiss alert"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${stat.bgColor} rounded-xl border border-gray-100 dark:border-transparent p-6 shadow-sm transition-colors`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2" style={{ fontFamily: 'Sora' }}>{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Yellow Watch List */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-xl border border-gray-200 dark:border-[#2e3240] overflow-hidden shadow-sm transition-colors">
            <div className="p-5 border-b border-gray-100 dark:border-[#2e3240] flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2" style={{ fontFamily: 'Sora' }}>
                <span>🟡</span><span>Yellow Watch List</span>
              </h3>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">{yellow_watch_list.length}</span>
            </div>
            {yellow_watch_list.length > 0 ? (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 dark:bg-[#151722]/50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Student</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Grade</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Acd / Beh</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Total</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yellow_watch_list.map((row) => (
                      <tr key={row.student_id} className="border-b border-gray-100 dark:border-[#2e3240] hover:bg-gray-50 dark:hover:bg-[#202330] transition">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{row.first_name} {row.last_name}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">Gr {row.grade_level}</td>
                        <td className="px-5 py-3">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">{row.yellow_academic_count}</span>
                          <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">{row.yellow_behavioral_count}</span>
                        </td>
                        <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-500">{row.yellow_total}</td>
                        <td className="px-5 py-3">
                          {row.unresolved_alert_max_severity ? (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded font-medium">{row.unresolved_alert_max_severity.toUpperCase()}</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded font-medium">WATCH</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No students on the yellow watch list right now.</div>
            )}
          </div>

          {/* Class Logging Status */}
          <div className={`bg-white dark:bg-[#1a1d27] rounded-xl border ${isEndOfDay ? 'border-orange-200 dark:border-orange-900/50' : 'border-gray-200 dark:border-[#2e3240]'} overflow-hidden shadow-sm transition-colors`}>
            <div className={`p-5 border-b ${isEndOfDay ? 'border-orange-100 dark:border-orange-900/30' : 'border-gray-100 dark:border-[#2e3240]'} flex items-center justify-between`}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Sora' }}>Today's Class Logging Status</h3>
              {isEndOfDay && (
                <span className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={12} />
                  {unloggedClasses.length} remaining
                </span>
              )}
            </div>
            {classes.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-[#2e3240] max-h-[300px] overflow-y-auto">
                {[...classes]
                  .sort((a, b) => {
                    // Float unlogged classes to the top
                    if (!a.logged_today && b.logged_today) return -1;
                    if (a.logged_today && !b.logged_today) return 1;
                    return 0;
                  })
                  .map(c => (
                  <div
                    key={c.class_id}
                    onClick={!c.logged_today ? () => handleQuickLogForClass(c.class_id) : undefined}
                    className={`p-4 flex items-center justify-between transition-colors ${
                      !c.logged_today
                        ? `cursor-pointer ${isEndOfDay ? 'bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'hover:bg-blue-50 dark:hover:bg-[#202330]'}`
                        : 'hover:bg-gray-50 dark:hover:bg-[#202330]'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${!c.logged_today && isEndOfDay ? 'text-orange-900 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>{c.class_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{c.student_count_active} active students</p>
                    </div>
                    {c.logged_today ? (
                      <div className="flex items-center text-green-600 dark:text-green-500 text-sm font-semibold gap-1"><CheckCircle2 size={16}/> Logged</div>
                    ) : (
                      <div className={`flex items-center text-sm font-medium gap-1 ${isEndOfDay ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <AlertCircle size={16}/>
                        <span>{isEndOfDay ? 'Log Now →' : 'Not Logged'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No classes assigned.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Red Urgent */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden transition-colors">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 border-b border-red-100 dark:border-red-900/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-400" style={{ fontFamily: 'Sora' }}>🔴 Red Urgent</h3>
              <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded-full">{red_urgent.length}</span>
            </div>
            <div className="p-5">
              {red_urgent.length > 0 ? (
                <div className="space-y-4">
                  {red_urgent.map((item) => (
                    <div key={item.alert_id} className="bg-white dark:bg-[#151722] rounded-lg p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{item.student.first_name} {item.student.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Gr {item.student.grade_level}</p>
                        </div>
                        <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded uppercase tracking-wider">{item.severity}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 bg-red-50 dark:bg-red-900/10 p-2 rounded border dark:border-red-900/20">{item.rule_description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setEmailModalStudent(item)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-gray-50 dark:bg-[#202330] hover:bg-gray-100 dark:hover:bg-[#2a2d3d] text-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition border border-gray-200 dark:border-[#2e3240]"><Mail size={12}/> Counselor</button>
                        <button onClick={() => setNotifyModalStudent(item)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-gray-50 dark:bg-[#202330] hover:bg-gray-100 dark:hover:bg-[#2a2d3d] text-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition border border-gray-200 dark:border-[#2e3240]"><MessageSquare size={12}/> Parent</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">No urgent red alerts.</div>
              )}
            </div>
          </div>

          {/* Super Green */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30 shadow-sm overflow-hidden transition-colors flex flex-col max-h-[400px]">
            <div className="p-5 border-b border-green-200/50 dark:border-green-900/30 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-500" style={{ fontFamily: 'Sora' }}>⭐ Super Green</h3>
              <span className="text-xs font-bold text-green-800 dark:text-green-400 bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded-full">{super_green_highlights.length}</span>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar">
              {super_green_highlights.length > 0 ? (
                <div className="space-y-3">
                  {super_green_highlights.map((item) => (
                    <div key={item.signal_id} className="bg-white dark:bg-[#151722] rounded-lg p-3 border border-green-100 dark:border-green-900/30 shadow-sm">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{item.first_name} {item.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.reason_description || 'Positive Behavior'} • {new Date(item.signal_date).toLocaleDateString()}</p>
                      {item.parent_email_on_file ? (
                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-bold">Email Sent to Parent</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 dark:bg-[#202330] text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-bold">No Email on File</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">No recent super green highlights.</div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] border-l-orange-500 border-l-[3px] shadow-sm overflow-hidden transition-colors">
              <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white tracking-wide">Recommendations</h3>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex flex-col">
                {recommendations.map((rec, i) => {
                  let title = rec;
                  let subtitle = '';
                  if (rec.includes(' — ')) {
                    const parts = rec.split(' — ');
                    title = parts[0];
                    subtitle = parts.slice(1).join(' — ');
                  } else if (rec.includes(' - ')) {
                    const parts = rec.split(' - ');
                    title = parts[0];
                    subtitle = parts.slice(1).join(' - ');
                  }

                  let Icon = User;
                  let iconColor = 'text-orange-500';
                  const tl = title.toLowerCase() + subtitle.toLowerCase();
                  if (tl.includes('green') || tl.includes('recogniz') || tl.includes('positive')) {
                    Icon = Star;
                    iconColor = 'text-green-500';
                  } else if (tl.includes('class') || tl.includes('log') || tl.includes('absent')) {
                    Icon = ClipboardList;
                    iconColor = 'text-orange-500';
                  } else if (tl.includes('alert') || tl.includes('red') || tl.includes('urgent')) {
                    Icon = AlertCircle;
                    iconColor = 'text-red-500';
                  }

                  return (
                    <div key={i} className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors cursor-pointer ${i !== recommendations.length - 1 ? 'border-b border-gray-200 dark:border-[#262a3d]' : ''}`}>
                      <Icon size={20} className={iconColor} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
                        {subtitle && <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{subtitle}</p>}
                      </div>
                      <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {emailModalStudent && (
        <EmailCounselorModal
          isOpen={!!emailModalStudent}
          onClose={() => setEmailModalStudent(null)}
          studentName={`${emailModalStudent.student.first_name} ${emailModalStudent.student.last_name}`}
          studentId={emailModalStudent.student.student_id}
        />
      )}

      {notifyModalStudent && (
        <ParentNotifyModal
          isOpen={!!notifyModalStudent}
          onClose={() => setNotifyModalStudent(null)}
          studentName={`${notifyModalStudent.student.first_name} ${notifyModalStudent.student.last_name}`}
          studentId={notifyModalStudent.student.student_id}
        />
      )}
    </div>
  );
}
