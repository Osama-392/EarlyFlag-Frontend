'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { logger } from '@/lib/logger';
import FlagModal from '@/components/FlagModal';

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
}

export default function QuickLogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [logData, setLogData] = useState<Record<string, LogEntry>>({});
  const [selectedFlagModal, setSelectedFlagModal] = useState<{
    type: 'super-green' | 'green' | 'yellow' | 'red' | 'absent';
    student: Student;
  } | null>(null);
  const itemsPerPage = 7;

  // Mock student data
  const mockStudents: Student[] = [
    { id: '1', name: 'James Wilson', grade: 11, period: 3, initial: 'JW', bgColor: 'from-blue-400 to-blue-600' },
    { id: '2', name: 'Amelia Taylor', grade: 9, period: 3, initial: 'AT', bgColor: 'from-purple-400 to-purple-600' },
    { id: '3', name: 'Benjamin Moore', grade: 11, period: 3, initial: 'BM', bgColor: 'from-cyan-400 to-cyan-600' },
    { id: '4', name: 'Mia Anderson', grade: 9, period: 3, initial: 'MA', bgColor: 'from-red-400 to-red-600' },
    { id: '5', name: 'Oliver White', grade: 10, period: 3, initial: 'OW', bgColor: 'from-gray-400 to-gray-600' },
    { id: '6', name: 'Sophia Davis', grade: 12, period: 3, initial: 'SD', bgColor: 'from-pink-400 to-pink-600' },
    { id: '7', name: 'Lucas Brown', grade: 10, period: 3, initial: 'LB', bgColor: 'from-green-400 to-green-600' },
    { id: '8', name: 'Emma Johnson', grade: 11, period: 3, initial: 'EJ', bgColor: 'from-yellow-400 to-yellow-600' },
    { id: '9', name: 'Noah Martinez', grade: 9, period: 3, initial: 'NM', bgColor: 'from-indigo-400 to-indigo-600' },
    { id: '10', name: 'Ava Garcia', grade: 12, period: 3, initial: 'AG', bgColor: 'from-teal-400 to-teal-600' },
  ];

  const totalPages = Math.ceil(mockStudents.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = mockStudents.slice(startIdx, startIdx + itemsPerPage);

  const toggleStatus = (studentId: string, status: keyof LogEntry) => {
    logger.formChange(`student-status-${status}`, true, 'QuickLog');
    setLogData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [status]: !prev[studentId]?.[status],
      },
    }));
  };

  const handleSaveLog = () => {
    logger.formSubmit('QuickLog', { 
      date: new Date().toLocaleDateString(),
      entries: Object.keys(logData).length 
    });
    console.log('Saving log data:', logData);
    alert('Quick log saved successfully!');
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
            // Mark the flag as selected
            setLogData((prev) => ({
              ...prev,
              [selectedFlagModal.student.id]: {
                ...prev[selectedFlagModal.student.id],
                [selectedFlagModal.type === 'super-green' ? 'superGreen' : selectedFlagModal.type]: true,
              },
            }));
          }}
        />
      )}
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Daily Quick Log</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor top student concerns day to day performance</p>
      </div>

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
              {paginatedStudents.map((student, idx) => (
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
              ))}
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
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveLog}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Save Log
        </button>
      </div>
    </div>
  );
}
