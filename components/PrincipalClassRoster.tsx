'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ArrowLeft, AlertCircle, ArrowRight, Shield, BookOpen, Flag } from 'lucide-react';
import { getAdminClassDrilldown, AdminClassDrilldownBlock } from '@/lib/adminDashboardService';

const getStatusFromScore = (score: number): 'critical' | 'at-risk' | 'on-track' => {
  if (score >= 6) return 'critical';
  if (score >= 2) return 'at-risk';
  return 'on-track';
};

const statusStyles: Record<string, { bg: string; border: string; badge: string; icon: string; dot: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: 'text-red-600', dot: 'bg-red-500' },
  'at-risk': { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: 'text-yellow-600', dot: 'bg-yellow-500' },
  'on-track': { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: 'text-green-600', dot: 'bg-green-500' },
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
      <div className="space-y-6 animate-pulse p-4 md:p-8">
        <div className="h-10 bg-gray-200 rounded-lg w-48 mb-6" />
        <div className="h-32 bg-gray-200 rounded-xl mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-52 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 p-4">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 font-semibold text-lg mb-2">Unable to load class</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={() => router.push('/principal-students')} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">Go Back</button>
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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
        @keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .student-card { animation: slideInUp 0.5s ease-out forwards; opacity:0; }
        .student-card:nth-child(1){animation-delay:.05s} .student-card:nth-child(2){animation-delay:.1s}
        .student-card:nth-child(3){animation-delay:.15s} .student-card:nth-child(4){animation-delay:.2s}
        .student-card:nth-child(5){animation-delay:.25s} .student-card:nth-child(6){animation-delay:.3s}
      `}</style>

      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center">
        <button 
          onClick={() => router.push('/principal-students')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Classes
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Sora' }}>{data.class_name}</h1>
          <p className="text-gray-600 text-base">
            Grade {data.grade_level} • {data.teacher_first_name} {data.teacher_last_name}
            {data.period ? ` • Period ${data.period}` : ''}
          </p>
        </div>
        {data.observation_flag && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg">
            <Flag size={18} />
            <span className="text-sm font-bold">Observation Flag Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border-emerald-200 p-5 shadow-sm">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wide">Green Flags</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.greenFlags}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
          <p className="text-amber-600 text-xs font-semibold uppercase tracking-wide">Yellow Flags</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{stats.yellowFlags}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <p className="text-red-600 text-xs font-semibold uppercase tracking-wide">Red Flags</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.redFlags}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search Roster</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or ID..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm" />
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map(student => {
          const status = getStatusFromScore(student.weighted_score);
          const styles = statusStyles[status];
          const isGreen = student.yellow_count === 0 && student.red_count === 0;
          return (
            <div key={student.student_id}
              onClick={() => router.push(`/principal-students/${student.student_id}`)}
              className="student-card bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm border border-gray-200 text-slate-600">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
                    <p className="text-xs text-gray-600">{student.external_student_id}</p>
                  </div>
                </div>
              </div>

              {/* Badges */}
              {(student.iep_status || student.ell_status) && (
                <div className="flex gap-1.5 mb-3">
                  {student.iep_status && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1"><Shield size={10} />IEP</span>}
                  {student.ell_status && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1"><BookOpen size={10} />ELL</span>}
                </div>
              )}

              {/* Breakdowns */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                <div className="bg-white rounded-xl p-2 border border-gray-100">
                  <p className="font-bold text-emerald-600">{isGreen ? 1 : 0}</p><p className="text-gray-500">Green</p>
                </div>
                <div className="bg-white rounded-xl p-2 border border-gray-100">
                  <p className="font-bold text-amber-600">{student.yellow_count}</p><p className="text-gray-500">Yellow</p>
                </div>
                <div className="bg-white rounded-xl p-2 border border-gray-100">
                  <p className="font-bold text-red-600">{student.red_count}</p><p className="text-gray-500">Red</p>
                </div>
                <div className="bg-white rounded-xl p-2 border border-gray-100">
                  <p className="font-bold text-gray-600">{student.absent_count}</p><p className="text-gray-500">Absent</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-blue-600 transition">
                  <span>View Profile</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <p className="text-gray-600 font-medium">{students.length === 0 ? 'No students enrolled in this class.' : 'No students match your search.'}</p>
        </div>
      )}
    </div>
  );
}
