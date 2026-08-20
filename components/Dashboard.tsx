'use client';

import {
 Activity,
 AlertCircle,
 AlertTriangle,
 ArrowDown,
 ArrowDownRight,
 ArrowUp,
 ArrowUpRight,
 BarChart3,
 Calendar,
 CheckCircle2,
 ChevronRight,
 ClipboardList,
 Clock,
 Flag,
 Info,
 Mail,
 MessageSquare,
 Minus,
 RefreshCw,
 Star,
 TrendingDown,
 TrendingUp,
 User,
 Users,
 Trophy,
 Sparkles,
 Award
} from 'lucide-react';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { getMultiWindowStats, SignalStats } from '@/lib/analyticsService';
import EmailCounselorModal from '@/components/EmailCounselorModal';
import ParentNotifyModal from '@/components/ParentNotifyModal';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
import GoodMorningBanner from '@/components/GoodMorningBanner';
import {
 getTeacherDashboard,
 TeacherDashboardResponse,
 RedUrgentRow,
 UnfinishedLogRow,
 getUnfinishedAlerts,
 dismissUnfinishedAlert,
 getTeacherRecognitions,
 StudentRecognitionRow
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


type TimeWindow = 'today' | 'week' | 'month';

const WINDOW_LABELS: Record<TimeWindow, string> = {
 today: 'Today',
 week: 'This Week',
 month: '30 Days',
};

function pct(value: number, total: number): number {
 if (total === 0) return 0;
 return Math.round((value / total) * 100);
}

export default function Dashboard() {
 const { loading: authLoading } = useProtectedRoute();
 const [dashboardData, setDashboardData] = useState<TeacherDashboardResponse | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [refreshing, setRefreshing] = useState(false);
 const [emailModalStudent, setEmailModalStudent] = useState<RedUrgentRow | null>(null);
 const [notifyModalStudent, setNotifyModalStudent] = useState<RedUrgentRow | null>(null);
 const [unfinishedAlerts, setUnfinishedAlerts] = useState<UnfinishedLogRow[]>([]);
 const [recognitions, setRecognitions] = useState<StudentRecognitionRow[]>([]);
 const [templateModalData, setTemplateModalData] = useState<{
 studentName: string;
 flagCategory: 'red' | 'yellow' | 'super_green' | 'absent';
 reason?: string;
 studentId?: string;
 classId?: string;
 recentFlags?: any[];
 } | null>(null);

 const [stats, setStats] = useState<{ today: SignalStats; week: SignalStats; month: SignalStats } | null>(null);
 const [activeWindow, setActiveWindow] = useState<TimeWindow>('today');

 const { user } = useAuth();

 const getClassIdByName = useCallback((className?: string) => {
   if (!className) return undefined;
   const cls = dashboardData?.classes?.find(
     (c: any) => c.class_name?.toLowerCase() === className.toLowerCase()
   );
   return cls?.class_id;
 }, [dashboardData]);

 const loadDashboard = useCallback(async (refreshMode: boolean | 'silent' = false) => {
 try {
 if (refreshMode === true) setRefreshing(true);
 else if (!refreshMode) setLoading(true);
 // If 'silent', we don't set any loading state to keep the UI uninterrupted
 setError(null);

 const [data, alerts, statsData, recsData] = await Promise.all([
 getTeacherDashboard(),
 getUnfinishedAlerts(),
 getMultiWindowStats(),
 getTeacherRecognitions(100)
 ]);
 setDashboardData(data);
 setUnfinishedAlerts(alerts);
 setStats(statsData);
 setRecognitions(recsData);
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

 const handleClassLogged = (e: Event) => {
 const { classId, date } = (e as CustomEvent).detail;
 setDashboardData((prev) => {
 if (!prev) return prev;
 const newClasses = prev.classes.map((c) => {
 if (c.class_id === classId) {
 // Remove the logged date from unlogged_dates
 const newUnloggedDates = (c.unlogged_dates || []).filter(d => d !== date);
 return {
 ...c,
 unlogged_dates: newUnloggedDates,
 // If there are no more unlogged dates, we can also set logged_today = true (just in case)
 logged_today: newUnloggedDates.length === 0,
 };
 }
 return c;
 });
 return { ...prev, classes: newClasses };
 });
 };

 window.addEventListener('dashboard-refresh', handleRefresh);
 window.addEventListener('class-logged', handleClassLogged);
 return () => {
 window.removeEventListener('dashboard-refresh', handleRefresh);
 window.removeEventListener('class-logged', handleClassLogged);
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
 const { isEndOfDay, unloggedSessionsGrouped, totalUnlogged, currentHour } = useMemo(() => {
 if (!dashboardData) return { isEndOfDay: false, unloggedSessionsGrouped: {}, totalUnlogged: 0, currentHour: 0 };

 const tz = dashboardData.school_timezone || 'America/New_York';
 let hour = new Date().getHours(); // fallback to local time
 let todayStr = new Date().toISOString().split('T')[0];
 try {
 const timeStr = new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
 hour = parseInt(timeStr, 10);
 
 const dateStr = new Date().toLocaleString('en-US', { timeZone: tz });
 const localDate = new Date(dateStr);
 todayStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
 } catch { /* fallback to local */ }

 const grouped: Record<string, any[]> = {};
 let total = 0;
 
 dashboardData.classes.forEach(c => {
 (c.unlogged_dates || []).forEach(date => {
 if (!grouped[date]) grouped[date] = [];
 grouped[date].push(c);
 total++;
 });
 });

 // Sort dates descending (newest first, so Today is at the top)
 const sortedGrouped: Record<string, any[]> = {};
 Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(date => {
 sortedGrouped[date] = grouped[date];
 });

 // Always show reminder
 return {
 isEndOfDay: total > 0,
 unloggedSessionsGrouped: sortedGrouped,
 totalUnlogged: total,
 currentHour: hour,
 };
 }, [dashboardData]);

 const handleQuickLogForClass = (classId: string, date?: string) => {
 // Dispatch custom event to Header → opens QuickLogModal with this class pre-selected
 if (typeof window !== 'undefined') {
 window.dispatchEvent(new CustomEvent('open-quicklog-for-class', { detail: { classId, date } }));
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
 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load dashboard</h3>
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

 if (!dashboardData || !stats) return null;

 const current = stats[activeWindow];

 const {
 kpis,
 yellow_watch_list,
 red_urgent,
 super_green_highlights,
 absent_students,
 classes,
 recommendations
 } = dashboardData;

// ─── Summary Metrics ─────────────────────────────────────────────
 const summaryCards = [
 {
 label: 'Total Signals',
 value: current.total_signals,
 icon: <Activity className="w-5 h-5" />,
 color: 'from-blue-500 to-indigo-600',
 bgLight: 'bg-blue-50',
 textColor: 'text-blue-700',
 },
 {
 label: 'Yellow Flags',
 value: current.yellow_count,
 icon: <AlertCircle className="w-5 h-5" />,
 color: 'from-amber-400 to-orange-500',
 bgLight: 'bg-amber-50',
 textColor: 'text-amber-700',
 },
 {
 label: 'Red Flags',
 value: current.red_count,
 icon: <TrendingDown className="w-5 h-5" />,
 color: 'from-red-500 to-rose-600',
 bgLight: 'bg-red-50',
 textColor: 'text-red-700',
 },
 {
 label: 'Super Greens',
 value: current.super_green_count,
 icon: <TrendingUp className="w-5 h-5" />,
 color: 'from-emerald-400 to-green-600',
 bgLight: 'bg-green-50',
 textColor: 'text-green-700',
 },
 ];

 // ─── Distribution data for horizontal bar chart ───────────────────
 const distributionData = [
 { label: 'Super Green', count: current.super_green_count, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700' },
 { label: 'Present', count: current.present_count, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700' },
 { label: 'Yellow', count: current.yellow_count, color: 'bg-amber-400', lightBg: 'bg-amber-50', textColor: 'text-amber-700' },
 { label: 'Red', count: current.red_count, color: 'bg-red-500', lightBg: 'bg-red-50', textColor: 'text-red-700' },
 { label: 'Absent', count: current.absent_count, color: 'bg-gray-400', lightBg: 'bg-gray-50 dark:bg-[#1b1e2c]', textColor: 'text-gray-700 dark:text-gray-300' },
 ];
 const maxDistribution = Math.max(...distributionData.map(d => d.count), 1);

 // ─── Category breakdown ──────────────────────────────────────────
 const categoryData = [
 { label: 'Yellow Academic', count: current.yellow_academic_count, color: 'bg-yellow-400', icon: '📘' },
 { label: 'Yellow Behavioral', count: current.yellow_behavioral_count, color: 'bg-amber-500', icon: '📙' },
 { label: 'Red Academic', count: current.red_academic_count, color: 'bg-red-500', icon: '🔴' },
 { label: 'Red Behavioral', count: current.red_behavioral_count, color: 'bg-rose-600', icon: '⛔' },
 ];
 const maxCategory = Math.max(...categoryData.map(d => d.count), 1);

 // ─── Cross-window comparison ──────────────────────────────────────
 const comparisonMetrics = [
 {
 label: 'Yellow Flags',
 subtitle: 'Needs attention',
 icon: <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />,
 iconBg: 'bg-amber-100 dark:bg-amber-900/40',
 today: stats.today.yellow_count,
 week: stats.week.yellow_count,
 month: stats.month.yellow_count,
 invertGood: true,
 fewerText: "You're seeing fewer yellow flags than usual.",
 moreText: "You're seeing more yellow flags than usual.",
 },
 {
 label: 'Red Flags',
 subtitle: 'High priority',
 icon: <Flag className="w-5 h-5 text-white fill-white" />,
 iconBg: 'bg-red-500',
 today: stats.today.red_count,
 week: stats.week.red_count,
 month: stats.month.red_count,
 invertGood: true,
 fewerText: "You're seeing fewer red flags than usual.",
 moreText: "You're seeing more red flags than usual.",
 },
 {
 label: 'Super Greens',
 subtitle: 'Positive recognition',
 icon: <Star className="w-5 h-5 text-white fill-white" />,
 iconBg: 'bg-emerald-500',
 today: stats.today.super_green_count,
 week: stats.week.super_green_count,
 month: stats.month.super_green_count,
 invertGood: false,
 fewerText: "You're seeing fewer positive recognitions than usual.",
 moreText: "You're seeing more positive recognitions than usual.",
 },
 {
 label: 'Absent',
 subtitle: 'Attendance',
 icon: <User className="w-5 h-5 text-white fill-white" />,
 iconBg: 'bg-purple-600',
 today: stats.today.absent_count,
 week: stats.week.absent_count,
 month: stats.month.absent_count,
 invertGood: true,
 fewerText: "You have fewer absences than usual.",
 moreText: "You have more absences than usual.",
 },
 ];

 // ─── Class logging stats ──────────────────────────────────────────
 const totalClasses = classes.length;
 const loggedToday = classes.filter(c => c.logged_today).length;
 const totalStudents = classes.reduce((sum, c) => sum + c.student_count_active, 0);

 

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
 <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12">
 <style>{`
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
 <h2 className="text-xl font-bold text-white ">
 End-of-Day Reminder
 </h2>
 <p className="text-orange-100 text-sm">
 {totalUnlogged} class{totalUnlogged !== 1 ? 'es' : ''} still need logging — tap to complete
 </p>
 </div>
 </div>
 
 <div className="space-y-6 mt-6">
 {Object.keys(unloggedSessionsGrouped).map((dateKey) => {
 const classes = unloggedSessionsGrouped[dateKey];
 
 // Format the header: "TODAY - JULY 14", "YESTERDAY - JULY 13", or "FRIDAY - JULY 10"
 const dateObj = new Date(dateKey + 'T12:00:00'); // Use noon to avoid timezone shift
 const todayObj = new Date();
 const yesterdayObj = new Date();
 yesterdayObj.setDate(yesterdayObj.getDate() - 1);
 
 let dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
 if (dateKey === todayObj.toISOString().split('T')[0]) {
 dayLabel = 'TODAY';
 } else if (dateKey === yesterdayObj.toISOString().split('T')[0]) {
 dayLabel = 'YESTERDAY';
 }
 const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase();
 
 return (
 <div key={dateKey}>
 <div className="flex items-center gap-4 mb-4">
 <div className="h-px bg-white/20 flex-1"></div>
 <span className="text-white/80 text-xs font-bold tracking-wider">{dayLabel} • {dateLabel}</span>
 <div className="h-px bg-white/20 flex-1"></div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {classes.map(c => (
 <button
 key={`${dateKey}-${c.class_id}`}
 onClick={() => handleQuickLogForClass(c.class_id, dateKey)}
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
 );
 })}
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

 {/* Stats Cards Removed */}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Yellow Watch List */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#1a1d27] rounded-xl border border-gray-200 dark:border-[#2e3240] overflow-hidden shadow-sm transition-colors flex flex-col h-[450px]">
 <div className="p-5 border-b border-gray-100 dark:border-[#2e3240] flex items-center justify-between shrink-0">
 <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 ">
 <span>🟡</span><span>Yellow Watch List</span>
 </h3>
 <span className="text-xs font-bold text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">{yellow_watch_list.length}</span>
 </div>
 {yellow_watch_list.length > 0 ? (
 <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
 <table className="w-full text-xs">
 <thead className="bg-gray-50/50 dark:bg-[#151722]/50">
 <tr>
 <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Student</th>
 <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Grade</th>
 <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Acd / Beh</th>
 <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Total</th>
 <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
 <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400"></th>
 </tr>
 </thead>
 <tbody>
 {yellow_watch_list.map((row) => (
 <tr key={row.student_id} className="border-b border-gray-100 dark:border-[#2e3240] hover:bg-gray-50 dark:hover:bg-[#202330] transition">
 <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row.first_name} {row.last_name}</td>
 <td className="px-3 py-2 text-gray-500 dark:text-gray-400">Gr {row.grade_level}</td>
 <td className="px-3 py-2">
 <span className="text-blue-600 dark:text-blue-400 font-semibold">{row.yellow_academic_count}</span>
 <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
 <span className="text-purple-600 dark:text-purple-400 font-semibold">{row.yellow_behavioral_count}</span>
 </td>
 <td className="px-3 py-2 font-bold text-amber-600 dark:text-amber-500">{row.yellow_total}</td>
 <td className="px-3 py-2">
 {row.unresolved_alert_max_severity ? (
 <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] rounded font-medium">{row.unresolved_alert_max_severity.toUpperCase()}</span>
 ) : (
 <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] rounded font-medium">WATCH</span>
 )}
 </td>
 <td className="px-3 py-2 text-right">
 <button
 onClick={() => setTemplateModalData({ studentName: `${row.first_name} ${row.last_name}`, flagCategory: 'yellow', reason: row.unresolved_alert_max_severity ? `frequent ${row.unresolved_alert_max_severity} level alerts` : undefined, studentId: row.student_id, classId: undefined })}
 className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold rounded-full transition-colors shadow-sm"
 >
 <Mail className="w-3.5 h-3.5" />
 Email
 </button>
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
 </div>
 {/* Yellow Watch List Ends */}

 {/* Red Urgent */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#1a1d27] rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden transition-colors flex flex-col h-[450px]">
 <div className="bg-red-50 dark:bg-red-900/20 p-5 border-b border-red-100 dark:border-red-900/50 flex items-center justify-between shrink-0">
 <h3 className="text-lg font-bold text-red-900 dark:text-red-400 ">🔴 Red Urgent</h3>
 <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/50 px-2 py-1 rounded-full">{red_urgent.length}</span>
 </div>
 <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
 {red_urgent.length > 0 ? (
 <div className="space-y-2">
 {red_urgent.map((item) => (
 <div key={item.alert_id} className="bg-white dark:bg-[#151722] rounded-lg p-3 border border-red-100 dark:border-red-900/30 shadow-sm">
 <div className="flex items-start justify-between mb-1.5">
  <div>
  <div className="flex items-center gap-1.5">
  <p className="font-bold text-gray-900 dark:text-white text-sm">{item.student.first_name} {item.student.last_name}</p>
  </div>
  <p className="text-[11px] text-gray-500 dark:text-gray-400">
  Gr {item.student.grade_level}
  </p>
  </div>
 <span className="text-[9px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.severity}</span>
 </div>
 <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 bg-red-50 dark:bg-red-900/10 p-1.5 rounded border dark:border-red-900/20 leading-tight">{item.rule_description}</p>
 <div className="flex justify-end">
 <button
 onClick={() => setTemplateModalData({ studentName: `${item.student.first_name} ${item.student.last_name}`, flagCategory: 'red', reason: item.rule_description, studentId: item.student.student_id, recentFlags: item.recent_flags, classId: getClassIdByName(item.recent_flags?.[0]?.class_name) })}
 className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-full transition-colors shadow-sm"
 >
 <Mail className="w-3.5 h-3.5" />
 Email
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-4 text-gray-500 dark:text-gray-400">No urgent red alerts.</div>
 )}
 </div>
 </div>
 </div>

 {/* Super Green */}
 <div className="space-y-6">
 <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30 shadow-sm overflow-hidden transition-colors flex flex-col h-[450px]">
 <div className="p-5 border-b border-green-200/50 dark:border-green-900/30 flex justify-between items-center shrink-0">
 <h3 className="text-lg font-bold text-green-900 dark:text-green-500 ">⭐ Super Green</h3>
 <span className="text-xs font-bold text-green-800 dark:text-green-400 bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded-full">{super_green_highlights.length}</span>
 </div>
 <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
 {super_green_highlights.length > 0 ? (
 <div className="space-y-2">
 {super_green_highlights.map((item) => (
 <div key={item.signal_id} className="bg-white dark:bg-[#151722] rounded-lg p-2.5 border border-green-100 dark:border-green-900/30 shadow-sm">
 <p className="font-bold text-gray-900 dark:text-white text-xs">{item.first_name} {item.last_name}</p>
 <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 leading-tight">{item.reason_description || 'Positive Behavior'} • {new Date(item.signal_date).toLocaleDateString()}</p>
 <div className="flex justify-between items-center mt-1.5">
 {item.parent_email_on_file ? (
 <span className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">Email Sent</span>
 ) : (
 <div />
 )}
 <button
 onClick={() => setTemplateModalData({
 studentName: `${item.first_name} ${item.last_name}`,
 flagCategory: 'super_green',
 reason: item.reason_description || 'Positive Behavior',
 studentId: item.student_id,
 classId: item.class_id ?? undefined,
 })}
 className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-full transition-colors shadow-sm"
 >
 <Mail className="w-2.5 h-2.5" />
 Email
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-4 text-gray-500 dark:text-gray-400">No recent super green highlights.</div>
 )}
 </div>
 </div>

 {/* Recommendations Removed */}
 </div>
 </div>

 {/* ─── Absent Students This Week ─────────────────────────────── */}
 <div className="mt-6 bg-white dark:bg-[#1a1d27] rounded-xl border border-gray-200 dark:border-[#2e3240] shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 dark:border-[#2e3240] flex items-center justify-between bg-slate-50 dark:bg-[#151722]">
 <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2 ">
 <Calendar className="w-4 h-4 text-gray-500" />
 <span>Absent Students This Week</span>
 </h3>
 {dashboardData.absent_students && (
 <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
 {dashboardData.absent_students.length} absences logged
 </span>
 )}
 </div>
 <div className="p-4">
 {dashboardData.absent_students && dashboardData.absent_students.length > 0 ? (
 <div className="flex flex-wrap gap-4">
 {dashboardData.absent_students.map((student: any) => (
 <div key={student.student_id} className="flex-1 min-w-[200px] flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
 <div>
 <p className="font-bold text-sm flex items-center gap-1.5 text-gray-900 dark:text-white">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
 {student.first_name} {student.last_name}
 </p>
 <p className="text-xs text-gray-500 ml-3">{student.class_name}</p>
 <div className="mt-2 ml-3">
 <span className={`text-xs font-bold px-2 py-0.5 rounded ${student.consecutive_absences >= 3 ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
 {student.consecutive_absences} {student.consecutive_absences === 1 ? 'absence' : 'absences'}
 </span>
 </div>
 </div>
 {student.consecutive_absences >= 3 ? (
 <button
 onClick={() => setTemplateModalData({
 studentName: `${student.first_name} ${student.last_name}`,
 flagCategory: 'absent',
 reason: `${student.consecutive_absences} absences in the last 7 days`,
 studentId: student.student_id,
 classId: getClassIdByName(student.class_name)
 })}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
 >
 <Mail className="w-3.5 h-3.5" />
 Email
 </button>
 ) : (
 <span className="text-[10px] text-gray-400 font-medium">No email yet</span>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-6 text-sm text-gray-500">
 No students have been marked absent this week.
 </div>
 )}
 </div>
 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 border-t border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
 <AlertCircle />
 <p className="text-xs text-yellow-800 dark:text-yellow-500/90 leading-relaxed">
 Email button appears automatically when a student reaches 3 absences in the last 7 days in your classes.
 </p>
 </div>
 </div>
 <div className="mt-16 pt-8 border-t border-gray-200 dark:border-[#262a3d] space-y-6 sm:space-y-8">
{/* ─── Signal Health Summary (top of page) ────────────────── */}
 {current.total_signals > 0 && (
 <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
 <h3 className="text-base font-bold mb-4 flex items-center gap-2">
 <Activity className="w-4 h-4 text-teal-400" />
 Signal Health Summary
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
 <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
 <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Engagement Rate</p>
 <p className="text-2xl font-bold mt-1">
 {pct(current.super_green_count + current.present_count, current.total_signals)}%
 </p>
 <p className="text-xs text-slate-400 mt-1">Green + Present</p>
 </div>
 <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
 <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Concern Rate</p>
 <p className="text-2xl font-bold mt-1">
 {pct(current.yellow_count + current.red_count, current.total_signals)}%
 </p>
 <p className="text-xs text-slate-400 mt-1">Yellow + Red</p>
 </div>
 <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
 <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Absence Rate</p>
 <p className="text-2xl font-bold mt-1">
 {pct(current.absent_count, current.total_signals)}%
 </p>
 <p className="text-xs text-slate-400 mt-1">Absent signals</p>
 </div>
 <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
 <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Active Alerts</p>
 <p className="text-2xl font-bold mt-1">{red_urgent.length}</p>
 <p className="text-xs text-slate-400 mt-1">Unresolved red</p>
 </div>
 </div>
 </div>
 )}

 {/* ─── Page Header ───────────────────────────────────────────── */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white ">Analytics</h1>
 <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
 Signal trends and insights across your classes
 </p>
 </div>
 <div className="flex items-center gap-3">
 {/* Time Window Switcher */}
 <div className="inline-flex bg-gray-100 dark:bg-[#1b1e2c] rounded-lg p-1">
 {(Object.keys(WINDOW_LABELS) as TimeWindow[]).map(w => (
 <button
 key={w}
 onClick={() => setActiveWindow(w)}
 className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
 activeWindow === w
 ? 'bg-white dark:bg-[#151722] text-gray-900 dark:text-white shadow-sm'
 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
 }`}
 >
 {WINDOW_LABELS[w]}
 </button>
 ))}
 </div>
 <button
 onClick={() => loadDashboard(true)}
 disabled={refreshing}
 className="p-2 hover:bg-gray-100 dark:bg-[#1b1e2c] rounded-lg transition-colors disabled:opacity-50"
 title="Refresh data"
 >
 <RefreshCw size={18} className={`text-gray-500 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {/* ─── Summary Cards ─────────────────────────────────────────── */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-7 xl:gap-8">
 {summaryCards.map((card, idx) => (
 <div key={idx} className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-5 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between mb-3">
 <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
 {card.icon}
 </div>
 </div>
 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
 <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 ">{card.value}</p>
 {current.total_signals > 0 && card.label !== 'Total Signals' && (
 <p className="text-xs text-gray-400 mt-1">
 {pct(card.value, current.total_signals)}% of total
 </p>
 )}
 </div>
 ))}
 </div>

 {/* ─── Quick Overview Chips ──────────────────────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
 <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-900/50 rounded-xl p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
 <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 dark:text-white ">{totalStudents}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Students</p>
 </div>
 </div>
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
 <BarChart3 className="w-5 h-5 text-blue-700 dark:blue-400" />
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 dark:text-white ">{totalClasses}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Classes Assigned</p>
 </div>
 </div>
 <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-900/50 rounded-xl p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
 <Calendar className="w-5 h-5 text-green-700 dark:text-green-400" />
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 dark:text-white ">{loggedToday}/{totalClasses}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Logged Today</p>
 </div>
 </div>
 </div>

 {/* ─── Main Charts Grid ──────────────────────────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

 {/* Signal Distribution (Horizontal Bars) */}
 <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
 <div className="p-5 border-b border-gray-100 dark:border-[#262a3d]">
 <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
 <BarChart3 className="w-4 h-4 text-gray-400" />
 Signal Distribution
 </h3>
 <p className="text-xs text-gray-400 mt-0.5">{WINDOW_LABELS[activeWindow]} — breakdown by type</p>
 </div>
 <div className="p-5 space-y-4">
 {distributionData.map((d, idx) => (
 <div key={idx} className="group">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
 <div className="flex items-center gap-2">
 <span className={`text-sm font-bold ${d.textColor}`}>{d.count}</span>
 <span className="text-xs text-gray-400">({pct(d.count, current.total_signals)}%)</span>
 </div>
 </div>
 <div className="w-full bg-gray-100 dark:bg-[#1b1e2c] rounded-full h-3 overflow-hidden">
 <div
 className={`${d.color} h-full rounded-full transition-all duration-700 ease-out`}
 style={{ width: `${(d.count / maxDistribution) * 100}%`, minWidth: d.count > 0 ? '8px' : '0' }}
 />
 </div>
 </div>
 ))}
 {current.total_signals === 0 && (
 <div className="text-center py-8 text-gray-400">
 <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
 <p className="text-sm">No signals logged in this period</p>
 </div>
 )}
 </div>
 </div>

 {/* Category Breakdown (Academic vs Behavioral) */}
 <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
 <div className="p-5 border-b border-gray-100 dark:border-[#262a3d]">
 <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
 <Activity className="w-4 h-4 text-gray-400" />
 Category Breakdown
 </h3>
 <p className="text-xs text-gray-400 mt-0.5">Academic vs. Behavioral flags</p>
 </div>
 <div className="p-5 space-y-4">
 {categoryData.map((d, idx) => (
 <div key={idx}>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
 <span>{d.icon}</span> {d.label}
 </span>
 <span className="text-sm font-bold text-gray-900 dark:text-white">{d.count}</span>
 </div>
 <div className="w-full bg-gray-100 dark:bg-[#1b1e2c] rounded-full h-3 overflow-hidden">
 <div
 className={`${d.color} h-full rounded-full transition-all duration-700 ease-out`}
 style={{ width: `${(d.count / maxCategory) * 100}%`, minWidth: d.count > 0 ? '8px' : '0' }}
 />
 </div>
 </div>
 ))}
 {(current.yellow_count + current.red_count) === 0 && (
 <div className="text-center py-8 text-gray-400">
 <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
 <p className="text-sm">No flags in this period — great job!</p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* ─── Trend Comparison Table ────────────────────────────────── */}
 <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
 <div className="p-5 border-b border-gray-100 dark:border-[#262a3d]">
 <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-gray-400" />
 Trend Comparison
 </h3>
 <p className="text-xs text-gray-400 mt-0.5">Compare signal counts across time windows</p>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-gray-50 dark:bg-[#1b1e2c]/80 border-b border-gray-200 dark:border-[#262a3d]">
 <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Metric</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-600 dark:text-gray-400">Today</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-600 dark:text-gray-400">7 Days</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-600 dark:text-gray-400">30 Days</th>
 <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">
 <span className="inline-flex items-center gap-1">
 Compared to 30-Day Average
 <span className="text-gray-400 cursor-help inline-flex items-center" title="Comparison against your monthly weekly average">
 <Info className="w-3.5 h-3.5" />
 </span>
 </span>
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
 {comparisonMetrics.map((metric, idx) => {
 const monthWeeklyAvg = Math.round((metric.month / 30) * 7);
 const trendDir = metric.week > monthWeeklyAvg ? 'up' : metric.week < monthWeeklyAvg ? 'down' : 'flat';
 const isGood = (trendDir === 'down' && metric.invertGood) || (trendDir === 'up' && !metric.invertGood);
 const isBad = (trendDir === 'up' && metric.invertGood) || (trendDir === 'down' && !metric.invertGood);
 
 const badgeColor = isGood
 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
 : isBad
 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
 : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
 const textColor = isGood
 ? 'text-emerald-600 dark:text-emerald-400'
 : isBad
 ? 'text-rose-600 dark:text-rose-400'
 : 'text-gray-600 dark:text-gray-400';
 
 const diff = Math.abs(metric.week - monthWeeklyAvg);
 
 let titleText = 'On par with your average';
 let descText = 'Your count is consistent with your monthly average.';
 if (trendDir === 'down') {
 titleText = diff > 0 ? `${diff} fewer than your average` : 'Fewer than your average';
 descText = metric.fewerText;
 } else if (trendDir === 'up') {
 titleText = diff > 0 ? `${diff} more than your average` : 'More than your average';
 descText = metric.moreText;
 }

 return (
 <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-[#1b1e2c] transition">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3.5">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${metric.iconBg}`}>
 {metric.icon}
 </div>
 <div>
 <p className="font-bold text-gray-900 dark:text-white text-base">{metric.label}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">{metric.subtitle}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 font-medium text-base">{metric.today}</td>
 <td className="px-6 py-4 text-center font-extrabold text-gray-900 dark:text-white text-base">{metric.week}</td>
 <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 font-medium text-base">{metric.month}</td>
 <td className="px-6 py-4">
 <div className="flex items-start gap-2.5">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${badgeColor}`}>
 {trendDir === 'up' && <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />}
 {trendDir === 'down' && <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />}
 {trendDir === 'flat' && <Minus className="w-3.5 h-3.5 stroke-[2.5]" />}
 </div>
 <div>
 <p className={`font-bold text-sm leading-snug ${textColor}`}>{titleText}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{descText}</p>
 </div>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── Recent Recognition Highlights ────────────────────────────── */}
 <div className="mt-6">
 <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden flex flex-col">
 <div className="p-5 border-b border-gray-100 dark:border-[#262a3d] flex items-center justify-between">
 <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
 <Sparkles className="text-emerald-500 w-5 h-5" /> Recent Recognition Highlights
 </h3>
 </div>
 
 <div className="p-5 flex-1 max-h-[300px] overflow-y-auto">
 {recognitions.length === 0 ? (
 <div className="text-center py-8">
 <div className="w-12 h-12 bg-gray-50 dark:bg-[#1a1c29] rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-200 dark:border-gray-800">
 <Award size={24} className="text-emerald-500 opacity-60" />
 </div>
 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 ">No recognitions found</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">Award Super Green signals to your students to see them celebrated here.</p>
 </div>
 ) : (
 <div className="space-y-4 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900/50">
 {recognitions.slice(0, 5).map((rec, idx) => (
 <div key={idx} className="relative flex items-start pl-8">
 <div className="absolute left-3 -translate-x-1/2 mt-1.5 w-3 h-3 rounded-full bg-emerald-500 border-[2.5px] border-white dark:border-[#151722] z-10"></div>
 <div className="w-full">
 <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">
 <Calendar size={10} strokeWidth={2.5} />
 {new Date(rec.signal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
 </div>
 <div className="bg-white dark:bg-[#1a1c29] p-3 rounded-lg border border-gray-100 dark:border-[#2a2e42] shadow-sm">
 <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 ">
 {rec.student_first_name} {rec.student_last_name}
 </p>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 {rec.class_name} {rec.reason_code ? `• ${rec.reason_code}` : ''}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
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

 {templateModalData && (
 <ParentEmailTemplateModal
 isOpen={!!templateModalData}
 onClose={() => setTemplateModalData(null)}
 studentName={templateModalData.studentName}
 teacherName={user?.first_name ? `${user.first_name} ${user.last_name}` : 'Teacher'}
 flagCategory={templateModalData.flagCategory}
 reason={templateModalData.reason}
 studentId={templateModalData.studentId}
 classId={templateModalData.classId}
 recentFlags={templateModalData.recentFlags}
 />
 )}
 </div>
 );
}
