'use client';

import { Mail, RefreshCw, AlertCircle, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { useState, useEffect, useCallback, useMemo } from 'react';
import EmailCounselorModal from '@/components/EmailCounselorModal';
import ParentNotifyModal from '@/components/ParentNotifyModal';
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

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
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
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
          }
        `}</style>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-6">
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
    monday_brief,
    recommendations
  } = dashboardData;

  const statCards = [
    {
      label: 'Yellow Flags This Week',
      value: kpis.yellow_total,
      icon: '⚠️',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Red Flags This Week',
      value: kpis.red_total,
      icon: '🚨',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: 'Super Greens This Week',
      value: kpis.super_green_total,
      icon: '⭐',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Absences This Week',
      value: kpis.absent_total || 0,
      icon: '📅',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
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

      {/* Monday Brief */}
      {monday_brief?.active && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <AlertCircle size={150} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora' }}>Monday Morning Brief</h2>
          <p className="text-blue-100 text-sm mb-4">Summary for {new Date(monday_brief.prior_week_start).toLocaleDateString()} – {new Date(monday_brief.prior_week_end).toLocaleDateString()}</p>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Unresolved Criticals</p>
              <p className="text-2xl font-bold">{monday_brief.prior_week_unresolved_critical}</p>
            </div>
            {monday_brief.top_students && monday_brief.top_students.length > 0 && (
              <div className="bg-white/20 rounded-lg p-3 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-100 mb-1">Top Needs Support</p>
                <div className="flex gap-2">
                  {monday_brief.top_students.map(ts => (
                     <span key={ts.student_id} className="bg-white/10 px-2 py-1 rounded text-sm font-medium">{ts.first_name} {ts.last_name} ({ts.total_signals})</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 shadow-sm mb-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-800 font-bold text-lg mb-1">Unfinished Quick Logs (12+ hours)</h3>
            <p className="text-amber-700 text-sm mb-3">
              You started logging signals for the following classes but did not submit them. Would you like to resume?
            </p>
            <div className="flex flex-wrap gap-2">
              {unfinishedAlerts.map(log => (
                <div key={log.session_id} className="bg-white border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-3">
                  <div>
                    <span className="font-semibold text-gray-900 block text-sm">{log.class_name}</span>
                    <span className="text-xs text-gray-500">
                      Started {log.elapsed_hours}h ago &bull; {log.student_count} student{log.student_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(log.session_id)}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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
          <div key={idx} className={`${stat.bgColor} rounded-xl border border-gray-100 p-6 shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: 'Sora' }}>{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Yellow Watch List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2" style={{ fontFamily: 'Sora' }}>
                <span>🟡</span><span>Yellow Watch List</span>
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{yellow_watch_list.length}</span>
            </div>
            {yellow_watch_list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Student</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Grade</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Acd / Beh</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yellow_watch_list.map((row) => (
                      <tr key={row.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
                        <td className="px-5 py-3 text-gray-500">Gr {row.grade_level}</td>
                        <td className="px-5 py-3">
                          <span className="text-blue-600 font-semibold">{row.yellow_academic_count}</span>
                          <span className="text-gray-300 mx-1">/</span>
                          <span className="text-purple-600 font-semibold">{row.yellow_behavioral_count}</span>
                        </td>
                        <td className="px-5 py-3 font-bold text-amber-600">{row.yellow_total}</td>
                        <td className="px-5 py-3">
                          {row.unresolved_alert_max_severity ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">{row.unresolved_alert_max_severity.toUpperCase()}</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">WATCH</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No students on the yellow watch list right now.</div>
            )}
          </div>

          {/* Class Logging Status */}
          <div className={`bg-white rounded-xl border ${isEndOfDay ? 'border-orange-200' : 'border-gray-200'} overflow-hidden shadow-sm`}>
            <div className={`p-5 border-b ${isEndOfDay ? 'border-orange-100' : 'border-gray-100'} flex items-center justify-between`}>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora' }}>Today's Class Logging Status</h3>
              {isEndOfDay && (
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={12} />
                  {unloggedClasses.length} remaining
                </span>
              )}
            </div>
            {classes.length > 0 ? (
              <div className="divide-y divide-gray-100">
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
                        ? `cursor-pointer ${isEndOfDay ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-blue-50'}`
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${!c.logged_today && isEndOfDay ? 'text-orange-900' : 'text-gray-900'}`}>{c.class_name}</p>
                      <p className="text-xs text-gray-500">{c.student_count_active} active students</p>
                    </div>
                    {c.logged_today ? (
                      <div className="flex items-center text-green-600 text-sm font-semibold gap-1"><CheckCircle2 size={16}/> Logged</div>
                    ) : (
                      <div className={`flex items-center text-sm font-medium gap-1 ${isEndOfDay ? 'text-orange-600' : 'text-gray-400'}`}>
                        <AlertCircle size={16}/>
                        <span>{isEndOfDay ? 'Log Now →' : 'Not Logged'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No classes assigned.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Red Urgent */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 p-5 border-b border-red-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-900" style={{ fontFamily: 'Sora' }}>🔴 Red Urgent</h3>
              <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded-full">{red_urgent.length}</span>
            </div>
            <div className="p-5">
              {red_urgent.length > 0 ? (
                <div className="space-y-4">
                  {red_urgent.map((item) => (
                    <div key={item.alert_id} className="bg-white rounded-lg p-4 border border-red-100 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{item.student.first_name} {item.student.last_name}</p>
                          <p className="text-xs text-gray-500">Gr {item.student.grade_level}</p>
                        </div>
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded uppercase tracking-wider">{item.severity}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 bg-red-50 p-2 rounded">{item.rule_description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setEmailModalStudent(item)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs font-semibold transition border border-gray-200"><Mail size={12}/> Counselor</button>
                        <button onClick={() => setNotifyModalStudent(item)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs font-semibold transition border border-gray-200"><MessageSquare size={12}/> Parent</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No urgent red alerts.</div>
              )}
            </div>
          </div>

          {/* Super Green */}
          <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-green-200/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-green-900" style={{ fontFamily: 'Sora' }}>⭐ Super Green</h3>
              <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-full">{super_green_highlights.length}</span>
            </div>
            <div className="p-5">
              {super_green_highlights.length > 0 ? (
                <div className="space-y-3">
                  {super_green_highlights.map((item) => (
                    <div key={item.signal_id} className="bg-white rounded-lg p-3 border border-green-100 shadow-sm">
                      <p className="font-bold text-gray-900 text-sm">{item.first_name} {item.last_name}</p>
                      <p className="text-xs text-gray-500 mb-1">{item.reason_description || 'Positive Behavior'} • {new Date(item.signal_date).toLocaleDateString()}</p>
                      {item.parent_email_on_file ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Email Sent to Parent</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">No Email on File</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No recent super green highlights.</div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wider">Recommendations</h3>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-indigo-800 flex gap-2"><span className="text-indigo-400">→</span> {rec}</li>
                ))}
              </ul>
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
