'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ClassSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: any) => void | Promise<void>;
  classData?: any;
  isEdit?: boolean;
  error?: string | null;
}

export default function ClassSetupModal({
  isOpen,
  onClose,
  onSave,
  classData,
  isEdit = false,
  error = null,
}: ClassSetupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade_level: '9',
    period: '',
    room_number: '',
    academic_year: '2025-2026', // Default academic year
  });
  const [loading, setLoading] = useState(false);

  // Update form when classData changes (for edit mode)
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        subject: classData.subject || '',
        grade_level: String(classData.grade_level || '9'),
        period: String(classData.period || ''),
        room_number: String(classData.room_number || ''),
        academic_year: classData.academic_year || '2025-2026',
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        grade_level: '9',
        period: '',
        room_number: '',
        academic_year: '2025-2026',
      });
    }
  }, [classData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.subject.trim()) {
      alert('Please enter class name and subject');
      return;
    }

    try {
      setLoading(true);
      
      // Sanitize data: convert empty strings to null for optional fields
      await onSave({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        grade_level: parseInt(formData.grade_level, 10),
        academic_year: formData.academic_year.trim(),
        period: formData.period.trim() ? parseInt(formData.period.trim(), 10) : null,
        room_number: formData.room_number.trim() || null,
      });

      // Reset form
      setFormData({
        name: '',
        subject: '',
        grade_level: '9',
        period: '',
        room_number: '',
        academic_year: '2025-2026',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-blue-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Create'} Class</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEdit ? 'Update class details' : 'Add a new class to your roster'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-blue-200 via-blue-100 to-transparent"></div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Class Name - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., AP Calculus BC, Physics 101"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm"
              disabled={loading}
            />
          </div>

          {/* Subject - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="e.g., Mathematics, English, Science"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm"
              disabled={loading}
            />
          </div>

          {/* Grade and Period - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.grade_level}
                onChange={(e) =>
                  setFormData({ ...formData, grade_level: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm bg-white"
                disabled={loading}
              >
                {Array.from({ length: 7 }, (_, i) => 6 + i).map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Period
              </label>
              <input
                type="text"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
                placeholder="e.g., 1, 2, 3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Room Number
            </label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) =>
                setFormData({ ...formData, room_number: e.target.value })
              }
              placeholder="e.g., 101, A201"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm"
              disabled={loading}
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.academic_year}
              onChange={(e) =>
                setFormData({ ...formData, academic_year: e.target.value })
              }
              placeholder="e.g., 2025-2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors text-sm"
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-blue-100 via-blue-50 to-transparent"></div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-lg transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
