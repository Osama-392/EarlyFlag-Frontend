'use client';

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Star, Sparkles, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { getTeacherRecognitions, StudentRecognitionRow } from '@/lib/dashboardService';

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<StudentRecognitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTeacherRecognitions(100);
        setRecognitions(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load recognitions');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="flex flex-col items-center gap-3">
          <Sparkles size={32} className="text-emerald-500 animate-pulse" />
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Loading recognitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-900/50">
        <AlertCircle /> <p>{error}</p>
      </div>
    );
  }

  // Aggregate top students by unique student_id, taking their max total_recognitions
  const uniqueStudentsMap = new Map<string, StudentRecognitionRow>();
  recognitions.forEach(r => {
    if (!uniqueStudentsMap.has(r.student_id) || r.total_recognitions > uniqueStudentsMap.get(r.student_id)!.total_recognitions) {
      uniqueStudentsMap.set(r.student_id, r);
    }
  });

  const topStudents = Array.from(uniqueStudentsMap.values())
    .sort((a, b) => b.total_recognitions - a.total_recognitions)
    .slice(0, 6);

  // Stats
  const totalAwarded = recognitions.length;
  const uniqueStudentCount = uniqueStudentsMap.size;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
      `}</style>

      {/* Header section with nice background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-8 text-white shadow-lg border border-emerald-400/30">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 mix-blend-overlay">
          <Award size={350} strokeWidth={1} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                <Sparkles className="text-emerald-100" size={24} />
              </div>
              Student Recognition
            </h1>
            <p className="text-emerald-50 mt-3 max-w-lg leading-relaxed font-medium">
              Celebrate the wins! Here's a look at the exceptional growth and positive behavior you've highlighted in your classes.
            </p>
          </div>
          <div className="flex gap-4 self-stretch md:self-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 flex-1 md:min-w-[140px] border border-white/20 shadow-sm flex flex-col justify-center">
              <p className="text-emerald-100 text-xs uppercase tracking-wider font-semibold mb-1">Recent Awards</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{totalAwarded}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 flex-1 md:min-w-[140px] border border-white/20 shadow-sm flex flex-col justify-center">
              <p className="text-emerald-100 text-xs uppercase tracking-wider font-semibold mb-1">Students</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{uniqueStudentCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Top Recognized Students */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-200 dark:border-[#262a3d] shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-amber-300 to-orange-500 rounded-full opacity-[0.08] dark:opacity-10 blur-2xl group-hover:opacity-[0.15] dark:group-hover:opacity-20 transition-opacity duration-500"></div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <Trophy className="text-amber-500" size={22} /> Top Stars
            </h2>

            {topStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No students recognized yet.</p>
            ) : (
              <div className="space-y-3">
                {topStudents.map((student, idx) => (
                  <div key={student.student_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1c29] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#2a2e42] relative overflow-hidden">
                    {/* Rank Badge */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 border shadow-sm ${idx === 0 ? 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-700/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600/50' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-100 to-slate-200 dark:from-gray-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-100 to-amber-200/50 dark:from-orange-900/40 dark:to-amber-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                            'bg-gray-50 dark:bg-[#151722] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                      }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {student.student_first_name} {student.student_last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {student.class_name} {student.period ? `• P${student.period}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm border border-emerald-100 dark:border-emerald-800/30">
                        {student.total_recognitions} <Star size={12} className="fill-current opacity-80" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-200 dark:border-[#262a3d] shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <TrendingUp className="text-emerald-500" size={22} /> Recent Highlights
            </h2>

            {recognitions.length === 0 ? (
              <div className="text-center py-16 px-4 bg-gray-50 dark:bg-[#1a1c29] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 bg-white dark:bg-[#151722] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200 dark:border-gray-800">
                  <Award size={32} className="text-emerald-500 opacity-60" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>No recognitions found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Award Super Green signals to your students from the Quick Log to see them celebrated here.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2 md:pr-4 -mr-2 md:-mr-4 space-y-6 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-emerald-200 before:to-transparent dark:before:from-emerald-600 dark:before:via-emerald-900/50" style={{ scrollbarWidth: 'thin' }}>
                {recognitions.map((rec, idx) => (
                  <div key={idx} className="relative flex items-start pl-14">
                    {/* Timeline Dot */}
                    <div className="absolute left-[1.4rem] -translate-x-1/2 mt-2 w-[18px] h-[18px] rounded-full bg-emerald-500 border-4 border-white dark:border-[#151722] z-10 shadow-sm shadow-emerald-500/30"></div>

                    {/* Content Card */}
                    <div className="w-full pr-2">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">
                        <Calendar size={13} strokeWidth={2.5} />
                        {new Date(rec.signal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      <div className="bg-white dark:bg-[#1a1c29] p-5 rounded-xl border border-gray-200 dark:border-[#2a2e42] shadow-[0_2px_10px_-3px_rgba(6,182,212,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(6,182,212,0.03)] hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100 to-transparent dark:from-emerald-900/20 opacity-0 group-hover:opacity-100 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 pointer-events-none"></div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg shrink-0 border border-emerald-200 dark:border-emerald-800/30 shadow-inner">
                            {rec.student_first_name.charAt(0)}{rec.student_last_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-tight mb-1 truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {rec.student_first_name} {rec.student_last_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                              {rec.class_name} {rec.period ? `• P${rec.period}` : ''}
                            </p>

                            {(rec.reason_code || rec.notes) && (
                              <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-[#151722]/80 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800 relative z-10">
                                {rec.reason_code && <span className="font-semibold block mb-1 text-gray-900 dark:text-white">{rec.reason_code}</span>}
                                {rec.notes && <span className="italic opacity-90">"{rec.notes}"</span>}
                              </div>
                            )}
                          </div>
                        </div>
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
  );
}
