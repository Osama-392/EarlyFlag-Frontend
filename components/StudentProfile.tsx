'use client';

import { ArrowLeft, Mail, MessageSquare, Edit, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getStudentHistory, updateStudentProfile } from '@/lib/studentService';
import { getCategoryStyle } from '@/lib/categoryColors';
import EditStudentProfileModal from '@/components/EditStudentProfileModal';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';
import SendAdminModal from '@/components/SendAdminModal';
import { useAuth } from '@/app/providers';

export default function StudentProfile() {
 const params = useParams();
 const pathname = usePathname();
 const studentId = (params.studentId || params.studentSlug) as string;
 const classId = (params.classId || params.classSlug) as string;
 
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [history, setHistory] = useState<any>(null);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
 const [emailCategoryState, setEmailCategoryState] = useState<'red' | 'yellow' | 'super_green' | 'absent' | null>(null);
 const [isSendAdminModalOpen, setIsSendAdminModalOpen] = useState(false);
 const { user } = useAuth();

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
 href={pathname.startsWith('/reports') ? '/reports' : `/classes/${classId}`}
 className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
  const rawSignals = history?.signals || [];
  const rawReferrals = history?.referrals || [];
  
  const mappedReferrals = rawReferrals.map((r: any) => {
    let sType = 'referral';
    if (r.referral_type === 'manual_green') sType = 'super_green';
    else if (r.referral_type === 'manual_yellow') sType = 'yellow';
    else if (r.referral_type === 'manual_admin') sType = 'red';

    return {
      id: r.id,
      created_at: r.created_at,
      signal_type: sType,
      category: 'Referral',
      reason_description: r.note || (r.referral_type === 'manual_admin' ? 'Sent to Admin' : 'Sent to Counselor'),
      note: r.note,
      class_name: 'Admin',
    };
  });

  const signals = [...rawSignals, ...mappedReferrals].sort((a, b) => new Date(b.signal_date || b.created_at).getTime() - new Date(a.signal_date || a.created_at).getTime());
 
 // Determine overall status (most severe recent signal, or neutral)
 let statusText = 'Normal';
 const hasSuperGreen = signals.some((s: any) => s.signal_type === 'super_green');
 const hasRed = signals.some((s: any) => s.signal_type === 'red');
 const hasYellow = signals.some((s: any) => s.signal_type === 'yellow');
 if (hasRed) statusText = 'Red';
 else if (hasYellow) statusText = 'Yellow';
 else if (hasSuperGreen) statusText = 'Super Green';

 const emailCategory = statusText === 'Red' ? 'red' as const
 : statusText === 'Yellow' ? 'yellow' as const
 : statusText === 'Super Green' ? 'super_green' as const
 : null;

  // Calculate absences per class to ensure they aren't cumulative across different classes
  const classAbsenceCounts = signals.reduce((acc: Record<string, number>, s: any) => {
    if (s.signal_type === 'absent') {
      if (classId) {
        // If viewing within a class context, only count absences for this class
        if (s.class_id === classId || s.class_slug === classId) {
          acc['current'] = (acc['current'] || 0) + 1;
        }
      } else if (user && s.teacher_id === user.id) {
        // If viewing globally, count absences per class for this teacher
        acc[s.class_id] = (acc[s.class_id] || 0) + 1;
      }
    }
    return acc;
  }, {});

  const maxAbsencesInSingleClass = classId 
    ? (classAbsenceCounts['current'] || 0)
    : Math.max(0, ...(Object.values(classAbsenceCounts) as number[]));

  const meetsAbsenceThreshold = maxAbsencesInSingleClass >= 3;

 const teacherFullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
 const studentFullName = [history?.first_name, history?.last_name].filter(Boolean).join(' ') || 'Student';

 // Last 30 days
 const thirtyDaysAgo = new Date();
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
 const recentSignals = signals.filter((s: any) => new Date(s.signal_date || s.created_at) >= thirtyDaysAgo);

 // Last 7 days
 const sevenDaysAgo = new Date();
 sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
 const recent7Days = signals.filter((s: any) => new Date(s.signal_date || s.created_at) >= sevenDaysAgo);

 const redFlags = recent7Days.filter((s: any) => s.signal_type === 'red');
 const yellowFlags = recent7Days.filter((s: any) => s.signal_type === 'yellow');
 const greenFlags = recent7Days.filter((s: any) => s.signal_type === 'green' || s.signal_type === 'super_green');

 const totalSummaryFlags = redFlags.length + yellowFlags.length + greenFlags.length || 1;
 const redPercent = Math.round((redFlags.length / totalSummaryFlags) * 100);
 const yellowPercent = Math.round((yellowFlags.length / totalSummaryFlags) * 100);
 const greenPercent = Math.round((greenFlags.length / totalSummaryFlags) * 100);

 // Notes
 const notes = signals.filter((s: any) => s.note && s.note.trim() !== '');

 return (
 <div className="max-w-6xl mx-auto space-y-6 pb-12" >
 {/* Top Bar: Back Button and Actions */}
 <div className="flex items-center justify-between">
 <Link
 href={pathname.startsWith('/reports') ? '/reports' : `/classes/${classId}`}
 className="inline-flex items-center text-sm text-blue-500 bg-white dark:bg-[#151722] border border-blue-100 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition-colors shadow-sm font-medium"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 {pathname.startsWith('/reports') ? 'Back to Reports' : 'Back to Students Roster'}
 </Link>
 
 <div className="flex items-center space-x-3">
 <button
 onClick={() => setIsSendAdminModalOpen(true)}
 className="inline-flex items-center space-x-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold shadow-sm"
 >
 <AlertCircle className="w-4 h-4" />
 <span>Send to Admin</span>
 </button>

 {emailCategory && emailCategory !== 'super_green' && (
 <button
 onClick={() => {
 setEmailCategoryState(emailCategory);
 setIsEmailModalOpen(true);
 }}
 className={`inline-flex items-center space-x-2 px-5 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm text-white ${
 emailCategory === 'red' ? 'bg-red-600 hover:bg-red-700'
 : emailCategory === 'yellow' ? 'bg-amber-500 hover:bg-amber-600'
 : 'bg-emerald-600 hover:bg-emerald-700'
 }`}
 title="Email Parent (Performance)"
 >
 <Mail className="w-4 h-4" />
 <span>Email Parent</span>
 </button>
 )}

 {meetsAbsenceThreshold && (
 <button
 onClick={() => {
 setEmailCategoryState('absent');
 setIsEmailModalOpen(true);
 }}
 className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
 title="Email Parent (Absence)"
 >
 <Mail className="w-4 h-4" />
 <span>Absence Notice</span>
 </button>
 )}

 <button 
 onClick={() => setIsEditModalOpen(true)}
 className="inline-flex items-center space-x-2 px-5 py-2 bg-gray-50 dark:bg-[#1b1e2c] border border-gray-200 dark:border-[#262a3d] text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262a3d] transition-colors text-sm font-bold shadow-sm"
 >
 <Edit className="w-4 h-4" />
 <span>Edit Profile</span>
 </button>
 </div>
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
 <h1 className="text-3xl font-bold text-slate-800 dark:text-white ">
 {history?.first_name} {history?.last_name}
 </h1>
 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
 {history?.grade_level ? `${history.grade_level}th Grade` : 'Unknown Grade'}
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
 {/* Red Flags */}
 <div className="bg-red-50 dark:bg-[#1b1e2c] rounded-xl p-4 relative border border-red-100 dark:border-[#262a3d]">
 <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-2 shadow-sm">
 <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
 </div>
 <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{redFlags.length}</div>
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Red Flags (7 Days)</h3>
 <p className="text-xs text-red-400/80 mt-1">Urgent interventions</p>
 </div>

 {/* Yellow Flags */}
 <div className="bg-amber-50 dark:bg-[#1b1e2c] rounded-xl p-4 relative border border-amber-100 dark:border-[#262a3d]">
 <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-2 shadow-sm">
 <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 </div>
 <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">{yellowFlags.length}</div>
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Yellow Flags (7 Days)</h3>
 <p className="text-xs text-amber-500/80 mt-1">Moderate concerns</p>
 </div>

 {/* Green Flags */}
 <div className="bg-emerald-50 dark:bg-[#1b1e2c] rounded-xl p-4 relative border border-emerald-100 dark:border-[#262a3d]">
 <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-2 shadow-sm">
 <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 </div>
 <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{greenFlags.length}</div>
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Green Flags (7 Days)</h3>
 <p className="text-xs text-emerald-500/80 mt-1">Positive recognitions</p>
 </div>

 {/* Bar Chart Summary */}
 <div className="pt-2">
 <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2">
 <span>Red</span>
 <span>Green</span>
 </div>
 <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-[#1b1e2c]">
 <div style={{ width: `${redPercent}%` }} className="bg-red-400 relative">
 {redFlags.length > 0 && (
 <span className="absolute -top-6 right-0 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 rounded-full">{redFlags.length}</span>
 )}
 </div>
 <div style={{ width: `${yellowPercent}%` }} className="bg-amber-400 relative">
 {yellowFlags.length > 0 && (
 <span className="absolute -top-6 right-0 text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 rounded-full">{yellowFlags.length}</span>
 )}
 </div>
 <div style={{ width: `${greenPercent}%` }} className="bg-emerald-400 relative">
 {greenFlags.length > 0 && (
 <span className="absolute -top-6 right-0 text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 rounded-full">{greenFlags.length}</span>
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
 const dateToUse = signal.signal_date ? signal.signal_date : signal.created_at;
 const dateString = new Date(dateToUse + (dateToUse.includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
 
 let lineColor = 'bg-gray-400';
 let pillClass = 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
 
 if (signal.signal_type === 'red') {
 lineColor = 'bg-red-400';
 pillClass = 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';
 } else if (signal.signal_type === 'yellow') {
 lineColor = 'bg-amber-400';
 pillClass = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
 } else if (signal.signal_type === 'green' || signal.signal_type === 'super_green' || signal.signal_type === 'present') {
 lineColor = 'bg-emerald-400';
 pillClass = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
 } else if (signal.signal_type === 'absent') {
 lineColor = 'bg-blue-400';
 pillClass = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50';
 }

 return (
 <div key={idx} className="flex items-center space-x-4 group">
 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-12 shrink-0">{dateString}</span>
 
 {/* Status Line */}
 <div className={`w-3 h-1 rounded-full ${lineColor}`}></div>
 
 <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${pillClass} border`}>
 {signal.signal_type === 'present' ? 'Present' : signal.signal_type === 'absent' ? 'Absent' : (signal.category || 'General')}
 </div>
 
 <div className="flex-1 px-4 py-1.5 bg-gray-50 dark:bg-[#1b1e2c] rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-[#262a3d] truncate flex justify-between items-center gap-2">
 <span className="truncate">
 {signal.signal_type === 'present' ? '' : (signal.reason_description || signal.note || 'No reason provided')}
 </span>
 {signal.class_name && (
 <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium shrink-0 bg-white dark:bg-[#262a3d] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
 Class {signal.class_name}
 </span>
 )}
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
 {new Date((signal.signal_date || signal.created_at) + ((signal.signal_date || signal.created_at).includes('T') ? '' : 'T12:00:00Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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



 <EditStudentProfileModal 
 isOpen={isEditModalOpen} 
 onClose={() => setIsEditModalOpen(false)} 
 student={{
 firstName: history?.first_name || "Unknown",
 lastName: history?.last_name || "",
 grade: history?.grade_level || 9,
 studentId: studentId
 }}
 onSave={async (data) => {
 try {
 const payload = {
 first_name: data.firstName,
 last_name: data.lastName,
 grade_level: data.grade,
 gender: data.gender,
 date_of_birth: data.dateOfBirth ? data.dateOfBirth : null
 };
 await updateStudentProfile(studentId, payload);
 
 // update local state
 setHistory((prev: any) => ({
 ...prev,
 first_name: data.firstName,
 last_name: data.lastName,
 grade_level: data.grade,
 gender: data.gender,
 date_of_birth: data.dateOfBirth
 }));
 } catch(err) {
 console.error("Failed to update student", err);
 }
 }}
 />

 {(emailCategoryState || emailCategory) && (
 <ParentEmailTemplateModal
 isOpen={isEmailModalOpen}
 onClose={() => setIsEmailModalOpen(false)}
 studentName={studentFullName}
 teacherName={teacherFullName}
 flagCategory={emailCategoryState || emailCategory!}
 studentId={studentId}
 classId={classId}
 />
 )}

 <SendAdminModal
 isOpen={isSendAdminModalOpen}
 onClose={() => setIsSendAdminModalOpen(false)}
 studentId={history?.student_id || studentId}
 studentName={studentFullName}
 />
 </div>
 );
}
