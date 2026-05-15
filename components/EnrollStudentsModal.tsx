'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, UserPlus, Search } from 'lucide-react';
import { createEnrollment } from '@/lib/studentService';

interface EnrollStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  enrolledStudentIds: Set<string>;
  onEnrollSuccess: () => Promise<void>;
}

export default function EnrollStudentsModal({
  isOpen,
  onClose,
  classId,
  enrolledStudentIds,
  onEnrollSuccess,
}: EnrollStudentsModalProps) {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);

  const handleEnroll = async () => {
    const trimmedId = studentId.trim();
    if (!trimmedId) {
      setError('Please enter a student ID');
      return;
    }

    if (enrolledStudentIds.has(trimmedId)) {
      setError('This student is already enrolled in this class');
      return;
    }

    if (enrolledIds.includes(trimmedId)) {
      setError('You already enrolled this student in this session');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createEnrollment(trimmedId, classId);
      setEnrolledIds((prev) => [...prev, trimmedId]);
      setStudentId('');
      setSuccess(true);

      // Refresh roster
      await onEnrollSuccess();

      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = 'Failed to enroll student. Please check the student ID and try again.';
      if (detail) {
        if (Array.isArray(detail)) {
          message = detail.map((e: any) => (typeof e === 'object' && e.msg ? e.msg : String(e))).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        }
      }
      setError(message);
      console.error('Error enrolling student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStudentId('');
      setError('');
      setSuccess(false);
      setEnrolledIds([]);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnroll();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Enroll Student</h2>
              <p className="text-xs text-gray-500 mt-0.5">Add an existing student to this class</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Success Toast */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">Student enrolled successfully!</p>
            </div>
          )}

          {/* Student ID Input */}
          <div>
            <label htmlFor="student-id-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Student ID
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="student-id-input"
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter the student's ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter the student ID assigned during student creation or bulk upload.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Recently enrolled in this session */}
          {enrolledIds.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Enrolled this session ({enrolledIds.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {enrolledIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                  >
                    <CheckCircle size={12} />
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
          >
            {enrolledIds.length > 0 ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleEnroll}
            disabled={loading || !studentId.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Enroll Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
