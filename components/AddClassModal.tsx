'use client';

import { useState } from 'react';
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

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: any) => void;
}

export default function AddClassModal({
  isOpen,
  onClose,
  onSave,
}: AddClassModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    period: '',
    gradeLevel: '',
    teachingDays: [] as string[],
  });
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject) {
      alert('Please select a subject');
      return;
    }
    if (!formData.gradeLevel) {
      alert('Please select a grade level');
      return;
    }
    onSave({
      ...formData,
      period: parseInt(formData.period) || 1,
      gradeLevel: parseInt(formData.gradeLevel),
      teaching_days: formData.teachingDays,
    });
    setFormData({ name: '', subject: '', period: '', gradeLevel: '', teachingDays: [] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-visible relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add a Class</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., AP Calculus BC"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <button
              type="button"
              onClick={() => {
                setIsSubjectOpen(!isSubjectOpen);
                setIsGradeOpen(false);
              }}
              className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between text-sm transition-all bg-white text-left ${
                isSubjectOpen ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-300 hover:border-gray-400'
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
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180 text-teal-600' : ''}`} />
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
                                isSelected ? 'bg-teal-50 text-teal-900 font-semibold' : 'hover:bg-gray-50 text-gray-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-md ${item.bgColor} flex items-center justify-center text-white shadow-sm`}>
                                  {item.icon}
                                </div>
                                <span>{item.name}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-teal-600" />}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period *
            </label>
            <input
              type="number"
              required
              min="1"
              max="8"
              value={formData.period}
              onChange={(e) =>
                setFormData({ ...formData, period: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="1-8"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level *
            </label>
            <button
              type="button"
              onClick={() => {
                setIsGradeOpen(!isGradeOpen);
                setIsSubjectOpen(false);
              }}
              className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between text-sm transition-all bg-white text-left ${
                isGradeOpen ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {(() => {
                const selectedGrade = GRADE_OPTIONS.find(g => g.value === formData.gradeLevel);
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
                    const isSelected = formData.gradeLevel === grade.value;
                    return (
                      <button
                        key={grade.value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, gradeLevel: grade.value });
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

          {/* Teaching Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What days do you teach this class? <span className="text-red-500">*</span>
            </label>
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white shadow-sm">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = formData.teachingDays.includes(day.id);
                return (
                  <label
                    key={day.id}
                    className="flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          teachingDays: isChecked
                            ? prev.teachingDays.filter((d) => d !== day.id)
                            : [...prev.teachingDays, day.id],
                        }));
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Add Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
