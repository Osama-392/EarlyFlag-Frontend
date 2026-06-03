'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Loader2, Calendar } from 'lucide-react';
import { logger } from '@/lib/logger';
import FlagModal from '@/components/FlagModal';
import { useClasses } from '@/lib/useClasses';
import { getClassStudents, logSignals, getAvailableSignalDates, getIncompleteQuickLogs, Student as ApiStudent, IncompleteLogSession } from '@/lib/studentService';
import { cacheInvalidate } from '@/lib/dataCache';

interface Student {
  id: string;
  name: string;
  grade: number;
  period?: number | string;
  initial: string;
  bgColor: string;
}

interface LogEntry {
  studentId: string;
  superGreen?: boolean;
  green?: boolean;
  yellow?: boolean;
  red?: boolean;
  absent?: boolean;
  flagData?: {
    type: string;
    category: string;
    reasons: string[];
    note?: string;
  };
  isDraft?: boolean;
}

interface QuickLogPageProps {
  onCancel?: () => void;
}

export default function QuickLogPage({ onCancel }: QuickLogPageProps = {}) {
  const { classes, loading: classesLoading } = useClasses();
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [incompleteSessions, setIncompleteSessions] = useState<IncompleteLogSession[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [selectedFlagModal, setSelectedFlagModal] = useState<{
    type: 'super-green' | 'green' | 'yellow' | 'red' | 'absent';
    student: Student;
  } | null>(null);
  const itemsPerPage = 5;

  // Fetch available dates and incomplete sessions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dates, sessions] = await Promise.all([
          getAvailableSignalDates(),
          getIncompleteQuickLogs()
        ]);
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]); // Default to today (first date)
        }
        setIncompleteSessions(sessions);
      } catch (err) {
        console.error('Failed to fetch initial QuickLog data', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch classes and set active class
  useEffect(() => {
    if (!classesLoading && classes.length > 0 && !activeClassId) {
      setActiveClassId(classes[0].id);
    }
  }, [classes, classesLoading, activeClassId]);

  // Fetch students when active class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!activeClassId) return;
      setStudentsLoading(true);
      try {
        const data = await getClassStudents(activeClassId);
        setApiStudents(data);
        
        // Find if we have an incomplete session for this class and date
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        const draftSession = incompleteSessions.find(
          s => s.class_id === activeClassId && s.signal_date === targetDate
        );

        // Initialize logData with green signals by default, or draft signals if they exist
        const initialLogData: Record<string, LogEntry> = {};
        data.forEach(s => {
          const draftSignal = draftSession?.signals.find(sig => sig.student_id === s.id);
          
          if (draftSignal) {
            initialLogData[s.id] = {
              studentId: s.id,
              green: draftSignal.signal_type === 'present',
              superGreen: draftSignal.signal_type === 'super_green',
              yellow: draftSignal.signal_type === 'yellow',
              red: draftSignal.signal_type === 'red',
              absent: draftSignal.signal_type === 'absent',
              isDraft: true,
              flagData: draftSignal.signal_type === 'yellow' || draftSignal.signal_type === 'red' || draftSignal.signal_type === 'super_green' ? {
                type: draftSignal.signal_type,
                category: draftSignal.category || 'academic',
                reasons: draftSignal.reasons || [],
                note: draftSignal.note
              } : undefined
            };
          } else {
            initialLogData[s.id] = {
              studentId: s.id,
              green: true,
              superGreen: false,
              yellow: false,
              red: false,
              absent: false
            };
          }
        });
        setLogData(initialLogData);
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [activeClassId, selectedDate, incompleteSessions]);

  // Map API students to local Student interface
  const mappedStudents: Student[] = apiStudents.map((s, idx) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-cyan-400 to-cyan-600',
      'from-red-400 to-red-600',
      'from-gray-400 to-gray-600',
      'from-emerald-400 to-emerald-600',
      'from-amber-400 to-amber-600',
    ];
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      grade: parseInt(s.grade_level) || 9,
      period: classes.find(c => c.id === activeClassId)?.period || 1,
      initial: `${s.first_name[0]}${s.last_name[0]}`.toUpperCase(),
      bgColor: colors[idx % colors.length],
    };
  });



  const toggleStatus = (studentId: string, status: keyof LogEntry) => {
    logger.formChange(`student-status-${status}`, true, 'QuickLog');
    setLogData((prev) => {
      const isCurrentlyActive = prev[studentId]?.[status];
      if (isCurrentlyActive) {
        // Just turn it off
        return {
          ...prev,
          [studentId]: {
            ...prev[studentId],
            [status]: false,
          },
        };
      }
      
      // Turn it on and clear all others
      return {
        ...prev,
        [studentId]: {
          studentId,
          superGreen: false,
          green: false,
          yellow: false,
          red: false,
          absent: false,
          flagData: undefined,
          [status]: true,
        },
      };
    });
  };

  const handleSaveLog = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const signalsToLog = Object.entries(logData)
        .filter(([_, entry]) => entry.superGreen || entry.green || entry.yellow || entry.red || entry.absent)
        .map(([studentId, entry]) => {
          let signalType: 'present' | 'yellow' | 'red' | 'super_green' | 'absent' = 'present';
          if (entry.red) signalType = 'red';
          else if (entry.yellow) signalType = 'yellow';
          else if (entry.superGreen) signalType = 'super_green';
          else if (entry.absent) signalType = 'absent';

          const reasonsText = entry.flagData?.reasons?.join(', ') || '';
          let mappedReasonCode: string | undefined = undefined;

          // Backend validation rules require specific reason codes for certain signals
          if (signalType === 'super_green' && entry.flagData?.reasons?.length) {
             const firstReason = entry.flagData.reasons[0].toLowerCase().replace(/ /g, '_');
             mappedReasonCode = firstReason;
          } else if (signalType === 'red' && entry.flagData?.category === 'academic') {
             if (reasonsText.toLowerCase().includes('cheating')) {
                mappedReasonCode = 'cheating';
             }
          }

          return {
            student_id: studentId,
            class_id: activeClassId,
            signal_date: selectedDate || new Date().toISOString().split('T')[0],
            signal_type: signalType,
            category: (signalType === 'yellow' || signalType === 'red') 
              ? (entry.flagData?.category || 'academic') 
              : undefined,
            reason_code: mappedReasonCode,
            reason_description: reasonsText || undefined,
            note: entry.flagData?.note || reasonsText || (signalType === 'red' ? 'Needs review' : ''),
            save_for_later: signalType === 'red' && !reasonsText && !entry.flagData?.note,
          };
        });

      if (signalsToLog.length === 0) {
        setSaveError('No signals selected to log.');
        setSaving(false);
        return;
      }

      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      const draftSession = incompleteSessions.find(
        s => s.class_id === activeClassId && s.signal_date === targetDate
      );

      const payload: any = { signals: signalsToLog };
      if (draftSession) {
        payload.session_id = draftSession.session_id;
      }

      await logSignals(payload);
      
      logger.formSubmit('QuickLog', { 
        date: new Date().toLocaleDateString(),
        entries: signalsToLog.length 
      });
      
      setSaveSuccess(true);
      
      // Invalidate cache so dashboard & classes refresh on next visit
      cacheInvalidate();

      // Notify other components (like Dashboard) to refresh their data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dashboard-refresh'));
      }

      setTimeout(() => {
        setSaveSuccess(false);
        setLogData({});
        // Auto-close the modal after showing success message
        if (onCancel) {
          onCancel();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Failed to save quick log:', err);
      setSaveError(err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || 'Failed to save logs.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    logger.buttonClick('Cancel Quick Log', 'QuickLog');
    setLogData({});
    if (onCancel) {
      onCancel();
    }
  };

  const getStatusIndicator = (studentId: string, status: keyof LogEntry) => {
    const isActive = logData[studentId]?.[status];
    const student = mappedStudents.find((s) => s.id === studentId);
    
    if (status === 'absent') {
      return (
        <div className="flex justify-center">
          {isActive ? (
            <button
              onClick={() => toggleStatus(studentId, status)}
              className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
            >
              <Check className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={() => toggleStatus(studentId, status)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            />
          )}
        </div>
      );
    }

    const statusMap: Record<string, 'super-green' | 'green' | 'yellow' | 'red'> = {
      superGreen: 'super-green',
      green: 'green',
      yellow: 'yellow',
      red: 'red',
    };

    const statusColors = {
      'super-green': 'bg-emerald-500 hover:bg-emerald-600',
      green: 'bg-emerald-300 hover:bg-emerald-400',
      yellow: 'bg-amber-300 hover:bg-amber-400',
      red: 'bg-rose-300 hover:bg-rose-400',
    };

    return (
      <button
        onClick={() => {
          if (student) {
            logger.buttonClick(`Open flag modal for ${statusMap[status]}`, 'QuickLog');
            setSelectedFlagModal({
              type: statusMap[status],
              student,
            });
          }
        }}
        className={`w-8 h-8 rounded-full transition-all ${
          isActive
            ? `${statusColors[statusMap[status]]} ring-2 ring-offset-2 ring-offset-white ring-gray-400`
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* Flag Modal */}
      {selectedFlagModal && (
        <FlagModal
          flagType={selectedFlagModal.type}
          student={selectedFlagModal.student}
          onClose={() => setSelectedFlagModal(null)}
          onSubmit={(data) => {
            logger.info('Flag submitted', data, 'QuickLog');
            const newStatus = selectedFlagModal.type === 'super-green' ? 'superGreen' : selectedFlagModal.type;
            
            // Mark the flag as selected and clear out others
            setLogData((prev) => ({
              ...prev,
              [selectedFlagModal.student.id]: {
                studentId: selectedFlagModal.student.id,
                superGreen: false,
                green: false,
                yellow: false,
                red: false,
                absent: false,
                [newStatus]: true,
                flagData: data,
              },
            }));
          }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily Quick Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">Monitor top student concerns day to day performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Selector */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {availableDates.map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const label = isToday
                    ? `Today – ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <option key={date} value={date}>{label}</option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Class Selector */}
          <select
            value={activeClassId || ''}
            onChange={(e) => {
              setActiveClassId(e.target.value);
              setCurrentPage(1);
            }}
            disabled={classesLoading || classes.length === 0}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px]"
          >
            {classesLoading ? (
              <option value="">Loading classes...</option>
            ) : classes.length > 0 ? (
              classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - Period {c.period}
                </option>
              ))
            ) : (
              <option value="">No classes found</option>
            )}
          </select>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          Quick log saved successfully!
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          {saveError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Super Green</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-300" />
                    <span>Green</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                    <span>Yellow</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-rose-300" />
                    <span>Red</span>
                  </div>
                </th>
                <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">Absent</th>
              </tr>
            </thead>
            <tbody>
              {classesLoading || studentsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : mappedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No students found in this class.
                  </td>
                </tr>
              ) : (
                mappedStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    idx === mappedStudents.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${student.bgColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                      >
                        {student.initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                          {logData[student.id]?.isDraft && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Grade {student.grade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {getStatusIndicator(student.id, 'superGreen')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {getStatusIndicator(student.id, 'green')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {getStatusIndicator(student.id, 'yellow')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {getStatusIndicator(student.id, 'red')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {getStatusIndicator(student.id, 'absent')}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Flag Legend - compact inline */}
      <div className="flex items-center flex-wrap gap-4 px-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Flags:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Super Green</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-300 inline-block" /> Green</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-300 inline-block" /> Yellow</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-300 inline-block" /> Red</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Absent</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSaveLog}
          disabled={saving || Object.keys(logData).length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Log'
          )}
        </button>
      </div>
    </div>
  );
}
