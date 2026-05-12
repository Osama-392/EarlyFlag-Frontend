'use client';

import { Mail, Phone, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { useState, useEffect, useCallback } from 'react';
import EmailCounselorModal from '@/components/EmailCounselorModal';
import ParentNotifyModal from '@/components/ParentNotifyModal';
import {
  getTeacherDashboard,
  DashboardData,
  WatchListStudent,
  UrgentAlert,
  ActivityItem,
  SuperGreenStudent,
  DailyBreakdown,
} from '@/lib/dashboardService';

// Helper to get student display name from various field shapes
const getStudentName = (item: any): string => {
  if (item.student_name) return item.student_name;
  if (item.first_name || item.last_name) return `${item.first_name || ''} ${item.last_name || ''}`.trim();
  if (item.name) return item.name;
  return 'Unknown Student';
};

// Helper to format relative time
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

// Helper to format percentage change
const formatChange = (value?: number): string => {
  if (value === undefined || value === null) return '';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}%`;
};

export default function Dashboard() {
  const { loading: authLoading } = useProtectedRoute();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [emailModalStudent, setEmailModalStudent] = useState<UrgentAlert | null>(null);
  const [notifyModalStudent, setNotifyModalStudent] = useState<UrgentAlert | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await getTeacherDashboard();
      setDashboardData(data);
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

  // Listen for custom dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (!authLoading) {
        loadDashboard(true);
      }
    };

    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
    };
  }, [authLoading, loadDashboard]);

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
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-6">
              <div className="skeleton h-4 w-2/3 mb-3" />
              <div className="skeleton h-10 w-1/3 mb-2" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))}
        </div>
        {/* Skeleton content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="skeleton h-6 w-1/3 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="skeleton h-6 w-1/2 mb-4" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            </div>
          </div>
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
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ─── Extract data from response (resilient to different shapes) ───
  const stats = dashboardData?.stats || {};
  const yellowWatchList: WatchListStudent[] = dashboardData?.yellow_watch_list || dashboardData?.watch_list || [];
  const redUrgent: UrgentAlert[] = dashboardData?.red_urgent || dashboardData?.urgent_alerts || dashboardData?.alerts || [];
  const recentActivity: ActivityItem[] = dashboardData?.recent_activity || dashboardData?.activity || [];
  const superGreen: SuperGreenStudent[] = dashboardData?.super_green || dashboardData?.super_green_students || [];
  const dailyBreakdown: DailyBreakdown[] = dashboardData?.daily_breakdown || dashboardData?.seven_day_breakdown || [];

  // Stat card config
  const statCards = [
    {
      label: 'Students Flagged This Week',
      value: stats.students_flagged_this_week ?? stats.total_students ?? '—',
      change: formatChange(stats.flagged_change),
      icon: '👥',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Yellow Flags (30 Days)',
      value: stats.yellow_flags_30d ?? '—',
      change: formatChange(stats.yellow_change),
      icon: '⚠️',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Red Flags (30 Days)',
      value: stats.red_flags_30d ?? '—',
      change: formatChange(stats.red_change),
      icon: '🚨',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  // Compute max for chart scaling
  const maxChartValue = dailyBreakdown.length > 0
    ? Math.max(...dailyBreakdown.map((d) => Math.max(d.academic || 0, d.behavioral || 0)), 1)
    : 1;

  const weekTotal = dailyBreakdown.reduce((sum, d) => sum + (d.academic || 0) + (d.behavioral || 0), 0);

  return (
    <div className="space-y-6">
      {/* Refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg text-sm">
          <RefreshCw size={14} className="animate-spin" />
          Refreshing...
        </div>
      )}

      {/* Error banner (non-blocking) */}
      {error && dashboardData && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => loadDashboard(true)}
            className="text-sm font-medium text-red-700 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${stat.bgColor} rounded-lg border border-gray-200 p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.change && (
                  <p className={`text-sm mt-2 ${stat.textColor}`}>{stat.change}</p>
                )}
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Yellow Watch List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <span>🟡</span>
                  <span>Yellow Watch List</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    {yellowWatchList.length}
                  </span>
                  <button
                    onClick={() => loadDashboard(true)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                    title="Refresh"
                  >
                    <RefreshCw size={14} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {yellowWatchList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Student</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Academic</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Behavioral</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Total Flags</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Last Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yellowWatchList.map((row, idx) => (
                      <tr key={row.student_id || idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{getStudentName(row)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {row.academic_count ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {row.behavioral_count ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            {row.total_flags}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {formatRelativeTime(row.last_flag_date) || row.streak || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No students on the yellow watch list right now.</p>
                <p className="text-gray-400 text-xs mt-1">Students with 3+ yellow flags will appear here.</p>
              </div>
            )}
          </div>

          {/* 7-Day Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Breakdown</h3>
            <p className="text-sm text-gray-500 mb-4">Academic vs Behavioral Flags</p>

            {dailyBreakdown.length > 0 ? (
              <>
                <div className="flex items-end space-x-3 h-48 justify-around">
                  {dailyBreakdown.map((day, idx) => {
                    const academicHeight = maxChartValue > 0 ? ((day.academic || 0) / maxChartValue) * 100 : 0;
                    const behavioralHeight = maxChartValue > 0 ? ((day.behavioral || 0) / maxChartValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex flex-col items-center space-y-2 flex-1 group">
                        <div className="flex gap-1 h-32 items-end w-full justify-center">
                          <div
                            className="w-3 bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                            style={{ height: `${Math.max(academicHeight, 2)}%` }}
                            title={`Academic: ${day.academic}`}
                          />
                          <div
                            className="w-3 bg-purple-500 rounded-t transition-all group-hover:bg-purple-600"
                            style={{ height: `${Math.max(behavioralHeight, 2)}%` }}
                            title={`Behavioral: ${day.behavioral}`}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{day.day}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center space-x-6 text-xs mt-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-gray-600">Academic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded" />
                    <span className="text-gray-600">Behavioral</span>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Week&apos;s Total: <span className="font-bold text-gray-900">{weekTotal} Flags</span>
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">No breakdown data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Red Urgent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🔴 Red Urgent</h3>
              <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                {redUrgent.length}
              </span>
            </div>

            {redUrgent.length > 0 ? (
              <div className="space-y-3">
                {redUrgent.map((item, idx) => (
                  <div key={item.id || idx} className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{getStudentName(item)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.issue || item.rule_name || item.alert_type || 'Urgent flag'}
                        </p>
                      </div>
                      {(item.duration || item.severity) && (
                        <span className="text-xs font-bold text-red-700 bg-white px-2 py-1 rounded">
                          {item.duration || item.severity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-3 text-xs">
                      <button
                        onClick={() => setEmailModalStudent(item)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Counselor</span>
                      </button>
                      <button
                        onClick={() => setNotifyModalStudent(item)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Parent</span>
                      </button>
                      {item.created_at && (
                        <span className="text-gray-400 ml-auto">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No urgent red alerts.</p>
                <p className="text-green-600 text-xs font-medium mt-1">✓ All clear</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>

            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-0">
                    <span className="text-lg">
                      {item.type === 'flag' ? '📋' :
                       item.type === 'recommendation' ? '💬' :
                       item.type === 'streak' ? '📊' :
                       item.type === 'report' ? '📋' : '📋'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        {item.description || item.text || 'Activity recorded'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(item.created_at) || item.time || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No recent activity yet.</p>
              </div>
            )}
          </div>

          {/* Super Green Recognition */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">⭐ Super Green Recognition</h3>
              <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded">
                {superGreen.length}
              </span>
            </div>

            {superGreen.length > 0 ? (
              <div className="space-y-2">
                {superGreen.map((student, idx) => (
                  <div key={student.student_id || idx} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{getStudentName(student)}</p>
                        <p className="text-xs text-gray-500">
                          {student.grade || student.class_name || ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                        {student.green_streak_days}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No super green streaks yet.</p>
                <p className="text-gray-400 text-xs mt-1">Students with 5+ consecutive green days will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {emailModalStudent && (
        <EmailCounselorModal
          isOpen={!!emailModalStudent}
          onClose={() => setEmailModalStudent(null)}
          studentName={getStudentName(emailModalStudent)}
          studentId={emailModalStudent.student_id}
        />
      )}

      {notifyModalStudent && (
        <ParentNotifyModal
          isOpen={!!notifyModalStudent}
          onClose={() => setNotifyModalStudent(null)}
          studentName={getStudentName(notifyModalStudent)}
          studentId={notifyModalStudent.student_id}
        />
      )}
    </div>
  );
}
