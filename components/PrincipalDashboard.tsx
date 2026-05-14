'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Zap, Shield,
  AlertCircle, RefreshCw, Sparkles, ChevronRight, Clock, X, FileText,
  Users, Activity,
} from 'lucide-react';
import {
  getAdminDashboard, getAdminHeatmap, resolvePatternAlert,
  AdminDashboardResponse, HeatmapBlock, HeatmapBand,
} from '@/lib/adminDashboardService';

// ─── Helpers ──────────────────────────────────────────────────────

const bandColors: Record<HeatmapBand, { bg: string; border: string; badge: string; text: string }> = {
  red:     { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-500',    text: 'text-red-700' },
  orange:  { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700' },
  yellow:  { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700' },
  green:   { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-500',  text: 'text-green-700' },
  no_data: { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-400',   text: 'text-gray-500' },
};

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-blue-100 text-blue-700 border-blue-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────

export default function PrincipalDashboard() {
  const router = useRouter();
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Resolve alert modal
  const [resolveAlertId, setResolveAlertId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const [dashData, heatData] = await Promise.all([
        getAdminDashboard(range),
        getAdminHeatmap(range),
      ]);
      setDashboard(dashData);
      setHeatmap(heatData);
    } catch (err: any) {
      console.error('Admin dashboard fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResolve = async () => {
    if (!resolveAlertId || !resolveNote.trim()) return;
    try {
      setResolving(true);
      await resolvePatternAlert(resolveAlertId, resolveNote);
      setResolveAlertId(null);
      setResolveNote('');
      fetchData(true);
    } catch (err: any) {
      console.error('Resolve failed:', err);
    } finally {
      setResolving(false);
    }
  };

  const kpis = dashboard?.kpis;
  const totalClasses = heatmap?.grade_buckets?.reduce((s, b) => s + b.tiles.length, 0) ?? 0;

  // ─── Loading Skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 font-semibold text-lg mb-2">Unable to load dashboard</p>
        <p className="text-gray-500 text-sm mb-6 max-w-md text-center">{error}</p>
        <button onClick={() => fetchData()} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: slideUp 0.4s ease-out forwards; opacity:0; }
        .fade-up:nth-child(1){animation-delay:.05s} .fade-up:nth-child(2){animation-delay:.1s}
        .fade-up:nth-child(3){animation-delay:.15s} .fade-up:nth-child(4){animation-delay:.2s}
        .fade-up:nth-child(5){animation-delay:.25s} .fade-up:nth-child(6){animation-delay:.3s}
      `}</style>

      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
            School Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            {dashboard?.school?.name || 'School Overview'} — {range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${range === r ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Monday Red Flag Overlay ─────────────────────────────── */}
      {dashboard?.monday_red_flag?.active && (
        <div className="bg-gradient-to-r from-red-50 via-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={22} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-lg">Monday Red Flag Brief</h3>
              <p className="text-red-600 text-sm">
                {dashboard.monday_red_flag.unresolved_critical_count} critical · {dashboard.monday_red_flag.unresolved_high_count} high priority alerts from last week
              </p>
            </div>
          </div>
          {dashboard.monday_red_flag.top_students.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {dashboard.monday_red_flag.top_students.map(s => (
                <div key={s.student_id} className="bg-white rounded-lg p-3 border border-red-100 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/principal-students/${s.student_id}`)}>
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-red-600">{s.critical_alert_count} critical · {s.high_alert_count} high</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KPI Stats Cards ─────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Yellow Flags', value: kpis.yellow_total, icon: Zap, color: 'yellow', border: 'border-yellow-200' },
            { label: 'Red Flags', value: kpis.red_total, icon: AlertTriangle, color: 'red', border: 'border-red-200' },
            { label: 'Super Green', value: kpis.super_green_total, icon: Sparkles, color: 'emerald', border: 'border-emerald-200' },
            { label: 'Absent', value: kpis.absent_total, icon: Clock, color: 'gray', border: 'border-gray-200' },
            { label: 'Unresolved Alerts', value: kpis.unresolved_alerts_total, icon: AlertCircle, color: 'orange', border: 'border-orange-200' },
            { label: 'Open Referrals', value: kpis.open_referrals_total, icon: FileText, color: 'blue', border: 'border-blue-200' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`fade-up bg-white rounded-xl border ${card.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">{card.label}</p>
                  <Icon size={18} className={`text-${card.color}-400`} />
                </div>
                <p className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── School Heat Map ─────────────────────────────────────── */}
      {heatmap && heatmap.grade_buckets.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Sora' }}>Classroom Heat Map</h2>
              <span className="text-sm text-gray-500 font-medium">{totalClasses} classes</span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs">
              {(['green','yellow','orange','red'] as HeatmapBand[]).map(b => (
                <div key={b} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${bandColors[b].badge}`} />
                  <span className="text-gray-600 capitalize">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {heatmap.grade_buckets.map(bucket => (
            <div key={bucket.grade_level}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora' }}>
                  Grade {bucket.grade_level}
                </h3>
                <span className="text-sm text-gray-500">{bucket.tiles.length} classes</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bucket.tiles.map(tile => {
                  const c = bandColors[tile.band];
                  return (
                    <div key={tile.class_id}
                      onClick={() => router.push(`/principal-classes/${tile.class_id}`)}
                      className={`fade-up ${c.bg} border-2 ${c.border} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{tile.class_name}</h4>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {tile.teacher_first_name} {tile.teacher_last_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {tile.has_unresolved_high_critical && (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title="Unresolved high/critical alert" />
                          )}
                          {tile.has_observation_flag && (
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" title="Teacher observation flag" />
                          )}
                          <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.badge} text-white`}>
                            {tile.band === 'no_data' ? '—' : `${Math.round((tile.flag_percentage || 0) * 100)}%`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={c.text}><Users size={14} className="inline mr-1" />{tile.active_enrollments} students</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center gap-4 text-sm">
                        {tile.red_count > 0 && <span className="text-red-700 font-semibold">🔴 {tile.red_count} red</span>}
                        {tile.yellow_count > 0 && <span className="text-yellow-700 font-semibold">🟡 {tile.yellow_count} yellow</span>}
                        {tile.red_count === 0 && tile.yellow_count === 0 && <span className="text-green-700 font-semibold">✓ All clear</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Urgent Alerts ───────────────────────────────────────── */}
      {dashboard && dashboard.urgent_alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="text-lg font-bold text-gray-900">Urgent Alerts</h3>
            <span className="ml-auto text-sm text-gray-500">{dashboard.urgent_alerts.length} unresolved</span>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.urgent_alerts.map(alert => (
              <div key={alert.alert_id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${severityStyles[alert.severity] || severityStyles.medium}`}>
                  {alert.severity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {alert.student.first_name} {alert.student.last_name}
                    <span className="font-normal text-gray-500 ml-2">Grade {alert.student.grade_level}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.rule_description}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(alert.triggered_at)}</span>
                <button onClick={() => router.push(`/principal-students/${alert.student.student_id}`)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">View</button>
                <button onClick={() => { setResolveAlertId(alert.alert_id); setResolveNote(''); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">Resolve</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-Column: Teacher Flags + Recommendations ──────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Teacher Observation Flags */}
        {dashboard && dashboard.pending_teacher_flags.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center gap-2 bg-amber-50">
              <Shield size={18} className="text-amber-600" />
              <h3 className="font-bold text-gray-900 text-sm">Teacher Observation Flags</h3>
              <span className="ml-auto text-xs text-amber-700 font-medium">{dashboard.pending_teacher_flags.length} pending</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {dashboard.pending_teacher_flags.map(flag => (
                <div key={flag.flag_id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">{flag.class_name}</p>
                    <span className="text-xs text-gray-400">{timeAgo(flag.triggered_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {flag.teacher_first_name} {flag.teacher_last_name} · Grade {flag.grade_level}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-yellow-700">🟡 {flag.yellow_count}</span>
                    <span className="text-red-700">🔴 {flag.red_count}</span>
                    <span className="text-gray-500">{Math.round(flag.threshold_percentage * 100)}% threshold</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {dashboard && dashboard.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {dashboard.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <Activity size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Resolve Alert Modal ──────────────────────────────── */}
      {resolveAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Resolve Alert</h3>
              <button onClick={() => setResolveAlertId(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Describe how this alert was resolved:</p>
            <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} rows={4} placeholder="e.g. Met with student and parent; remediation plan in place."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setResolveAlertId(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleResolve} disabled={resolving || !resolveNote.trim()}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {resolving ? 'Resolving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
