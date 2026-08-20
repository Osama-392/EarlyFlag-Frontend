'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminReferrals, acknowledgeReferral, AdminReferral } from '@/lib/adminService';
import { Bell, Check, Clipboard, Clock, Mail } from 'lucide-react';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';

type TabType = 'all' | 'red_flag' | 'manual' | 'resolved';

export default function AdminReferralsList({ range }: { range?: '1d' | '7d' | '30d' | 'all' }) {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<TabType>('all');
 const [referrals, setReferrals] = useState<AdminReferral[]>([]);
 const [loading, setLoading] = useState(true);
 const [emailModalStudent, setEmailModalStudent] = useState<any>(null);
 const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

 useEffect(() => {
 fetchReferrals();
 }, [activeTab, range]);

 const fetchReferrals = async () => {
 setLoading(true);
 try {
 // Build filters based on active tab
 const params: any = { limit: 50 };
 
 if (range && range !== 'all') {
 const days = parseInt(range.replace('d', ''), 10);
 if (!isNaN(days)) {
 const fromDate = new Date();
 // If days is 1 (today), we subtract 0 days. Otherwise subtract days - 1.
 fromDate.setDate(fromDate.getDate() - (days === 1 ? 0 : days - 1));
 params.from = fromDate.toISOString().split('T')[0];
 }
 } else if (range === 'all') {
 params.from = '2000-01-01'; // Very old date to fetch all data
 }
 
 const res = await getAdminReferrals(params);
 
 // Frontend filtering to match the tabs
 let filtered = res.referrals || [];
 if (activeTab === 'red_flag') {
 filtered = filtered.filter(r => r.referral_type === 'auto_red');
 } else if (activeTab === 'manual') {
 filtered = filtered.filter(r => r.referral_type === 'manual');
 } else if (activeTab === 'resolved') {
 filtered = filtered.filter(r => r.acknowledged_at !== null);
 }
 
 // If NOT resolved tab, filter out acknowledged ones
 if (activeTab !== 'resolved') {
 filtered = filtered.filter(r => r.acknowledged_at === null);
 }

 setReferrals(filtered);
 } catch (error) {
 console.error('Failed to fetch referrals:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleAcknowledge = async (id: string) => {
 try {
 await acknowledgeReferral(id);
 // Remove from list or refresh
 fetchReferrals();
 } catch (error) {
 console.error('Failed to acknowledge referral:', error);
 }
 };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    
    const etOptions = { timeZone: 'America/New_York' };
    const dDateStr = d.toLocaleDateString('en-US', etOptions);
    const todayStr = today.toLocaleDateString('en-US', etOptions);
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' 
    };

    if (dDateStr === todayStr) {
      return `Today, ${d.toLocaleTimeString('en-US', timeOptions)} ET`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-US', etOptions);

    if (dDateStr === yesterdayStr) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', timeOptions)} ET`;
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short', day: 'numeric', timeZone: 'America/New_York'
    };
    return d.toLocaleDateString('en-US', dateOptions) + ', ' + d.toLocaleTimeString('en-US', timeOptions) + ' ET';
  };

 const tabs = [
 { id: 'all', label: `Referrals & Follow ups (${referrals.length})` },
 { id: 'resolved', label: 'Resolved' }
 ];

 return (
 <div className="bg-white dark:bg-[#151722] rounded-2xl shadow-sm border border-gray-100 dark:border-[#262a3d] overflow-hidden mt-8">
 {/* Header */}
 <div className="px-6 py-5 border-b border-gray-100 dark:border-[#262a3d]">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
 <Bell className="w-5 h-5 text-red-500" />
 </div>
 <div>
 <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">Admin Referrals & Follow-Ups</h2>
 <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Teacher-flagged students requiring your attention — red flags auto-populate, teachers can also send manually</p>
 </div>
 </div>
 <div className="bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
 <span className="text-xs font-bold text-red-600 dark:text-red-400">Active Referrals</span>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-6 mt-6">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as TabType)}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
 activeTab === tab.id
 ? 'border-red-500 text-red-500'
 : 'border-transparent text-gray-400 hover:text-gray-600'
 }`}
 >
 {tab.id === 'red_flag' && <div className={`w-2.5 h-2.5 rounded-full ${activeTab === tab.id ? 'bg-red-500' : 'bg-gray-300'}`}></div>}
 {tab.id === 'manual' && <Clipboard className="w-3.5 h-3.5" />}
 {tab.id === 'resolved' && <Check className="w-3.5 h-3.5" />}
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* List */}
 <div className="divide-y divide-gray-100 dark:divide-[#262a3d] max-h-[450px] overflow-y-auto">
 {loading ? (
 <div className="p-8 text-center text-sm text-gray-400 font-medium">Loading referrals...</div>
 ) : referrals.length === 0 ? (
 <div className="p-8 text-center text-sm text-gray-400 font-medium">No referrals found in this category.</div>
 ) : (
 referrals.map((referral) => {
 const isRedFlag = referral.referral_type === 'auto_red';
 
 return (
 <div 
 key={referral.referral_id} 
 className={`p-5 flex items-start justify-between transition-colors hover:bg-gray-50 dark:hover:bg-[#1b1e2c] ${isRedFlag ? '' : 'bg-yellow-50/30 dark:bg-yellow-950/10'}`}
 >
 <div className="flex items-start gap-4">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${isRedFlag ? 'bg-red-500' : 'bg-blue-500'}`}>
 {referral.student_first_name[0]}{referral.student_last_name[0]}
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">
 {referral.student_first_name} {referral.student_last_name}
 {referral.subject && (
 <span className="text-black dark:text-white font-bold"> - {referral.subject}</span>
 )}
 </h3>
 {isRedFlag ? (
 <>
 <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center gap-1">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
 Red Flag
 </span>
 <span className="px-2 py-0.5 rounded-md bg-[#1e293b] dark:bg-gray-700 text-white text-[10px] font-bold">Auto-sent</span>
 </>
 ) : (
 <>
 <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center gap-1">
 <Clipboard className="w-2.5 h-2.5" />
 Manual Referral
 </span>
 <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Super Green Student</span>
 </>
 )}
 </div>
 <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1.5">
 {referral.note.split('\n').pop()?.replace(/\[auto\]\s*/i, 'Notes: ')}
 </p>
 <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
 <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
 <img src={`https://ui-avatars.com/api/?name=${referral.referred_by_first_name}+${referral.referred_by_last_name}&background=random&color=fff&size=16`} className="w-4 h-4 rounded-full" />
 {referral.referred_by_first_name} {referral.referred_by_last_name}
 </div>
 <span>•</span>
 <span>{formatDate(referral.created_at)}</span>
 <span>•</span>
 <span>{referral.student_grade_level}{[1,2,3].includes(referral.student_grade_level % 10) ? ['st','nd','rd'][(referral.student_grade_level % 10) - 1] : 'th'} Grade</span>
 {!isRedFlag && (
 <>
 <span>•</span>
 <span className="text-orange-500 flex items-center gap-1">
 <span className="w-3 h-3 border border-orange-500 rounded-sm flex items-center justify-center text-[8px]">!</span>
 Not a behavioral issue — welfare check
 </span>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 mt-1">
 <button 
 onClick={() => router.push(`/principal-students/${(referral as any).slug || referral.student_id}`)}
 className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg transition-colors"
 >
 View
 </button>
 <button
 onClick={() => {
   setEmailModalStudent({
     student_id: referral.student_id,
     student_name: `${referral.student_first_name} ${referral.student_last_name}`,
     class_name: referral.class_name || referral.subject || '',
     teacher_name: 'Administration',
     reason: referral.note,
     flags_count: 1
   });
   setIsEmailModalOpen(true);
 }}
 className="px-4 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
 title="Email Parent"
 >
 <Mail className="w-3.5 h-3.5" />
 Email
 </button>
 {referral.acknowledged_at ? (
 <button disabled className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500 font-bold text-xs rounded-lg cursor-default">
 Resolved
 </button>
 ) : (
 <button 
 onClick={() => handleAcknowledge(referral.referral_id)}
 className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg transition-colors"
 >
 Acknowledge
 </button>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 
 <div className="p-4 border-t border-gray-100 dark:border-[#262a3d] bg-gray-50/50 dark:bg-black/10 flex justify-end">
 <button className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-bold transition-colors">
 View All Referral History →
 </button>
 </div>
 
 {isEmailModalOpen && emailModalStudent && (
   <ParentEmailTemplateModal
     isOpen={isEmailModalOpen}
     onClose={() => {
       setIsEmailModalOpen(false);
       setEmailModalStudent(null);
     }}
     studentName={emailModalStudent.student_name}
     teacherName={emailModalStudent.teacher_name}
     reason={emailModalStudent.reason}
     flagCategory="admin_concern"
     studentId={emailModalStudent.student_id}
   />
 )}
 </div>
 );
}
