'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import FlagModal from '@/components/FlagModal';
import { useClasses } from '@/lib/useClasses';
import { getClassStudents, logSignals, Student as ApiStudent } from '@/lib/studentService';

interface Student {
  id: string;
  name: string;
  grade: number;
  period?: number;
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
  };
}

export default function QuickLogPage() {
  const { classes, loading: classesLoading } = useClasses();
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [selectedFlagModal, setSelectedFlagModal] = useState<{
    type: 'super-green' | 'green' | 'yellow' | 'red' | 'absent';
    student: Student;
  } | null>(null);
  const itemsPerPage = 7;

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
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [activeClassId]);

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

  const totalPages = Math.ceil(mappedStudents.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = mappedStudents.slice(startIdx, startIdx + itemsPerPage);

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
            signal_date: new Date().toISOString().split('T')[0],
            signal_type: signalType,
            category: (signalType === 'yellow' || signalType === 'red') 
              ? (entry.flagData?.category || 'academic') 
              : undefined,
            reason_code: mappedReasonCode,
            reason_description: reasonsText || undefined,
            note: reasonsText || (signalType === 'red' ? 'Needs review' : ''),
            save_for_later: signalType === 'red' && !reasonsText,
          };
        });

      if (signalsToLog.length === 0) {
        setSaveError('No signals selected to log.');
        setSaving(false);
        return;
      }

      await logSignals({ signals: signalsToLog as any });
      
      logger.formSubmit('QuickLog', { 
        date: new Date().toLocaleDateString(),
        entries: signalsToLog.length 
      });
      
      setSaveSuccess(true);
      
      // Notify other components (like Dashboard) to refresh their data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dashboard-refresh'));
      }

      setTimeout(() => {
        setSaveSuccess(false);
        setLogData({});
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
  };

  const getStatusIndicator = (studentId: string, status: keyof LogEntry) => {
    const isActive = logData[studentId]?.[status];
    const student = paginatedStudents.find((s) => s.id === studentId);
    
    if (status === 'absent') {
      return isActive ? (
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
    <div className="space-y-6">
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
          <h2 className="text-2xl font-bold text-gray-900">Daily Quick Log</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor top student concerns day to day performance</p>
        </div>
        {classes.length > 0 && (
          <select
            value={activeClassId || ''}
            onChange={(e) => {
              setActiveClassId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - Period {c.period}</option>
            ))}
          </select>
        )}
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <span>Super Green</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-300" />
                    <span>Green</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-amber-300" />
                    <span>Yellow</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-rose-300" />
                    <span>Red</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Absent</th>
              </tr>
            </thead>
            <tbody>
              {classesLoading || studentsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No students found in this class.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    idx === paginatedStudents.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.bgColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {student.initial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">Grade {student.grade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusIndicator(student.id, 'superGreen')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusIndicator(student.id, 'green')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusIndicator(student.id, 'yellow')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusIndicator(student.id, 'red')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusIndicator(student.id, 'absent')}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            logger.buttonClick('Previous page', 'QuickLog');
            setCurrentPage((p) => Math.max(1, p - 1));
          }}
          disabled={currentPage === 1}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => {
                  logger.buttonClick(`Page ${pageNum}`, 'QuickLog');
                  setCurrentPage(pageNum);
                }}
                className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 7 && (
            <>
              <span className="text-gray-400">...</span>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => {
            logger.buttonClick('Next page', 'QuickLog');
            setCurrentPage((p) => Math.min(totalPages, p + 1));
          }}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Flag Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Flags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Super Green</p>
              <p className="text-sm text-gray-600">Going above and beyond</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-4 h-4 rounded-full bg-emerald-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Green</p>
              <p className="text-sm text-gray-600">Doing fine / normal</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-4 h-4 rounded-full bg-amber-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Yellow</p>
              <p className="text-sm text-gray-600">Mild warning or light issue</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-4 h-4 rounded-full bg-rose-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Red</p>
              <p className="text-sm text-gray-600">Urgent problem</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-4 h-4 rounded-full bg-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Neutral</p>
              <p className="text-sm text-gray-600">Not Present / no data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
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
