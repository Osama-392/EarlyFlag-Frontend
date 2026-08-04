'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Student } from '@/lib/studentService';

interface FlagModalProps {
  flagType: 'super-green' | 'green' | 'yellow' | 'red' | 'absent';
  student: {
    id: string;
    name: string;
    grade: number;
    period?: number | string;
    initial: string;
    bgColor: string;
  };
  apiStudent?: Student;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function FlagModal({
  flagType,
  student,
  apiStudent,
  initialData,
  onClose,
  onSubmit,
}: FlagModalProps) {
  // We no longer track selected categories explicitly. 
  // Instead, categories are implicitly selected when their reasons are chosen.
  const [selectedReasons, setSelectedReasons] = useState<string[]>(
    initialData?.reasons || initialData?.flags?.flatMap((f: any) => f.reasons) || []
  );
  const [note, setNote] = useState(initialData?.note || '');

  const flagConfig = {
    'super-green': {
      title: 'Super Green',
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-900" />
        </div>
      ),
      studentBg: 'bg-slate-50 dark:bg-[#1b1e2c]',
      activeCategoryBg: 'bg-emerald-500 text-white border-emerald-500',
      selectedReasonBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-500 ring-1 ring-inset ring-emerald-500 font-semibold',
      reasons: [
        'Leadership',
        'Academic growth',
        'Helping others',
        'Exceptional participation',
        'Kindness',
      ],
      categories: ['positive'],
    },
    green: {
      title: 'Green Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-300 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-800" />
        </div>
      ),
      studentBg: 'bg-slate-50 dark:bg-[#1b1e2c]',
      activeCategoryBg: 'bg-emerald-400 text-white border-emerald-400',
      selectedReasonBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-500 ring-1 ring-inset ring-emerald-500 font-semibold',
      reasons: [],
      categories: ['default'],
    },
    yellow: {
      title: 'Yellow Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-900" fill="currentColor" />
        </div>
      ),
      studentBg: 'bg-[#f4f7fb] dark:bg-[#1b1e2c]',
      activeCategoryBg: 'bg-[#ffca4b] text-amber-900 border-[#ffca4b]',
      selectedReasonBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-400 ring-1 ring-inset ring-amber-400 font-semibold',
      reasons: {
        academic: [
          'Missing assignment',
          'Low test score',
          'Needs support',
          'Incomplete work',
          'Off-task behavior',
        ],
        behavioral: [
          'Talking out of turn',
          'Disrupting others',
          'Needs directions',
          'Off task',
        ],
      },
      categories: ['academic', 'behavioral'],
    },
    red: {
      title: 'Red Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-white" fill="currentColor" />
        </div>
      ),
      studentBg: 'bg-slate-50 dark:bg-[#1b1e2c]',
      activeCategoryBg: 'bg-red-500 text-white border-red-500',
      selectedReasonBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100 border-rose-500 ring-1 ring-inset ring-rose-500 font-semibold',
      reasons: {
        academic: ['Cheating'],
        behavioral: [
          'Fighting',
          'Bullying',
          'Refusing directions',
          'Leaving class',
          'Other severe behavior',
        ],
      },
      categories: ['academic', 'behavioral'],
    },
    absent: {
      title: 'Not In Class',
      icon: (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-600" />
        </div>
      ),
      studentBg: 'bg-slate-50 dark:bg-[#1b1e2c]',
      activeCategoryBg: 'bg-gray-500 text-white border-gray-500',
      selectedReasonBg: 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-400 ring-1 ring-inset ring-gray-400 font-semibold',
      reasons: [],
      categories: [],
    },
  };

  const config = flagConfig[flagType];

  const hasReasons = typeof config.reasons === 'object' && 'academic' in config.reasons
    ? config.categories.some(cat => ((config.reasons as any)[cat] || []).length > 0)
    : Array.isArray(config.reasons) && config.reasons.length > 0;

  const toggleReason = (reason: string, categoryName?: string) => {
    logger.formChange(`flag-reason-${reason}`, true, 'FlagModal');

    if (selectedReasons.includes(reason)) {
      // Removing reason
      setSelectedReasons(prev => prev.filter((r) => r !== reason));
    } else {
      // Adding reason
      setSelectedReasons(prev => [...prev, reason]);
    }
  };

  const handleSubmit = () => {
    // For flag types with categorized reasons (yellow/red), group by category
    // For flat reason arrays (super-green), pass reasons directly
    const isCategorized = typeof config.reasons === 'object' && !Array.isArray(config.reasons);

    let flags: Array<{ category: string; reasons: string[] }> = [];
    if (isCategorized) {
      flags = config.categories.map(cat => {
        const catReasons = (config.reasons as any)[cat] || [];
        const reasonsSelected = selectedReasons.filter(r => catReasons.includes(r));
        return {
          category: cat,
          reasons: reasonsSelected
        };
      }).filter(f => f.reasons.length > 0);
    }

    logger.formSubmit('FlagModal', {
      flagType,
      studentId: student.id,
      reasons: selectedReasons,
      flags,
    });
    onSubmit({
      flagType,
      studentId: student.id,
      flags,
      reasons: selectedReasons,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#151722] rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-[#262a3d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <h2 className="text-xl font-medium text-slate-800 dark:text-white">{config.title}</h2>
          </div>
          <button
            onClick={() => {
              logger.buttonClick('Close Flag Modal', 'FlagModal');
              onClose();
            }}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Student Info */}
          <div className={`${config.studentBg} rounded-xl p-4 flex items-center space-x-4 mb-6`}>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
              {student.initial}
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-white text-lg">{student.name}</p>
              <p className="text-sm text-slate-500">
                Grade {student.grade} • Period {student.period}
              </p>
            </div>
          </div>

          {/* Weekly Status History */}
          {apiStudent?.recent_history && (
            <div className="mb-6 bg-slate-50 dark:bg-[#1b1e2c] border border-slate-100 dark:border-[#262a3d] rounded-xl p-4">
              <p className="text-[13px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                7-Day Flag History
              </p>
              <div className="flex justify-between items-center">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                  const dateStr = localDate.toISOString().split('T')[0];

                  // Find signal on this date
                  const daySignal = apiStudent.recent_history?.find(s => s.signal_date === dateStr);
                  const status = daySignal?.signal_type || 'present';

                  // Determine colors based on status
                  let statusBg = 'bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-400';
                  let statusDot = 'bg-slate-300 dark:bg-slate-600';
                  let label = 'Present';

                  if (status === 'red') {
                    statusBg = 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400';
                    statusDot = 'bg-rose-500';
                    label = 'Red';
                  } else if (status === 'yellow') {
                    statusBg = 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400';
                    statusDot = 'bg-amber-400';
                    label = 'Yellow';
                  } else if (status === 'super_green') {
                    statusBg = 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                    statusDot = 'bg-emerald-600';
                    label = 'S. Green';
                  } else if (status === 'absent') {
                    statusBg = 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
                    statusDot = 'bg-gray-500';
                    label = 'Absent';
                  } else if (status === 'present' || status === 'green') {
                    statusBg = 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-500';
                    statusDot = 'bg-emerald-400';
                    label = 'Present';
                  }

                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
                  const isToday = dateStr === localNow.toISOString().split('T')[0];

                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {dayName}
                      </span>
                      <div className={`w-8 h-8 rounded-lg ${statusBg} flex items-center justify-center relative group cursor-help ${isWeekend ? 'opacity-40 grayscale' : ''}`} title={`${dayName}: ${label}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 shadow-md">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason Selection */}
          {typeof config.reasons === 'object' && 'academic' in config.reasons ? (
            <div className="mb-6 space-y-6">
              {config.categories.map((cat, idx) => {
                const catReasons = (config.reasons as any)[cat] || [];
                if (catReasons.length === 0) return null;
                return (
                  <div key={cat} className={`${idx > 0 ? 'pt-6 border-t border-gray-100 dark:border-[#262a3d]' : ''}`}>
                    <p className="text-[16px] font-bold text-[#1e293b] dark:text-white mb-4 capitalize font-sora">{cat} Flag(s)</p>
                    <div className="flex flex-wrap gap-2.5">
                      {catReasons.map((reason: string) => (
                        <button
                          key={reason}
                          onClick={() => toggleReason(reason, cat)}
                          className={`px-4 py-2.5 rounded-full text-sm transition-all font-medium border shadow-sm hover:shadow ${selectedReasons.includes(reason)
                            ? (config as any).selectedReasonBg || 'bg-[#f8fafc] dark:bg-slate-800 text-[#0f172a] dark:text-white border-[#cbd5e1] dark:border-slate-600 ring-1 ring-inset ring-[#cbd5e1] dark:ring-slate-600'
                            : 'bg-white dark:bg-[#1b1e2c] text-[#64748b] dark:text-gray-400 border-[#e2e8f0] dark:border-slate-700 hover:border-[#cbd5e1] dark:hover:border-slate-500'
                            }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            Array.isArray(config.reasons) && config.reasons.length > 0 && (
              <div className="mb-6">
                <p className="text-[15px] font-medium text-slate-700 dark:text-gray-200 mb-3">Select reason(s)</p>
                <div className="flex flex-wrap gap-2.5">
                  {config.reasons.map((reason: string) => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`px-4 py-2 rounded-full text-sm transition-all font-medium border ${selectedReasons.includes(reason)
                        ? (config as any).selectedReasonBg || 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white dark:bg-[#1b1e2c] text-slate-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                        }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Warning Message */}
          {flagType === 'yellow' && (
            <div className="border border-amber-200 dark:border-amber-900/30 bg-[#fffdf0] dark:bg-amber-900/10 rounded-lg p-3 flex items-center space-x-2 mb-2">
              <span className="text-amber-600 dark:text-amber-500 font-bold text-sm">!</span>
              <p className="text-sm text-amber-700 dark:text-amber-500">
                3 more flags → Red urgent
              </p>
            </div>
          )}

          {selectedReasons.length > 0 && flagType === 'red' && (
            <div className="border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg p-3 flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-500">
                This will trigger an <span className="font-semibold">admin notification</span>
              </p>
            </div>
          )}

          {/* Notes (Mandatory for Super Green & Red, Optional for Yellow) */}
          {(flagType === 'super-green' || flagType === 'yellow' || flagType === 'red') && (
            <div className="mt-4">
              <label className="text-[15px] font-medium text-slate-700 dark:text-gray-200 mb-2 block">
                Notes {(flagType === 'super-green' || flagType === 'red') && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={flagType === 'super-green' ? 'Add details about this recognition...' : 'Add context for this flag...'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-[#1b1e2c] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-none"
                required={flagType === 'super-green' || flagType === 'red'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#262a3d] flex items-center justify-between">
          <button
            onClick={() => {
              logger.buttonClick('Cancel Flag Modal', 'FlagModal');
              onClose();
            }}
            className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (hasReasons && selectedReasons.length === 0) ||
              ((flagType === 'super-green' || flagType === 'red') && !note.trim())
            }
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${((hasReasons && selectedReasons.length === 0) || ((flagType === 'super-green' || flagType === 'red') && !note.trim()))
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}
