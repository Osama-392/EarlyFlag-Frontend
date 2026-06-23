'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ArrowLeft, AlertCircle, ChevronRight, Shield, BookOpen, Flag } from 'lucide-react';
import { getAdminClassDrilldown, AdminClassDrilldownBlock } from '@/lib/adminDashboardService';

const getStatusFromScore = (score: number): 'critical' | 'at-risk' | 'on-track' => {
  if (score >= 6) return 'critical';
  if (score >= 2) return 'at-risk';
  return 'on-track';
};

const statusConfig: Record<string, {
  accentBorder: string; bgHover: string; dotColor: string;
  label: string; labelBg: string; labelText: string;
  avatarBg: string; avatarBorder: string; avatarText: string;
  glowShadow: string;
}> = {
  critical: {
    accentBorder: 'border-l-red-500',
    bgHover: 'hover:bg-red-50/40',
    dotColor: 'bg-red-500',
    label: 'Critical',
    labelBg: 'bg-red-500/10',
    labelText: 'text-red-600',
    avatarBg: 'bg-red-50',
    avatarBorder: 'ring-red-200',
    avatarText: 'text-red-700',
    glowShadow: 'hover:shadow-red-100/50',
  },
  'at-risk': {
    accentBorder: 'border-l-amber-400',
    bgHover: 'hover:bg-amber-50/40',
    dotColor: 'bg-amber-400',
    label: 'At Risk',
    labelBg: 'bg-amber-400/10',
    labelText: 'text-amber-600',
    avatarBg: 'bg-amber-50',
    avatarBorder: 'ring-amber-200',
    avatarText: 'text-amber-700',
    glowShadow: 'hover:shadow-amber-100/50',
  },
  'on-track': {
    accentBorder: 'border-l-emerald-400',
    bgHover: 'hover:bg-emerald-50/30',
    dotColor: 'bg-emerald-400',
    label: 'On Track',
    labelBg: 'bg-emerald-400/10',
    labelText: 'text-emerald-600',
    avatarBg: 'bg-emerald-50',
    avatarBorder: 'ring-emerald-200',
    avatarText: 'text-emerald-700',
    glowShadow: 'hover:shadow-emerald-100/50',
  },
};

export default function PrincipalClassRoster({ classId }: { classId: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<AdminClassDrilldownBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAdminClassDrilldown(classId, '30d');
      setData(result);
    } catch (err: any) {
      console.error('Class drilldown fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load class roster.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl mx-auto py-8">
        <div className="h-8 bg-gray-200 rounded-lg w-44 mb-6" />
        <div className="h-28 bg-gray-200 rounded-2xl mb-4" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 p-4">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white dark:text-white font-semibold text-lg mb-2">Unable to load class</p>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => router.push('/principal-students')} className="px-6 py-2.5 bg-gray-100 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 transition">Go Back</button>
      </div>
    );
  }

  const students = data.students || [];
  const filteredStudents = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || s.external_student_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: students.length,
    greenFlags: students.filter(s => s.yellow_count === 0 && s.red_count === 0).length,
    yellowFlags: students.reduce((sum, s) => sum + (s.yellow_count || 0), 0),
    redFlags: students.reduce((sum, s) => sum + (s.red_count || 0), 0),
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap');
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .roster-item {
          animation: fadeSlideIn 0.35s ease-out both;
        }
        .roster-item:nth-child(1)  { animation-delay: 0.03s; }
        .roster-item:nth-child(2)  { animation-delay: 0.06s; }
        .roster-item:nth-child(3)  { animation-delay: 0.09s; }
        .roster-item:nth-child(4)  { animation-delay: 0.12s; }
        .roster-item:nth-child(5)  { animation-delay: 0.15s; }
        .roster-item:nth-child(6)  { animation-delay: 0.18s; }
        .roster-item:nth-child(7)  { animation-delay: 0.21s; }
        .roster-item:nth-child(8)  { animation-delay: 0.24s; }
        .roster-item:nth-child(9)  { animation-delay: 0.27s; }
        .roster-item:nth-child(10) { animation-delay: 0.30s; }
      `}</style>

      {/* Back */}
      <button
        onClick={() => router.push('/principal-students')}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition-colors shadow-sm"
      >
        <ArrowLeft size={16} /> Back to Classes
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white dark:text-white tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            {data.class_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1 text-[15px]" style={{ fontFamily: 'DM Sans' }}>
            Grade {data.grade_level} · {data.teacher_first_name} {data.teacher_last_name}
            {data.period ? ` · Period ${data.period}` : ''}
          </p>
        </div>
        {data.observation_flag && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold">
            <Flag size={16} /> Observation Flag Active
          </div>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-3" style={{ fontFamily: 'DM Sans' }}>
        {[
          { label: 'Students', value: stats.total, color: 'text-gray-900 dark:text-white dark:text-white', border: 'border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]' },
          { label: 'Green', value: stats.greenFlags, color: 'text-emerald-600', border: 'border-emerald-200' },
          { label: 'Yellow', value: stats.yellowFlags, color: 'text-amber-600', border: 'border-amber-200' },
          { label: 'Red', value: stats.redFlags, color: 'text-red-600', border: 'border-red-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-xl border ${stat.border} px-4 py-4 shadow-sm text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative" style={{ fontFamily: 'DM Sans' }}>
        <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 outline-none transition text-sm shadow-sm"
        />
      </div>

      {/* Student Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ fontFamily: 'DM Sans' }}>
        {filteredStudents.map(student => {
          const status = getStatusFromScore(student.weighted_score);
          const cfg = statusConfig[status];
          const isGreen = student.yellow_count === 0 && student.red_count === 0;

          return (
            <div
              key={student.student_id}
              onClick={() => router.push(`/principal-students/${student.student_id}`)}
              className={`roster-item bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d]/80 border-t-[3.5px] ${cfg.accentBorder.replace('border-l-', 'border-t-')} rounded-xl p-5 cursor-pointer
                shadow-sm hover:shadow-lg ${cfg.glowShadow} ${cfg.bgHover}
                transition-all duration-200 group`}
            >
              {/* Top: Avatar + Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-full ${cfg.avatarBg} ring-2 ${cfg.avatarBorder} flex items-center justify-center text-sm font-bold ${cfg.avatarText} flex-shrink-0`}>
                  {student.first_name[0]}{student.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white dark:text-white truncate">{student.first_name} {student.last_name}</h3>
                  <p className="text-xs text-gray-400">{student.external_student_id}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 dark:text-gray-400 dark:text-gray-400 transition-colors flex-shrink-0" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.labelBg} ${cfg.labelText}`}>
                  {cfg.label}
                </span>
                {student.iep_status && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase flex items-center gap-0.5">
                    <Shield size={9} />IEP
                  </span>
                )}
                {student.ell_status && (
                  <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[10px] font-bold uppercase flex items-center gap-0.5">
                    <BookOpen size={9} />ELL
                  </span>
                )}
              </div>

              {/* Signal Counts */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
                <div className="flex items-center gap-1.5" title="Green Signals">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-600 tabular-nums">{isGreen ? 1 : 0}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Yellow Flags">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-amber-600 tabular-nums">{student.yellow_count}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Red Flags">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-600 tabular-nums">{student.red_count}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Absent">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-400 tabular-nums">{student.absent_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 font-medium">{students.length === 0 ? 'No students enrolled in this class.' : 'No students match your search.'}</p>
        </div>
      )}
    </div>
  );
}
