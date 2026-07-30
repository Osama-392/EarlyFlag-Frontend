'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { ArrowLeft, AlertTriangle, AlertCircle, Star, Calendar, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
import { getAdminSchoolOverview, AdminSchoolOverviewResponse } from '@/lib/adminDashboardService';

type TabType = 'all' | 'high_risk' | 'medium_risk' | 'super_green' | 'absent';

export default function SchoolOverviewPage() {
  const router = useRouter();
  const [days, setDays] = useState<number>(1);
  const [data, setData] = useState<AdminSchoolOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const [emailModalData, setEmailModalData] = useState<{ isOpen: boolean, student: any, category: 'red' | 'yellow' | 'super_green' | 'absent' | 'admin_concern' | 'admin_commendation', reason?: string } | null>(null);
  
  const adminFullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Administration';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminSchoolOverview(days);
      setData(res);
    } catch (err: any) {
      console.error('School overview fetch failed:', err);
      setError(err?.response?.data?.detail || 'Failed to load school overview.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.students.filter(s => {
      if (activeTab === 'high_risk') return s.risk_level === 'High Risk';
      if (activeTab === 'medium_risk') return s.risk_level === 'Medium';
      if (activeTab === 'super_green') return s.risk_level === 'Excellent';
      if (activeTab === 'absent') return s.absent_count > 0;
      return true;
    });
  }, [data, activeTab]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, high: 0, medium: 0, sg: 0, absent: 0 };
    return {
      all: data.students.length,
      high: data.students.filter(s => s.risk_level === 'High Risk').length,
      medium: data.students.filter(s => s.risk_level === 'Medium').length,
      sg: data.students.filter(s => s.risk_level === 'Excellent').length,
      absent: data.students.filter(s => s.absent_count > 0).length,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Unable to load overview</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={() => fetchData()} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Playfair Display' }}>School Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Students requiring attention — ranked by risk across all classes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <div className="flex bg-gray-100 dark:bg-[#1b1e2c] rounded-lg p-1">
            {([1, 7, 30]).map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${days === d ? 'bg-white dark:bg-[#151722] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {d === 1 ? 'Today' : d === 7 ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 flex items-center gap-4 min-w-[140px] shadow-sm flex-1">
          <AlertTriangle className="text-amber-500" size={28} />
          <div>
            <p className="text-2xl font-bold text-amber-500 leading-none">{data?.total_yellow || 0}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase mt-1">Yellow Flags</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 flex items-center gap-4 min-w-[140px] shadow-sm flex-1">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0" />
          <div>
            <p className="text-2xl font-bold text-red-500 leading-none">{data?.total_red || 0}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase mt-1">Red Flags</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 flex items-center gap-4 min-w-[140px] shadow-sm flex-1">
          <Star className="text-emerald-400 fill-current" size={28} />
          <div>
            <p className="text-2xl font-bold text-emerald-500 leading-none">{data?.total_super_green || 0}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase mt-1">Super Green</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-4 flex items-center gap-4 min-w-[140px] shadow-sm flex-1">
          <Calendar className="text-blue-500" size={28} />
          <div>
            <p className="text-2xl font-bold text-blue-500 leading-none">{data?.total_absences || 0}</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase mt-1">Absences</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-gray-100 dark:border-[#262a3d] pt-4">
          <button onClick={() => startTransition(() => setActiveTab('all'))} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <CheckCircle2 size={14} className="text-gray-400" /> All Students ({counts.all})
          </button>
          <button onClick={() => startTransition(() => setActiveTab('high_risk'))} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'high_risk' ? 'border-red-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> High Risk ({counts.high})
          </button>
          <button onClick={() => startTransition(() => setActiveTab('medium_risk'))} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'medium_risk' ? 'border-amber-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <AlertTriangle size={14} className="text-amber-500" /> Medium Risk ({counts.medium})
          </button>
          <button onClick={() => startTransition(() => setActiveTab('super_green'))} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'super_green' ? 'border-emerald-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Star size={14} className="text-emerald-500 fill-current" /> Super Green ({counts.sg})
          </button>
          <button onClick={() => startTransition(() => setActiveTab('absent'))} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'absent' ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Calendar size={14} className="text-blue-500" /> Absent ({counts.absent})
          </button>
        </div>

        {/* Table */}
        <div className={`overflow-auto max-h-[600px] transition-opacity duration-200 ${(loading || isPending) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white dark:bg-[#151722] z-10">
              <tr className="border-b border-gray-100 dark:border-[#262a3d] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 pl-6 font-semibold w-10">#</th>
                <th className="py-4 px-4 font-semibold min-w-[200px]">Student</th>
                <th className="py-4 px-2 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Yellow
                  </div>
                </th>
                <th className="py-4 px-2 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Red
                  </div>
                </th>
                <th className="py-4 px-2 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <Star size={12} className="text-emerald-400 fill-current" />
                    Green
                  </div>
                </th>
                <th className="py-4 px-2 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <Calendar size={12} className="text-blue-400" />
                    Absent
                  </div>
                </th>
                <th className="py-4 px-4 font-semibold">Risk Level</th>
                <th className="py-4 px-4 font-semibold">Classes</th>
                <th className="py-4 pr-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#1b1e2c]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-400 font-medium">
                    No students found for this filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const isExcellent = student.risk_level === 'Excellent';
                  return (
                    <tr key={student.student_id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-[#1b1e2c] ${isExcellent ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                      <td className="py-4 pl-6 text-sm font-medium text-gray-400">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${student.red_count > 0 ? 'bg-red-500' : student.yellow_count > 0 ? 'bg-amber-500' : isExcellent ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-[15px]">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500">
                              {student.grade_level}{[1,2,3].includes(student.grade_level % 10) ? ['st','nd','rd'][(student.grade_level % 10) - 1] : 'th'} Grade
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        {student.yellow_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                            <AlertTriangle size={12} /> {student.yellow_count}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {student.red_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {student.red_count}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {student.super_green_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <Star size={12} className="fill-current" /> {student.super_green_count}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {student.absent_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                            <Calendar size={12} /> {student.absent_count}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {student.risk_level === 'High Risk' && (
                          <span className="inline-flex text-center flex-col text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/30 leading-tight">
                            High<br/>Risk
                          </span>
                        )}
                        {student.risk_level === 'Medium' && (
                          <span className="inline-flex text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            Medium
                          </span>
                        )}
                        {student.risk_level === 'Low' && (
                          <span className="inline-flex text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            Low
                          </span>
                        )}
                        {student.risk_level === 'Excellent' && (
                          <span className="inline-flex text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            Excellent
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {student.classes.map((c, i) => (
                            <span key={i} className="text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1b1e2c] px-2 py-0.5 rounded border border-gray-200 dark:border-[#262a3d]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 pr-6 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEmailModalData({
                              isOpen: true,
                              student,
                              category: student.risk_level === 'Low' ? 'admin_commendation' : 'admin_concern'
                            })}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              student.risk_level === 'High Risk' ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20'
                              : student.risk_level === 'Medium' ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20'
                              : student.risk_level === 'Low' ? 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20'
                            }`}
                            title="Email Parent"
                          >
                            <Mail size={16} />
                          </button>
                        {student.absent_count > 0 && (
                          <button
                            onClick={() => setEmailModalData({
                              isOpen: true,
                              student,
                              category: 'absent',
                              reason: `for ${student.absent_count} classes recently`
                            })}
                            className="p-1.5 rounded-lg transition-colors border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-900/20"
                            title="Email Parent (Absence)"
                          >
                            <Calendar size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/principal-students/${student.student_id}`)}
                          className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {emailModalData && (
        <ParentEmailTemplateModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          studentName={`${emailModalData.student.first_name} ${emailModalData.student.last_name}`}
          teacherName={adminFullName}
          flagCategory={emailModalData.category}
          reason={emailModalData.reason}
          recentFlags={emailModalData.student.recent_flags}
        />
      )}
    </div>
  );
}
