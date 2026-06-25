'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, AlertCircle, TrendingUp, TrendingDown,
  BarChart3, Activity, Users, Calendar, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { getMultiWindowStats, SignalStats } from '@/lib/analyticsService';
import { getTeacherDashboard, TeacherDashboardResponse } from '@/lib/dashboardService';

type TimeWindow = 'today' | 'week' | 'month';

const WINDOW_LABELS: Record<TimeWindow, string> = {
  today: 'Today',
  week: 'This Week',
  month: '30 Days',
};

// ─── Helpers ────────────────────────────────────────────────────────

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ─── Component ──────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [stats, setStats] = useState<{ today: SignalStats; week: SignalStats; month: SignalStats } | null>(null);
  const [dashboardData, setDashboardData] = useState<TeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWindow, setActiveWindow] = useState<TimeWindow>('today');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsData, dashData] = await Promise.all([
        getMultiWindowStats(),
        getTeacherDashboard(),
      ]);
      setStats(statsData);
      setDashboardData(dashData);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err?.response?.data?.detail || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
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
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-[#262a3d] p-6">
              <div className="skeleton h-4 w-2/3 mb-3" />
              <div className="skeleton h-8 w-1/3 mb-2" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-[#262a3d] p-6">
              <div className="skeleton h-5 w-1/3 mb-4" />
              <div className="skeleton h-48 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────
  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load analytics</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center max-w-md">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (!stats || !dashboardData) return null;

  const current = stats[activeWindow];
  const { kpis, yellow_watch_list, red_urgent, super_green_highlights, classes } = dashboardData;

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
    { label: 'Yellow Academic', count: current.yellow_academic_count, color: 'bg-blue-400', icon: '📘' },
    { label: 'Yellow Behavioral', count: current.yellow_behavioral_count, color: 'bg-purple-400', icon: '📙' },
    { label: 'Red Academic', count: current.red_academic_count, color: 'bg-orange-500', icon: '🔴' },
    { label: 'Red Behavioral', count: current.red_behavioral_count, color: 'bg-rose-500', icon: '⛔' },
  ];
  const maxCategory = Math.max(...categoryData.map(d => d.count), 1);

  // ─── Cross-window comparison ──────────────────────────────────────
  const comparisonMetrics = [
    {
      label: 'Yellow Flags',
      today: stats.today.yellow_count,
      week: stats.week.yellow_count,
      month: stats.month.yellow_count,
      invertGood: true,
    },
    {
      label: 'Red Flags',
      today: stats.today.red_count,
      week: stats.week.red_count,
      month: stats.month.red_count,
      invertGood: true,
    },
    {
      label: 'Super Greens',
      today: stats.today.super_green_count,
      week: stats.week.super_green_count,
      month: stats.month.super_green_count,
      invertGood: false,
    },
    {
      label: 'Absent',
      today: stats.today.absent_count,
      week: stats.week.absent_count,
      month: stats.month.absent_count,
      invertGood: true,
    },
  ];

  // ─── Class logging stats ──────────────────────────────────────────
  const totalClasses = classes.length;
  const loggedToday = classes.filter(c => c.logged_today).length;
  const totalStudents = classes.reduce((sum, c) => sum + c.student_count_active, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
      `}</style>

      {refreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-lg text-sm">
          <RefreshCw size={14} className="animate-spin" /> Refreshing...
        </div>
      )}
      {/* ─── Signal Health Summary (top of page) ────────────────── */}
      {current.total_signals > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-base font-bold font-sora mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Signal Health Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Engagement Rate</p>
              <p className="text-2xl font-bold font-sora mt-1">
                {pct(current.super_green_count + current.present_count, current.total_signals)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Green + Present</p>
            </div>
            <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Concern Rate</p>
              <p className="text-2xl font-bold font-sora mt-1">
                {pct(current.yellow_count + current.red_count, current.total_signals)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Yellow + Red</p>
            </div>
            <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Absence Rate</p>
              <p className="text-2xl font-bold font-sora mt-1">
                {pct(current.absent_count, current.total_signals)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Absent signals</p>
            </div>
            <div className="bg-white/10 dark:bg-black/20 rounded-lg p-4">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Active Alerts</p>
              <p className="text-2xl font-bold font-sora mt-1">{red_urgent.length}</p>
              <p className="text-xs text-slate-400 mt-1">Unresolved red</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sora">Analytics</h1>
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
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:bg-[#1b1e2c] rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={`text-gray-500 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 font-sora">{card.value}</p>
            {current.total_signals > 0 && card.label !== 'Total Signals' && (
              <p className="text-xs text-gray-400 mt-1">
                {pct(card.value, current.total_signals)}% of total
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ─── Quick Overview Chips ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-900/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-sora">{totalStudents}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Students</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-sora">{totalClasses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Classes Assigned</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-900/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-700 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-sora">{loggedToday}/{totalClasses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Logged Today</p>
          </div>
        </div>
      </div>

      {/* ─── Main Charts Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Signal Distribution (Horizontal Bars) */}
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-[#262a3d]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-sora flex items-center gap-2">
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-sora flex items-center gap-2">
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white font-sora flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Trend Comparison
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Compare signal counts across time windows</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1b1e2c]/80">
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600 dark:text-gray-400">Metric</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-400">Today</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-400">7 Days</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-400">30 Days</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-400">Trend (7d vs 30d avg)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map((metric, idx) => {
                const monthWeeklyAvg = Math.round(metric.month / 4.3);
                const trendDir = metric.week > monthWeeklyAvg ? 'up' : metric.week < monthWeeklyAvg ? 'down' : 'flat';
                const trendClass = trendDir === 'flat'
                  ? 'text-gray-400'
                  : (trendDir === 'up' && metric.invertGood) || (trendDir === 'down' && !metric.invertGood)
                    ? 'text-red-500'
                    : 'text-green-500';
                const trendLabel = trendDir === 'up' ? 'Above avg' : trendDir === 'down' ? 'Below avg' : 'On par';

                return (
                  <tr key={idx} className="border-b border-gray-100 dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{metric.label}</td>
                    <td className="px-5 py-3.5 text-center text-gray-600 dark:text-gray-400">{metric.today}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-900 dark:text-white">{metric.week}</td>
                    <td className="px-5 py-3.5 text-center text-gray-600 dark:text-gray-400">{metric.month}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendClass}`}>
                        {trendDir === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {trendDir === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {trendDir === 'flat' && <Minus className="w-3.5 h-3.5" />}
                        {trendLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Bottom Grid: Watch list + Class Status ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Yellow Watch List Summary */}
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-[#262a3d] flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-sora">🟡 Yellow Watch List</h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{yellow_watch_list.length}</span>
          </div>
          {yellow_watch_list.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {yellow_watch_list.slice(0, 8).map(row => (
                <div key={row.student_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{row.first_name} {row.last_name}</p>
                    <p className="text-xs text-gray-400">Gr {row.grade_level} — Acd: {row.yellow_academic_count} / Beh: {row.yellow_behavioral_count}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-600 font-sora">{row.yellow_total}</span>
                    {row.unresolved_alert_max_severity && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-bold uppercase">{row.unresolved_alert_max_severity}</span>
                    )}
                  </div>
                </div>
              ))}
              {yellow_watch_list.length > 8 && (
                <div className="px-5 py-3 text-center text-xs text-gray-400 font-medium">
                  +{yellow_watch_list.length - 8} more students on watch list
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="text-sm">No students on the watch list!</p>
            </div>
          )}
        </div>

        {/* Class Logging Completion */}
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-[#262a3d] flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-sora">📋 Today&apos;s Logging Status</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              loggedToday === totalClasses
                ? 'text-green-700 bg-green-100'
                : 'text-amber-700 bg-amber-100'
            }`}>{loggedToday}/{totalClasses}</span>
          </div>
          {classes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {classes.map(c => (
                <div key={c.class_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{c.class_name}</p>
                    <p className="text-xs text-gray-400">{c.student_count_active} students</p>
                  </div>
                  {c.logged_today ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      ✓ Logged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-[#1b1e2c] px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No classes assigned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
