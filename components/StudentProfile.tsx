'use client';

import { ArrowLeft, Mail, MessageSquare, Edit, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getStudentHistory } from '@/lib/studentService';
import EditStudentProfileModal from '@/components/EditStudentProfileModal';

export default function StudentProfile() {
  const params = useParams();
  const pathname = usePathname();
  const studentId = params.studentId as string;
  const classId = params.classId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student history which contains signal data
        const historyData = await getStudentHistory(studentId);
        setHistory(historyData);
      } catch (err: any) {
        const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to load student data';
        setError(message);
        console.error('Error loading student:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href={pathname.startsWith('/reports') ? '/reports' : `/students/${classId}`}
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {pathname.startsWith('/reports') ? 'Back to Reports' : 'Back to Roster'}
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate stats from history data
  const signals = history?.signals || [];
  
  // Determine overall status (most severe recent signal, or neutral)
  let statusText = 'Super Green';
  const hasRed = signals.some((s: any) => s.signal_type === 'red');
  const hasYellow = signals.some((s: any) => s.signal_type === 'yellow');
  if (hasRed) statusText = 'Red';
  else if (hasYellow) statusText = 'Yellow';

  // Last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent7Days = signals.filter((s: any) => new Date(s.created_at) >= sevenDaysAgo);

  const academicFlags = recent7Days.filter((s: any) => s.category?.toLowerCase() === 'academic');
  const behavioralFlags = recent7Days.filter((s: any) => s.category?.toLowerCase() === 'behavioral');
  
  const total7Days = academicFlags.length + behavioralFlags.length || 1; // avoid div by 0
  const academicPercent = Math.round((academicFlags.length / total7Days) * 100);
  const behavioralPercent = Math.round((behavioralFlags.length / total7Days) * 100);

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSignals = signals.filter((s: any) => new Date(s.created_at) >= thirtyDaysAgo);

  // Notes
  const notes = signals.filter((s: any) => s.note && s.note.trim() !== '');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Back Button */}
      <div>
        <Link
          href={pathname.startsWith('/reports') ? '/reports' : `/students/${classId}`}
          className="inline-flex items-center text-sm text-blue-500 bg-white dark:bg-[#151722] border border-blue-100 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition-colors shadow-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {pathname.startsWith('/reports') ? 'Back to Reports' : 'Back to Students Roster'}
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1b1e2c] flex items-center justify-center border-4 border-white dark:border-[#262a3d] shadow-md text-3xl font-bold text-slate-400 dark:text-slate-300 overflow-hidden">
            {history?.first_name ? `${history.first_name[0]}${history.last_name[0]}` : '??'}
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              {statusText === 'Red' && <span className="px-2.5 py-0.5 bg-red-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Red</span>}
              {statusText === 'Yellow' && <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Yellow</span>}
              {statusText === 'Super Green' && <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Super Green</span>}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              {history?.first_name} {history?.last_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {history?.grade_level ? `${history.grade_level}th Grade` : 'Unknown Grade'} | ID: {studentId.substring(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 text-xs font-bold rounded-lg border shadow-sm ${
            statusText === 'Red' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50' :
            statusText === 'Yellow' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50' :
            'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
          }`}>
            Status : {statusText} Active
          </div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-[#1b1e2c] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-[#262a3d] shadow-sm">
            Days {statusText} : {history?.signals?.length || 0}
          </div>
          <div className="px-4 py-2 bg-amber-100/50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200/50 shadow-sm">
            Notified : March 16
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Last 7-Day Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Last 7-Day</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Flags Summary</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 space-y-4">
            {/* Academic Flags */}
            <div className="bg-slate-50 dark:bg-[#1b1e2c] rounded-xl p-5 relative border border-slate-100 dark:border-[#262a3d]">
              <span className="absolute top-4 right-4 text-[10px] font-bold bg-white dark:bg-[#151722] text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full border border-gray-200 dark:border-[#262a3d] shadow-sm">+8%</span>
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                <span className="font-bold text-sm text-blue-500 dark:text-blue-400">P</span>
              </div>
              <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-1">{academicFlags.length}</div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Academic Flags (7 Days)</h3>
              <p className="text-xs text-gray-400 mt-1">Light concerns tracked</p>
            </div>

            {/* Behavioral Flags */}
            <div className="bg-purple-50 dark:bg-[#1b1e2c] rounded-xl p-5 relative border border-purple-100 dark:border-[#262a3d]">
              <span className="absolute top-4 right-4 text-[10px] font-bold bg-white dark:bg-[#151722] text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full border border-gray-200 dark:border-[#262a3d] shadow-sm">-22%</span>
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-3 shadow-sm">
                <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{behavioralFlags.length}</div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Behavioral flags (7 Days)</h3>
              <p className="text-xs text-purple-400/80 mt-1">Urgent interventions</p>
            </div>

            {/* Bar Chart Summary */}
            <div className="pt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2">
                <span>Academic</span>
                <span>Behavioral</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-[#1b1e2c]">
                <div style={{ width: `${academicPercent}%` }} className="bg-blue-400 relative">
                  {academicFlags.length > 0 && (
                    <span className="absolute -top-6 right-0 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 rounded-full">{academicFlags.length}</span>
                  )}
                </div>
                <div style={{ width: `${behavioralPercent}%` }} className="bg-purple-500 relative">
                  {behavioralFlags.length > 0 && (
                    <span className="absolute -top-6 right-0 text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 rounded-full">{behavioralFlags.length}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Flag History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Flag History</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Last 30 days</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 h-[460px] overflow-y-auto">
            {recentSignals.length > 0 ? (
              <div className="space-y-5">
                {recentSignals.map((signal: any, idx: number) => {
                  const isAcademic = signal.category?.toLowerCase() === 'academic';
                  const dateString = new Date(signal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={idx} className="flex items-center space-x-4 group">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-12 shrink-0">{dateString}</span>
                      
                      {/* Status Line */}
                      <div className={`w-3 h-1 rounded-full ${isAcademic ? 'bg-blue-400' : 'bg-purple-500'}`}></div>
                      
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isAcademic ? 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50'}`}>
                        {signal.category || 'General'}
                      </div>
                      
                      <div className="flex-1 px-4 py-1.5 bg-gray-50 dark:bg-[#1b1e2c] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-[#262a3d] truncate">
                        {signal.reason_description || signal.note || 'No reason provided'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No flags in the last 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teachers Notes */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Teachers Notes</h2>
        </div>
        <div className="p-6 space-y-6">
          {notes.length > 0 ? (
            notes.map((signal: any, idx: number) => (
              <div key={idx} className="border-b border-gray-100 dark:border-[#262a3d] last:border-0 pb-6 last:pb-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                  {new Date(signal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {signal.note}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              No notes available for this student.
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (Footer area) */}
      <div className="flex items-center justify-end space-x-3 pt-6 pb-6">
        <button className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm">
          <Mail className="w-4 h-4" />
          <span>Email Counselor</span>
        </button>
        <button className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262a3d] transition-colors text-sm font-bold shadow-sm">
          <MessageSquare className="w-4 h-4" />
          <span>Leave Note</span>
        </button>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262a3d] transition-colors text-sm font-bold shadow-sm"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <EditStudentProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        student={{
          firstName: history?.first_name || "Unknown",
          lastName: history?.last_name || "",
          grade: history?.grade_level || 9,
          studentId: studentId
        }}
        onSave={(data) => {
          console.log("Saving student profile:", data);
        }}
      />
    </div>
  );
}
