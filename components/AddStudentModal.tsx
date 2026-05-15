'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createStudent, createEnrollment } from '@/lib/studentService';
import { cacheInvalidate } from '@/lib/dataCache';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  classGradeLevel?: string;
  onAddSuccess: (student: any) => Promise<void>;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  classId,
  classGradeLevel,
  onAddSuccess,
}: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    grade_level: classGradeLevel || '',
    date_of_birth: '',
    gender: '',
    parent_email: '',
    parent_phone: '',
    secondary_parent_email: '',
    address: '',
    iep_status: false,
    ell_status: false,
  });

  // Sync grade_level when classGradeLevel changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        grade_level: classGradeLevel || prev.grade_level 
      }));
    }
  }, [classGradeLevel, isOpen]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.student_id.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.grade_level) {
      setError('Grade level is required');
      return false;
    }
    const gradeLevel = parseInt(formData.grade_level);
    if (gradeLevel < 6 || gradeLevel > 12) {
      setError('Grade level must be between 6 and 12');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        grade_level: parseInt(formData.grade_level),
      };

      // Remove empty optional fields
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => {
          if (typeof v === 'string') return v.trim() !== '';
          return v !== false;
        })
      );

      const newStudent = await createStudent(cleanedPayload);
      
      // Enroll student in the class
      await createEnrollment(newStudent.id, classId);
      
      await onAddSuccess(newStudent);
      
      // Invalidate cache so dashboard reflects new student counts
      cacheInvalidate();

      // Reset form
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        grade_level: classGradeLevel || '',
        date_of_birth: '',
        gender: '',
        parent_email: '',
        parent_phone: '',
        secondary_parent_email: '',
        address: '',
        iep_status: false,
        ell_status: false,
      });

      onClose();
    } catch (err: any) {
      let message = 'Failed to create student';
      const detail = err?.response?.data?.detail;
      
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg || message;
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      console.error('Error creating student:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student ID & Names Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="e.g., STU001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Grade & Middle Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              {classGradeLevel ? (
                <>
                  <input
                    type="text"
                    value={`Grade ${classGradeLevel}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Locked to match the class grade</p>
                </>
              ) : (
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  disabled={loading}
                >
                  <option value="">Select grade...</option>
                  {Array.from({ length: 7 }, (_, i) => i + 6).map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                placeholder="Middle name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Parent Email (Optional)
              </label>
              <input
                type="email"
                name="parent_email"
                value={formData.parent_email}
                onChange={handleChange}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Parent Phone (Optional)
              </label>
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Secondary Parent & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Secondary Parent Email (Optional)
              </label>
              <input
                type="email"
                name="secondary_parent_email"
                value={formData.secondary_parent_email}
                onChange={handleChange}
                placeholder="parent2@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Gender (Optional)
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              >
                <option value="">Select gender...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              disabled={loading}
            />
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="iep_status"
                checked={formData.iep_status}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">IEP Status</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="ell_status"
                checked={formData.ell_status}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">ELL Status</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </div>
    </div>
  );
}
