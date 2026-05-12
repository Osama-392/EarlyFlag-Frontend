'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { getSchoolStudents, createEnrollment } from '@/lib/studentService';
import { Student } from '@/lib/studentService';

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
  const [schoolStudents, setSchoolStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUnenrolledStudents();
    }
  }, [isOpen]);

  const fetchUnenrolledStudents = async () => {
    try {
      setFetchingStudents(true);
      const allStudents = await getSchoolStudents();
      // Filter out already enrolled students
      const unenrolled = allStudents.filter((s) => !enrolledStudentIds.has(s.id));
      setSchoolStudents(unenrolled);
      setError('');
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to fetch students';
      setError(message);
      console.error('Error fetching students:', err);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === schoolStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(schoolStudents.map((s) => s.id)));
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const enrollmentPromises = Array.from(selectedStudents).map((studentId) =>
        createEnrollment(studentId, classId)
      );

      await Promise.all(enrollmentPromises);
      setSuccess(true);

      // Refresh roster
      await onEnrollSuccess();

      // Close modal after 2 seconds
      setTimeout(() => {
        setSelectedStudents(new Set());
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to enroll students';
      setError(message);
      console.error('Error enrolling students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStudents(new Set());
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Enroll Students</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success State
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Successfully enrolled {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''}!
              </h3>
              <p className="text-gray-600 text-sm">The roster is being updated...</p>
            </div>
          ) : fetchingStudents ? (
            // Loading State
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : schoolStudents.length === 0 ? (
            // No Students
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">All students are already enrolled in this class.</p>
            </div>
          ) : (
            // Student List
            <div className="space-y-4">
              {/* Select All */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === schoolStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Select All ({schoolStudents.length})
                  </span>
                </label>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {schoolStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      disabled={loading}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Grade {student.grade_level} • ID: {student.student_id}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && schoolStudents.length > 0 && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEnroll}
              disabled={loading || selectedStudents.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Enrolling...' : `Enroll Selected (${selectedStudents.size})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
