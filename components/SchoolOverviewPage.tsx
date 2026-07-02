'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, Eye, DownloadCloud, RefreshCw, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { getAdminTrends, AdminTrendsBlock } from '@/lib/adminDashboardService';

export default function SchoolOverviewPage() {
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [trends, setTrends] = useState<AdminTrendsBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await getAdminTrends(range);
      setTrends(data);
    } catch (err: any) {
      console.error('Trends fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load trends data.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white dark:text-white font-semibold text-lg mb-2">Unable to load trends</p>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => fetchData()} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">Try Again</button>
      </div>
    );
  }

  const daily = trends?.daily || [];
  const weekly = trends?.weekly_flag_accumulation || [];
  const attendance = trends?.attendance_trend || [];
  const maxDailyTotal = Math.max(1, ...daily.map(d => d.yellow + d.red + d.absent));
  const maxAbsent = Math.max(1, ...attendance.map(a => a.absent_count));
  const totalFlags = daily.reduce((s, d) => s + d.yellow + d.red, 0);
  const totalAbsent = daily.reduce((s, d) => s + d.absent, 0);
  const totalSuperGreen = daily.reduce((s, d) => s + d.super_green, 0);

  return (
    <div className="space-y-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/principal-dashboard" className="p-2 text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg transition"><ArrowLeft size={20} /></Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontFamily: 'Playfair Display' }}>School Trends</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg p-1">
            {(['1d', '7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${range === r ? 'bg-white dark:bg-[#151722] dark:bg-[#151722] text-teal-700 shadow-sm' : 'text-gray-600 dark:text-gray-400 dark:text-gray-400'}`}>
                {r === '1d' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg transition disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase">Total Flags</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mt-1">{totalFlags}</p>
        </div>
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-amber-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase">Yellow</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{daily.reduce((s, d) => s + d.yellow, 0)}</p>
        </div>
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-red-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase">Red</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{daily.reduce((s, d) => s + d.red, 0)}</p>
        </div>
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-emerald-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase">Super Green</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalSuperGreen}</p>
        </div>
      </div>

      {/* Daily Stacked Bar Chart */}
      <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Daily Signal Breakdown</h2>
        <div className="flex items-end gap-1 h-48 mb-4">
          {daily.map((d, i) => {
            const total = d.yellow + d.red + d.absent;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default"
                title={`${d.date}: Y${d.yellow} R${d.red} A${d.absent} SG${d.super_green}`}>
                <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                  {d.red > 0 && <div className="bg-red-500 rounded-t-sm w-full transition-all group-hover:opacity-80" style={{ height: `${(d.red / maxDailyTotal) * 100}%`, minHeight: '2px' }} />}
                  {d.yellow > 0 && <div className="bg-amber-400 w-full transition-all group-hover:opacity-80" style={{ height: `${(d.yellow / maxDailyTotal) * 100}%`, minHeight: '2px' }} />}
                  {d.absent > 0 && <div className="bg-slate-300 rounded-b-sm w-full transition-all group-hover:opacity-80" style={{ height: `${(d.absent / maxDailyTotal) * 100}%`, minHeight: '2px' }} />}
                  {total === 0 && <div className="bg-emerald-400 rounded-sm w-full" style={{ height: '2px' }} />}
                </div>
                <div className="h-4 flex items-center justify-center">
                  {(range === '1d' || i % (range === '7d' ? 1 : 5) === 0) ? (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 whitespace-nowrap">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  ) : (
                    <span className="text-[10px] opacity-0 pointer-events-none select-none">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 justify-center pt-3 border-t border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"><span className="w-3 h-3 bg-red-500 rounded-full" />Red</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"><span className="w-3 h-3 bg-amber-400 rounded-full" />Yellow</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"><span className="w-3 h-3 bg-slate-300 rounded-full" />Absent</span>
        </div>
      </div>

      {/* Attendance Trend */}
      {attendance.length > 0 && (
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Attendance Trend (Absences)</h2>
          <div className="flex items-end gap-1 h-32">
            {attendance.map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group"
                title={`${a.date}: ${a.absent_count} absent`}>
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full rounded-t-sm transition-all group-hover:opacity-80 ${a.absent_count > 0 ? 'bg-orange-500' : 'bg-emerald-400'}`}
                    style={{ height: a.absent_count > 0 ? `${Math.max(4, (a.absent_count / maxAbsent) * 100)}%` : '2px' }} />
                </div>
                <div className="h-4 flex items-center justify-center">
                  {(range === '1d' || i % (range === '7d' ? 1 : 5) === 0) ? (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 whitespace-nowrap">{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  ) : (
                    <span className="text-[10px] opacity-0 pointer-events-none select-none">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-3">Total absences in period: <span className="font-bold text-gray-900 dark:text-white dark:text-white">{totalAbsent}</span></p>
        </div>
      )}

      {/* Weekly Flag Accumulation Table */}
      {weekly.length > 0 && (
        <div className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">Weekly Flag Accumulation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Week Of</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Yellow Academic</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Yellow Behavioral</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Red Academic</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Red Behavioral</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white dark:text-white uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w, i) => {
                  const total = w.yellow_academic + w.yellow_behavioral + w.red_academic + w.red_behavioral;
                  return (
                    <tr key={i} className="border-b border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                        {new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">🟡 {w.yellow_academic}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">🟡 {w.yellow_behavioral}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">🔴 {w.red_academic}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">🔴 {w.red_behavioral}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white dark:text-white">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
