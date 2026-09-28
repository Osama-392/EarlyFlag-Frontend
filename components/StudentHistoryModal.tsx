'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Signal } from '@/lib/studentService';
import { TeacherSkeletonLine } from '@/components/TeacherLoadingSkeletons';

interface StudentHistoryModalProps {
 isOpen: boolean;
 onClose: () => void;
 studentName: string;
 history: Signal[];
 loading: boolean;
}

export default function StudentHistoryModal({
 isOpen,
 onClose,
 studentName,
 history,
 loading,
}: StudentHistoryModalProps) {
 if (!isOpen) return null;

 const getSignalColor = (signalType: string) => {
 switch (signalType) {
 case 'green':
 return 'bg-green-50 border-green-200 text-green-800';
 case 'yellow':
 return 'bg-yellow-50 border-yellow-200 text-yellow-800';
 case 'red':
 return 'bg-red-50 border-red-200 text-red-800';
 default:
 return 'bg-gray-50 border-gray-200 text-gray-800 dark:text-white';
 }
 };

 const getSignalEmoji = (signalType: string) => {
 switch (signalType) {
 case 'green':
 return '✨';
 case 'yellow':
 return '⚠️';
 case 'red':
 return '🚨';
 default:
 return '•';
 }
 };

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-gray-200">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Signal History</h2>
 <p className="text-sm text-gray-600">{studentName}</p>
 </div>
 <button
 onClick={onClose}
 className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-6 h-6 text-gray-400" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6">
 {loading ? (
 <div className="space-y-3 py-2" aria-label="Loading signal history" role="status">
 {[1, 2, 3, 4].map(row => (
 <div key={row} className="rounded-lg border border-gray-200 p-4 dark:border-[#2e3240]">
 <div className="flex items-start gap-3">
 <TeacherSkeletonLine className="h-8 w-8 shrink-0 rounded-full" />
 <div className="flex-1"><TeacherSkeletonLine className="h-3.5 w-1/2" /><TeacherSkeletonLine className="mt-3 h-3 w-full" /></div>
 </div>
 </div>
 ))}
 <span className="sr-only">Loading</span>
 </div>
 ) : history.length === 0 ? (
 <p className="text-center text-gray-500 py-8">No signal history available</p>
 ) : (
 <div className="space-y-3">
 {history.map((signal) => (
 <div
 key={signal.id}
 className={`p-4 rounded-lg border ${getSignalColor(signal.signal_type)}`}
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <span className="text-xl">{getSignalEmoji(signal.signal_type)}</span>
 <div>
 <p className="font-semibold capitalize">
 {signal.signal_type} Signal
 {signal.category && ` - ${signal.category}`}
 </p>
 {signal.note && (
 <p className="text-sm mt-1 opacity-90">{signal.note}</p>
 )}
 </div>
 </div>
 <span className="text-xs whitespace-nowrap ml-4">
 {new Date(signal.created_at).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} {new Date(signal.created_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })} ET
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
 <button
 onClick={onClose}
 className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 );
}
