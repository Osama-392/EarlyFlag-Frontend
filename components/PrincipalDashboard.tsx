'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Zap, Shield,
  AlertCircle, RefreshCw, Sparkles, ChevronRight, Clock, X, FileText,
  Users, Activity, User, Star, ClipboardList, Building2, Palette, BookOpen,
  Landmark, Calculator, FlaskConical, ArrowUp, ArrowDown, Minus, Info, Globe,
  BookMarked, Languages, Music, Code
} from 'lucide-react';
import {
  getAdminDashboard, getAdminHeatmap,
  AdminDashboardResponse, HeatmapBlock, HeatmapBand,
} from '@/lib/adminDashboardService';
import { getPendingTeachers } from '@/lib/adminService';
import { useAuth } from '@/app/providers';
import GoodMorningBanner from '@/components/GoodMorningBanner';

// ─── Predefined Subjects (from Create Class dropdown) ─────────────
const PREDEFINED_SUBJECTS = [
  'Math',
  'Language arts',
  'Science',
  'Social studies',
  'Religion',
  'Spanish',
  'PE',
  'Art',
  'Music',
  'Technology',
];

// ─── Helpers ──────────────────────────────────────────────────────

const bandColors: Record<HeatmapBand, { bg: string; border: string; badge: string; text: string }> = {
  red: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/50', badge: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-900/50', badge: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-900/50', badge: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-900/50', badge: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  no_data: { bg: 'bg-gray-50 dark:bg-[#1b1e2c]', border: 'border-gray-200 dark:border-[#262a3d]', badge: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' },
};

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const getDepartmentBadge = (name: string) => {
  const lower = name.toLowerCase().trim();
  if (lower.includes('art')) {
    return { icon: <Palette className="w-5 h-5 text-[#fb923c]" />, bg: 'bg-[#ffedd5] dark:bg-orange-950/40' };
  }
  if (lower.includes('english') || lower.includes('lit') || lower.includes('reading') || lower.includes('lang') || lower.includes('writing')) {
    return { icon: <BookOpen className="w-5 h-5 text-[#3b82f6]" />, bg: 'bg-[#eff6ff] dark:bg-blue-950/40' };
  }
  if (lower.includes('general') || lower.includes('hist') || lower.includes('social') || lower.includes('human') || lower.includes('civic') || lower.includes('geog')) {
    return { icon: <Globe className="w-5 h-5 text-[#f97316]" />, bg: 'bg-[#ffedd5] dark:bg-orange-950/40' };
  }
  if (lower.includes('math') || lower.includes('alg') || lower.includes('calc') || lower.includes('geom')) {
    return { icon: <Calculator className="w-5 h-5 text-[#10b981]" />, bg: 'bg-[#ecfdf5] dark:bg-emerald-950/40' };
  }
  if (lower.includes('scien') || lower.includes('bio') || lower.includes('chem') || lower.includes('phys') && !lower.includes('pe')) {
    return { icon: <FlaskConical className="w-5 h-5 text-[#a855f7]" />, bg: 'bg-[#faf5ff] dark:bg-purple-950/40' };
  }
  if (lower.includes('relig') || lower.includes('theo') || lower.includes('bib') || lower.includes('faith')) {
    return { icon: <BookMarked className="w-5 h-5 text-[#f43f5e]" />, bg: 'bg-[#ffe4e6] dark:bg-rose-950/40' };
  }
  if (lower.includes('span') || lower.includes('french') || lower.includes('latin') || lower.includes('foreign')) {
    return { icon: <Languages className="w-5 h-5 text-[#0d9488]" />, bg: 'bg-[#f0fdf4] dark:bg-teal-950/40' };
  }
  if (lower === 'pe' || lower.includes('physical') || lower.includes('gym') || lower.includes('health') || lower.includes('sport')) {
    return { icon: <Activity className="w-5 h-5 text-[#6366f1]" />, bg: 'bg-[#e0e7ff] dark:bg-indigo-950/40' };
  }
  if (lower.includes('music') || lower.includes('band') || lower.includes('choir') || lower.includes('orch')) {
    return { icon: <Music className="w-5 h-5 text-[#ef4444]" />, bg: 'bg-[#fef2f2] dark:bg-red-950/40' };
  }
  if (lower.includes('tech') || lower.includes('comp') || lower.includes('code') || lower.includes('robot')) {
    return { icon: <Code className="w-5 h-5 text-[#8b5cf6]" />, bg: 'bg-[#ede9fe] dark:bg-violet-950/40' };
  }
  return { icon: <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />, bg: 'bg-gray-100 dark:bg-[#1b1e2c]' };
};

// ─── Component ────────────────────────────────────────────────────

export default function PrincipalDashboard() {
  const router = useRouter();
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [activeTab, setActiveTab] = useState<string>('All Subjects');
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);



  // Pending teachers state
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const { user } = useAuth();

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const [dashData, heatData, pendingData] = await Promise.all([
        getAdminDashboard(range),
        getAdminHeatmap(range),
        getPendingTeachers().catch(() => []),
      ]);
      setDashboard(dashData);
      setHeatmap(heatData);
      setPendingCount(pendingData.length);
      setShowPendingAlert(pendingData.length > 0);
    } catch (err: any) {
      console.error('Admin dashboard fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);



  const kpis = dashboard?.kpis;
  const allTiles = heatmap?.grade_buckets?.flatMap(b => b.tiles) || [];
  const totalClasses = allTiles.length;

  // Only display the predefined subjects created in the Create Class dropdown
  const dynamicTabs = ['All Subjects', ...PREDEFINED_SUBJECTS];

  const filteredTiles = activeTab === 'All Subjects'
    ? allTiles
    : allTiles.filter(t => {
        if (!t.subject) return false;
        if (t.subject === activeTab) return true;
        const subLower = t.subject.toLowerCase().trim();
        const tabLower = activeTab.toLowerCase().trim();
        if (tabLower === 'language arts' && (subLower.includes('english') || subLower.includes('reading') || subLower.includes('lit') || subLower.includes('lang') || subLower.includes('writing'))) return true;
        if (tabLower === 'social studies' && (subLower.includes('social') || subLower.includes('history') || subLower.includes('human') || subLower.includes('geog') || subLower.includes('civic') || subLower.includes('general'))) return true;
        if (tabLower === 'pe' && (subLower.includes('pe') || subLower.includes('physical') || subLower.includes('gym') || subLower.includes('health') || subLower.includes('sport'))) return true;
        if (tabLower === 'technology' && (subLower.includes('tech') || subLower.includes('comp') || subLower.includes('code') || subLower.includes('robot'))) return true;
        if (tabLower === 'religion' && (subLower.includes('relig') || subLower.includes('theo') || subLower.includes('bib') || subLower.includes('faith'))) return true;
        if (tabLower === 'spanish' && (subLower.includes('span') || subLower.includes('lang') || subLower.includes('french') || subLower.includes('latin') || subLower.includes('foreign'))) return true;
        if (tabLower === 'math' && (subLower.includes('math') || subLower.includes('alg') || subLower.includes('calc') || subLower.includes('geom'))) return true;
        if (tabLower === 'science' && (subLower.includes('scien') || subLower.includes('bio') || subLower.includes('chem') || subLower.includes('phys') && !subLower.includes('pe'))) return true;
        return subLower === tabLower;
      });

  const displayedTiles = showAllClasses ? filteredTiles : filteredTiles.slice(0, 9);

  // ─── Loading Skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Unable to load dashboard</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md text-center">{error}</p>
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

      {/* Good Morning Banner */}
      <GoodMorningBanner 
        name={user?.first_name || 'Admin'}
        metric1={<>You have <span className="text-orange-600 dark:text-orange-500 font-bold">{dashboard?.urgent_alerts?.length || 0}</span> urgent alerts needing attention</>}
        metric2={<><span className="text-emerald-600 dark:text-emerald-500 font-bold">{dashboard?.kpis?.super_green_total || 0}</span> students showing exceptional growth school-wide</>}
        metric3={<><span className="text-orange-600 dark:text-orange-500 font-bold">{dashboard?.pending_teacher_flags?.length || 0}</span> teacher observation flag{dashboard?.pending_teacher_flags?.length !== 1 ? 's' : ''} to review</>}
        recommendation={dashboard?.recommendations?.[0]}
      />

      {/* Pending Teachers Approval Notification Bar */}
      {showPendingAlert && pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Teacher approvals pending
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                There {pendingCount === 1 ? 'is 1 teacher' : `are ${pendingCount} teachers`} waiting for your approval.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/principal-teachers?tab=pending')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition"
            >
              Review Requests
            </button>
            <button
              onClick={() => setShowPendingAlert(false)}
              className="p-1 hover:bg-amber-100 rounded-lg text-amber-700 transition"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Playfair Display' }}>
            School Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {dashboard?.school?.name || 'School Overview'} — {range === '1d' ? 'Today' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-[#1b1e2c] rounded-lg p-1">
            {(['1d', '7d', '30d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${range === r ? 'bg-white dark:bg-[#151722] text-teal-700 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white dark:text-white'}`}>
                {r === '1d' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#1b1e2c] rounded-lg transition disabled:opacity-50">
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
                <div key={s.student_id} className="bg-white dark:bg-[#151722] rounded-lg p-3 border border-red-100 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/principal-students/${s.student_id}`)}>
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.first_name} {s.last_name}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Yellow Flags', value: kpis.yellow_total, icon: Zap, color: 'yellow', border: 'border-yellow-200' },
            { label: 'Red Flags', value: kpis.red_total, icon: AlertTriangle, color: 'red', border: 'border-red-200' },
            { label: 'Super Green', value: kpis.super_green_total, icon: Sparkles, color: 'emerald', border: 'border-emerald-200' },
            { label: 'Absent', value: kpis.absent_total, icon: Clock, color: 'gray', border: 'border-gray-200 dark:border-[#262a3d]' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`fade-up bg-white dark:bg-[#151722] rounded-xl border ${card.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">{card.label}</p>
                  <Icon size={18} className={`text-${card.color}-400`} />
                </div>
                <p className={`text-2xl font-bold text-${card.color}-600`}>{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── School Heat Map & Department Overview ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7">
          {heatmap && allTiles.length > 0 && (
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Sora' }}>School Wide Heat Map</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{totalClasses} classes</span>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs">
                  {(['green', 'yellow', 'red'] as HeatmapBand[]).map(b => (
                    <div key={b} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${bandColors[b].badge}`} />
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-gray-200 dark:border-[#262a3d] mb-6 pb-0">
                {dynamicTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white dark:text-white'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedTiles.map(tile => {
                  const c = bandColors[tile.band];
                  return (
                    <div key={tile.class_id}
                      onClick={() => router.push(`/principal-classes/${tile.class_id}`)}
                      className={`fade-up ${c.bg} border-2 ${c.border} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">{tile.class_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
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
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#262a3d]/60 flex items-center gap-4 text-sm">
                        {tile.red_count > 0 && <span className="text-red-700 font-semibold">🔴 {tile.red_count} red</span>}
                        {tile.yellow_count > 0 && <span className="text-yellow-700 font-semibold">🟡 {tile.yellow_count} yellow</span>}
                        {tile.red_count === 0 && tile.yellow_count === 0 && <span className="text-green-700 font-semibold">✓ All clear</span>}
                      </div>
                    </div>
                  );
                })}

                {filteredTiles.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                    No classes found for {activeTab}.
                  </div>
                )}
              </div>

              {filteredTiles.length > 9 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAllClasses(!showAllClasses)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white dark:text-white transition flex items-center justify-center gap-1 mx-auto"
                  >
                    {showAllClasses ? 'View Less Classes' : 'View More Classes'}
                    <ChevronRight size={14} className={showAllClasses ? "-rotate-90" : "rotate-90"} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {/* ── Department Overview ────────────────────────────────── */}
          {dashboard && dashboard.departments && dashboard.departments.length > 0 && (() => {
            const deptData = dashboard.departments.map(dept => {
              const totalFlags = dept.red_count + dept.yellow_count + dept.super_green_count;
              const riskScore = totalFlags > 0
                ? Math.round(((dept.red_count + dept.yellow_count) / totalFlags) * 100)
                : 0;

              let barColor = 'bg-[#facc15]';
              if (riskScore === 0) {
                barColor = 'bg-gray-200 dark:bg-gray-700';
              } else if (riskScore <= 50 || (dept.trend_value !== null && dept.trend_value < 0 && riskScore < 60)) {
                barColor = 'bg-[#10b981]';
              } else if (riskScore >= 80) {
                barColor = 'bg-[#ef4444]';
              }

              const badge = getDepartmentBadge(dept.department_name);
              return { ...dept, riskScore, barColor, badge };
            });

            return (
              <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 md:p-8">
                {/* Header Section */}
                <div className="flex items-center gap-3.5 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Department Overview</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monitor overall risk across departments.</p>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 dark:text-gray-400 text-[11px] font-bold border-b border-gray-100 dark:border-[#262a3d] uppercase tracking-wider">
                        <th className="pb-4 pl-1" style={{ width: '28%' }}>DEPARTMENT</th>
                        <th className="pb-4" style={{ width: '34%' }}>RISK SCORE</th>
                        <th className="pb-4 text-right pr-1" style={{ width: '38%' }}>
                          <span className="inline-flex items-center gap-1 justify-end">
                            STATUS (VS 30D) <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#262a3d]/60">
                      {deptData.map(dept => {
                        let badgeIcon = <Minus className="w-4 h-4 stroke-[2.5]" />;
                        let statusColorClass = "text-gray-700 dark:text-gray-300";
                        let subTextColorClass = "text-gray-500 dark:text-gray-400";
                        let statusBgClass = "bg-gray-100 dark:bg-[#1b1e2c] text-gray-500 dark:text-gray-400";
                        let titleText = "No change";
                        let subText = "vs last 30d";

                        if (dept.trend_value && dept.trend_value > 0) {
                          badgeIcon = <ArrowUp className="w-4 h-4 stroke-[2.5]" />;
                          statusColorClass = "text-[#ef4444]";
                          subTextColorClass = "text-[#ef4444]";
                          statusBgClass = "bg-[#fef2f2] dark:bg-red-950/40 text-[#ef4444]";
                          titleText = `Increasing (+${dept.trend_value}%)`;
                          subText = "vs last 30d";
                        } else if (dept.trend_value && dept.trend_value < 0) {
                          badgeIcon = <ArrowDown className="w-4 h-4 stroke-[2.5]" />;
                          statusColorClass = "text-[#10b981]";
                          subTextColorClass = "text-[#10b981]";
                          statusBgClass = "bg-[#ecfdf5] dark:bg-emerald-950/40 text-[#10b981]";
                          titleText = `Improving (-${Math.abs(dept.trend_value)}%)`;
                          subText = "vs last 30d";
                        }

                        const barWidth = Math.max(dept.riskScore, 3);

                        return (
                          <tr key={dept.department_name} className="hover:bg-gray-50/80 dark:hover:bg-[#1b1e2c]/50 transition-colors">
                            {/* Column 1: Department */}
                            <td className="py-3.5 pl-1">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${dept.badge.bg}`}>
                                  {dept.badge.icon}
                                </div>
                                <span className="font-bold text-sm md:text-[15px] text-[#0f172a] dark:text-gray-100 truncate max-w-[100px] sm:max-w-[140px]" style={{ fontFamily: 'Sora, sans-serif' }} title={dept.department_name}>
                                  {dept.department_name}
                                </span>
                              </div>
                            </td>

                            {/* Column 2: Risk Score */}
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold text-[#0f172a] dark:text-gray-200 w-9 tabular-nums shrink-0" style={{ fontFamily: 'Sora, sans-serif' }}>
                                  {dept.riskScore}%
                                </span>
                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-[#1b1e2c] rounded-full overflow-hidden min-w-[45px] max-w-[90px]">
                                  <div
                                    className={`h-full rounded-full ${dept.barColor} transition-all duration-500`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Column 3: Status */}
                            <td className="py-3.5 pr-1 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusBgClass}`}>
                                  {badgeIcon}
                                </div>
                                <div className="flex flex-col text-right">
                                  <span className={`font-bold text-xs sm:text-sm whitespace-nowrap ${statusColorClass}`} style={{ fontFamily: 'Sora, sans-serif' }}>
                                    {titleText}
                                  </span>
                                  <span className={`text-[11px] font-medium ${subTextColorClass}`}>
                                    {subText}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend Footer */}
                <div className="border-t border-gray-100 dark:border-[#262a3d] pt-5 mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/40 text-[#10b981] flex items-center justify-center shrink-0">
                        <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0f172a] dark:text-gray-200" style={{ fontFamily: 'Sora, sans-serif' }}>Improving</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Lower risk vs 30d</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1b1e2c] text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0f172a] dark:text-gray-200" style={{ fontFamily: 'Sora, sans-serif' }}>No change</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Same risk vs 30d</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#fef2f2] dark:bg-red-950/40 text-[#ef4444] flex items-center justify-center shrink-0">
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0f172a] dark:text-gray-200" style={{ fontFamily: 'Sora, sans-serif' }}>Increasing</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Higher risk vs 30d</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Recommendations / School Insights */}
          {dashboard && dashboard.recommendations.length > 0 && (
            <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] border-l-orange-500 border-l-[3px] shadow-sm overflow-hidden transition-colors mt-6">
              <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white tracking-wide">School Insights</h3>
                </div>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex flex-col">
                {dashboard.recommendations.map((rec, i) => {
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
                    <div key={i} className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors cursor-pointer ${i !== dashboard.recommendations.length - 1 ? 'border-b border-gray-200 dark:border-[#262a3d]' : ''}`}>
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Teacher Observation Flags */}
        {dashboard && dashboard.pending_teacher_flags.length > 0 && (
          <div className="bg-white dark:bg-[#151722] rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center gap-2 bg-amber-50">
              <Shield size={18} className="text-amber-600" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Teacher Observation Flags</h3>
              <span className="ml-auto text-xs text-amber-700 font-medium">{dashboard.pending_teacher_flags.length} pending</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {dashboard.pending_teacher_flags.map(flag => (
                <div key={flag.flag_id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{flag.class_name}</p>
                    <span className="text-xs text-gray-400">{timeAgo(flag.triggered_at)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {flag.teacher_first_name} {flag.teacher_last_name} · Grade {flag.grade_level}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-yellow-700">🟡 {flag.yellow_count}</span>
                    <span className="text-red-700">🔴 {flag.red_count}</span>
                    <span className="text-gray-500 dark:text-gray-400">{Math.round(flag.threshold_percentage * 100)}% threshold</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Most Supergreen This Week */}
      {dashboard && dashboard.teacher_leaderboard && dashboard.teacher_leaderboard.length > 0 && (
        <div className="bg-[#151722] rounded-xl border border-[#262a3d] p-5 shadow-sm mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Most Supergreen This Week</h2>
              <p className="text-xs text-gray-400 mt-0.5">Based on positive student outcomes this week</p>
            </div>
            <Link href="/leaderboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              View Full List
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboard.teacher_leaderboard.slice(0, 3).map((teacher, index) => {
              const rank = index + 1;
              let rankColor = 'bg-[#262a3d] text-gray-400';
              if (rank === 1) rankColor = 'bg-yellow-400 text-yellow-900';
              if (rank === 2) rankColor = 'bg-gray-300 text-gray-800';
              if (rank === 3) rankColor = 'bg-[#f4a460] text-orange-950';

              return (
                <div key={teacher.teacher_id} className="bg-[#1b1e2c] border border-[#262a3d] rounded-lg p-3 flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColor}`}>
                    {rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                    {teacher.teacher_first_name[0]}{teacher.teacher_last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{teacher.teacher_first_name} {teacher.teacher_last_name}</p>
                    <p className="text-xs text-gray-400 truncate">{teacher.department || 'General Department'}</p>
                  </div>
                  <div className="text-right shrink-0 pr-1">
                    <p className="text-lg font-bold text-[#4ade80] leading-none mb-1">{teacher.super_green_count}</p>
                    <p className="text-[0.65rem] text-gray-400 uppercase tracking-wider leading-none">Super Greens</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
