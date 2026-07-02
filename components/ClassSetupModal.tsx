'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calculator, 
  BookOpen, 
  FlaskConical, 
  Globe, 
  BookMarked, 
  Languages, 
  Activity, 
  Palette, 
  Music, 
  Code, 
  ChevronDown, 
  Check 
} from 'lucide-react';

const SUBJECT_GROUPS = [
  {
    group: 'Core Subjects',
    items: [
      { name: 'Math', icon: <Calculator className="w-4 h-4" />, bgColor: 'bg-emerald-500' },
      { name: 'Language arts', icon: <BookOpen className="w-4 h-4" />, bgColor: 'bg-blue-500' },
      { name: 'Science', icon: <FlaskConical className="w-4 h-4" />, bgColor: 'bg-purple-500' },
      { name: 'Social studies', icon: <Globe className="w-4 h-4" />, bgColor: 'bg-orange-500' },
      { name: 'Religion', icon: <BookMarked className="w-4 h-4" />, bgColor: 'bg-rose-500' },
      { name: 'Spanish', icon: <Languages className="w-4 h-4" />, bgColor: 'bg-teal-500' },
    ]
  },
  {
    group: 'Specials',
    items: [
      { name: 'PE', icon: <Activity className="w-4 h-4" />, bgColor: 'bg-indigo-500' },
      { name: 'Art', icon: <Palette className="w-4 h-4" />, bgColor: 'bg-amber-500' },
      { name: 'Music', icon: <Music className="w-4 h-4" />, bgColor: 'bg-red-500' },
      { name: 'Technology', icon: <Code className="w-4 h-4" />, bgColor: 'bg-violet-500' },
    ]
  }
];

const GRADE_OPTIONS = [
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
];

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
    grade_level: '',
    period: '',
    room_number: '',
    academic_year: '2025-2026', // Default academic year
    teaching_days: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);

  // Update form when classData changes (for edit mode)
  useEffect(() => {
    setIsSubjectOpen(false);
    setIsGradeOpen(false);
    if (classData) {
      setFormData({
        name: classData.name || '',
        subject: classData.subject || '',
        grade_level: String(classData.grade_level || ''),
        period: String(classData.period || ''),
        room_number: String(classData.room_number || ''),
        academic_year: classData.academic_year || '2025-2026',
        teaching_days: classData.teaching_days || [],
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        grade_level: '',
        period: '',
        room_number: '',
        academic_year: '2025-2026',
        teaching_days: [],
      });
    }
  }, [classData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.subject.trim()) {
      alert('Please enter class name and select a subject');
      return;
    }
    if (!formData.grade_level) {
      alert('Please select a grade level');
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
        teaching_days: formData.teaching_days,
      });

      // Reset form
      setFormData({
        name: '',
        subject: '',
        grade_level: '',
        period: '',
        room_number: '',
        academic_year: '2025-2026',
        teaching_days: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-visible relative">
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

          {/* Subject - Custom Dropdown */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSubjectOpen(!isSubjectOpen);
                setIsGradeOpen(false);
              }}
              className={`w-full px-4 py-2.5 border rounded-lg flex items-center justify-between text-sm transition-all bg-white text-left ${
                isSubjectOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {(() => {
                const selectedObj = SUBJECT_GROUPS.flatMap(g => g.items).find(
                  i => i.name.toLowerCase() === formData.subject.toLowerCase()
                );
                if (selectedObj) {
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded ${selectedObj.bgColor} flex items-center justify-center text-white`}>
                        {selectedObj.icon}
                      </div>
                      <span className="text-gray-900 font-medium">{selectedObj.name}</span>
                    </div>
                  );
                }
                if (formData.subject) {
                  return <span className="text-gray-900 font-medium">{formData.subject}</span>;
                }
                return <span className="text-gray-400">Select a subject</span>;
              })()}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isSubjectOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSubjectOpen(false)} 
                />
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[260px] overflow-y-auto p-2 divide-y divide-gray-100">
                  {SUBJECT_GROUPS.map((group) => (
                    <div key={group.group} className="py-2 first:pt-1 last:pb-1">
                      <div className="px-3 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {group.group}
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isSelected = formData.subject.toLowerCase() === item.name.toLowerCase();
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, subject: item.name });
                                setIsSubjectOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                                isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-md ${item.bgColor} flex items-center justify-center text-white shadow-sm`}>
                                  {item.icon}
                                </div>
                                <span>{item.name}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Grade and Period - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsGradeOpen(!isGradeOpen);
                  setIsSubjectOpen(false);
                }}
                className={`w-full px-4 py-2.5 border rounded-lg flex items-center justify-between text-sm transition-all bg-white text-left ${
                  isGradeOpen ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {(() => {
                  const selectedGrade = GRADE_OPTIONS.find(g => g.value === formData.grade_level);
                  if (selectedGrade) {
                    return <span className="text-gray-900 font-medium">{selectedGrade.label}</span>;
                  }
                  return <span className="text-gray-400">Select grade level</span>;
                })()}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isGradeOpen ? 'rotate-180 text-orange-600' : ''}`} />
              </button>

              {isGradeOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsGradeOpen(false)} 
                  />
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[200px] overflow-y-auto p-1.5 space-y-0.5">
                    {GRADE_OPTIONS.map((grade) => {
                      const isSelected = formData.grade_level === grade.value;
                      return (
                        <button
                          key={grade.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, grade_level: grade.value });
                            setIsGradeOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                            isSelected ? 'bg-orange-50 text-orange-900 font-semibold' : 'hover:bg-gray-50 text-gray-700 font-medium'
                          }`}
                        >
                          <span>{grade.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
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

          {/* Teaching Days */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What days do you teach this class? <span className="text-red-500">*</span>
            </label>
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white shadow-sm">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = formData.teaching_days.includes(day.id);
                return (
                  <label
                    key={day.id}
                    className="flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={loading}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          teaching_days: isChecked
                            ? prev.teaching_days.filter((d) => d !== day.id)
                            : [...prev.teaching_days, day.id],
                        }));
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Room Number & Academic Year - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
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
