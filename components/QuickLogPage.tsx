'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Loader2, Calendar, Star } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/Toast';
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
    category?: string;
    reasons?: string[];
    flags?: Array<{
      category: string;
      reasons: string[];
    }>;
    note?: string;
  };
  isDraft?: boolean;
}

interface QuickLogPageProps {
  onCancel?: () => void;
  initialClassId?: string;
}

export default function QuickLogPage({ onCancel, initialClassId }: QuickLogPageProps = {}) {
  const { showToast } = useToast();
  const { classes, loading: classesLoading } = useClasses();
  const [activeClassId, setActiveClassId] = useState<string | null>(initialClassId || null);
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incompleteSessions, setIncompleteSessions] = useState<IncompleteLogSession[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [selectedFlagModal, setSelectedFlagModal] = useState<{
    type: 'super-green' | 'yellow' | 'red' | 'absent';
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
        const workingDays = dates.filter(date => {
          const d = new Date(date + 'T00:00:00');
          const day = d.getDay();
          return day !== 0 && day !== 6;
        });
        setAvailableDates(workingDays);
        if (workingDays.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          if (!workingDays.includes(today)) {
            setSelectedDate(workingDays[0]);
          }
        }
        setIncompleteSessions(sessions);
      } catch (err) {
        console.error('Failed to fetch initial QuickLog data', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch classes and set active class (only if not already set via initialClassId)
  useEffect(() => {
    if (!classesLoading && classes.length > 0 && !activeClassId) {
      setActiveClassId(classes[0].id);
    }
  }, [classes, classesLoading, activeClassId]);

  // 1. Fetch students from API
  useEffect(() => {
    setSaveSuccess(false);
    setSaveError(null);
    const fetchStudents = async () => {
      if (!activeClassId) return;
      setStudentsLoading(true);
      try {
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        const data = await getClassStudents(activeClassId, targetDate);
        setApiStudents(data);
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [activeClassId, selectedDate]);

  // 2. Compute logData locally
  useEffect(() => {
    if (apiStudents.length === 0) {
      setLogData({});
      return;
    }

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    const draftSession = incompleteSessions.find(
      s => s.class_id === activeClassId && s.signal_date === targetDate
    );

    const initialLogData: Record<string, LogEntry> = {};
    apiStudents.forEach(s => {
      const savedSignals = s.signals || [];

      if (savedSignals.length > 0) {
        const primary = savedSignals[0];
        const signalType = primary.signal_type;

        if (signalType === 'yellow' || signalType === 'red') {
          const flags = savedSignals
            .filter(sig => sig.signal_type === signalType)
            .map(sig => ({
              category: sig.category || 'academic',
              reasons: sig.reason_description ? sig.reason_description.split(', ').filter(Boolean) : [],
            }));

          initialLogData[s.id] = {
            studentId: s.id, green: false, superGreen: false, yellow: signalType === 'yellow', red: signalType === 'red', absent: false,
            flagData: { type: signalType, flags, note: primary.note || undefined },
          };
        } else if (signalType === 'super_green') {
          const reasonCode = primary.reason_code || '';
          const reasonDisplay = reasonCode.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          initialLogData[s.id] = {
            studentId: s.id, green: false, superGreen: true, yellow: false, red: false, absent: false,
            flagData: { type: 'super-green', reasons: reasonDisplay ? [reasonDisplay] : [], note: primary.note || undefined },
          };
        } else if (signalType === 'absent') {
          initialLogData[s.id] = { studentId: s.id, green: false, superGreen: false, yellow: false, red: false, absent: true };
        } else {
          initialLogData[s.id] = { studentId: s.id, green: true, superGreen: false, yellow: false, red: false, absent: false };
        }
      } else {
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
          initialLogData[s.id] = { studentId: s.id, green: true, superGreen: false, yellow: false, red: false, absent: false };
        }
      }
    });
    setLogData(initialLogData);
  }, [apiStudents, incompleteSessions, selectedDate, activeClassId]);

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
    setSaveError(null);
    setSaveSuccess(false);

    const signalsToLog = Object.entries(logData)
      .filter(([_, entry]) => entry.superGreen || entry.green || entry.yellow || entry.red || entry.absent)
      .flatMap(([studentId, entry]) => {
        let signalType: 'present' | 'yellow' | 'red' | 'super_green' | 'absent' = 'present';
        if (entry.red) signalType = 'red';
        else if (entry.yellow) signalType = 'yellow';
        else if (entry.superGreen) signalType = 'super_green';
        else if (entry.absent) signalType = 'absent';

        if (signalType === 'yellow' || signalType === 'red') {
          const flags = entry.flagData?.flags || [];
          if (flags.length > 0) {
            return flags.map((flag: any) => {
              const reasonsText = flag.reasons?.join(', ') || '';
              let mappedReasonCode: string | undefined = undefined;

              if (signalType === 'red' && flag.category === 'academic') {
                if (reasonsText.toLowerCase().includes('cheating')) {
                  mappedReasonCode = 'cheating';
                }
              }

              return {
                student_id: studentId,
                class_id: activeClassId,
                signal_date: selectedDate || new Date().toISOString().split('T')[0],
                signal_type: signalType as any,
                category: flag.category,
                reason_code: mappedReasonCode,
                reason_description: reasonsText || undefined,
                note: entry.flagData?.note || reasonsText || (signalType === 'red' ? 'Needs review' : undefined),
                save_for_later: signalType === 'red' && !reasonsText && !entry.flagData?.note,
              };
            });
          }
        }

        const reasonsText = entry.flagData?.reasons?.join(', ') || '';
        let mappedReasonCode: string | undefined = undefined;

        // Backend validation rules require specific reason codes for certain signals
        if (signalType === 'super_green' && entry.flagData?.reasons?.length) {
          const firstReason = entry.flagData.reasons[0].toLowerCase().replace(/ /g, '_');
          mappedReasonCode = firstReason;
        }

        // For green/present and absent signals, don't send empty strings
        const noteValue = entry.flagData?.note || reasonsText || undefined;

        return [{
          student_id: studentId,
          class_id: activeClassId,
          signal_date: selectedDate || new Date().toISOString().split('T')[0],
          signal_type: signalType as any,
          category: undefined,
          reason_code: mappedReasonCode,
          reason_description: reasonsText || undefined,
          note: noteValue,
          save_for_later: false,
        }];
      });

    if (signalsToLog.length === 0) {
      setSaveError('No signals selected to log.');
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

    // ── Save with feedback: stay on page so teacher can review/edit ──
    logger.formSubmit('QuickLog', {
      date: new Date().toLocaleDateString(),
      entries: signalsToLog.length
    });

    setSaving(true);

    // Fire API call — keep the page open for edit/correction workflow
    logSignals(payload)
      .then(async () => {
        setSaving(false);
        showToast(`${signalsToLog.length} signal${signalsToLog.length > 1 ? 's' : ''} saved successfully`, 'success');
        setSaveSuccess(true);
        // Invalidate cache so dashboard & classes refresh on next visit
        cacheInvalidate();
        // Notify other components (like Dashboard) to refresh their data
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboard-refresh'));
        }
      })
      .catch((err: any) => {
        setSaving(false);
        console.error('Failed to save quick log:', err);
        const errorMsg = err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || 'Failed to save signals. Please try again.';
        showToast(errorMsg, 'error');
      });

    // Close immediately without waiting for the save to complete
    if (onCancel) {
      onCancel();
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

    // Simple toggle statuses (no modal needed)
    if (status === 'absent' || status === 'green') {
      const colorMap = {
        absent: {
          active: 'bg-gray-300 hover:bg-gray-400',
          inactive: 'bg-gray-100 hover:bg-gray-200',
        },
        green: {
          active: 'bg-emerald-300 hover:bg-emerald-400',
          inactive: 'bg-gray-100 hover:bg-gray-200',
        },
      };
      const colors = colorMap[status];
      return (
        <div className="flex justify-center">
          <button
            onClick={() => toggleStatus(studentId, status)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? colors.active : colors.inactive
              }`}
          >
            {isActive && <Check className="w-4 h-4 text-white" />}
          </button>
        </div>
      );
    }

    const statusMap: Record<string, 'super-green' | 'yellow' | 'red'> = {
      superGreen: 'super-green',
      yellow: 'yellow',
      red: 'red',
    };

    const statusColors = {
      'super-green': 'bg-emerald-500 hover:bg-emerald-600',
      yellow: 'bg-amber-300 hover:bg-amber-400',
      red: 'bg-rose-300 hover:bg-rose-400',
    };

    const flagsCount = (status === 'yellow' || status === 'red') && isActive
      ? (logData[studentId]?.flagData?.flags?.length || 0)
      : 0;

    return (
      <div className="flex justify-center">
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
          className={`w-8 h-8 rounded-full transition-all flex items-center justify-center text-xs font-bold ${isActive
            ? `${statusColors[statusMap[status]]} text-amber-950 ring-2 ring-offset-2 ring-offset-white ring-gray-400`
            : 'bg-gray-100 hover:bg-gray-200 text-transparent'
            }`}
        >
          {flagsCount > 1 ? flagsCount : ''}
        </button>
      </div>
    );
  };

  const stats = {
    superGreen: Object.values(logData).filter(v => v.superGreen).length,
    green: Object.values(logData).filter(v => v.green).length,
    yellow: Object.values(logData).filter(v => v.yellow).length,
    red: Object.values(logData).filter(v => v.red).length,
    absent: Object.values(logData).filter(v => v.absent).length,
    loggedCount: Object.values(logData).filter(v => v.superGreen || v.green || v.yellow || v.red || v.absent).length,
    totalStudents: mappedStudents.length
  };
  const loggedPercentage = stats.totalStudents > 0 ? Math.round((stats.loggedCount / stats.totalStudents) * 100) : 0;

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Flag Modal */}
      {selectedFlagModal && (
        <FlagModal
          flagType={selectedFlagModal.type}
          student={selectedFlagModal.student}
          apiStudent={apiStudents.find(s => s.id === selectedFlagModal.student.id)}
          initialData={logData[selectedFlagModal.student.id]?.flagData}
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

      {/* Today's Class Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Today's Class Summary</h3>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {stats.superGreen}
              </div>
              <span className="text-xs text-gray-500">Super Green</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                {stats.green}
              </div>
              <span className="text-xs text-gray-500">Green</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                {stats.yellow}
              </div>
              <span className="text-xs text-gray-500">Yellow</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                {stats.red}
              </div>
              <span className="text-xs text-gray-500">Red</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-900" />
                {stats.absent}
              </div>
              <span className="text-xs text-gray-500">Absent</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-bold text-gray-900">{stats.loggedCount} / {stats.totalStudents} Logged</span>
          </div>
          <span className="text-xs text-gray-500 mb-2 block">{loggedPercentage}% Complete</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${loggedPercentage}%` }}></div>
          </div>
        </div>
      </div>

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
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === mappedStudents.length - 1 ? 'border-b-0' : ''
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
                    <td className="px-4 py-2">
                      {getStatusIndicator(student.id, 'superGreen')}
                    </td>
                    <td className="px-4 py-2">
                      {getStatusIndicator(student.id, 'green')}
                    </td>
                    <td className="px-4 py-2">
                      {getStatusIndicator(student.id, 'yellow')}
                    </td>
                    <td className="px-4 py-2">
                      {getStatusIndicator(student.id, 'red')}
                    </td>
                    <td className="px-4 py-2">
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
