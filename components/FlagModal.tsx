'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { logger } from '@/lib/logger';

interface FlagModalProps {
  flagType: 'super-green' | 'green' | 'yellow' | 'red' | 'absent';
  student: {
    id: string;
    name: string;
    grade: number;
    period?: number | string;
    initial: string;
    bgColor: string;
  };
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function FlagModal({
  flagType,
  student,
  onClose,
  onSubmit,
}: FlagModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'academic' | 'behavioral'>('academic');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const flagConfig = {
    'super-green': {
      title: 'Super Green',
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-900" />
        </div>
      ),
      studentBg: 'bg-slate-50',
      activeCategoryBg: 'bg-emerald-500 text-white border-emerald-500',
      reasons: [
        'Leadership',
        'Academic growth',
        'Helping others',
        'Exceptional participation',
        'Kindness',
      ],
      categories: ['positive'],
    },
    green: {
      title: 'Green Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-300 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-800" />
        </div>
      ),
      studentBg: 'bg-slate-50',
      activeCategoryBg: 'bg-emerald-400 text-white border-emerald-400',
      reasons: [],
      categories: ['default'],
    },
    yellow: {
      title: 'Yellow Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-900" fill="currentColor" />
        </div>
      ),
      studentBg: 'bg-[#f4f7fb]', // Light grayish blue from image
      activeCategoryBg: 'bg-[#ffca4b] text-amber-900 border-[#ffca4b]', // Yellow from image
      reasons: {
        academic: [
          'Missing assignment',
          'Low test score',
          'Needs support',
          'Incomplete work',
          'Off-task behavior',
        ],
        behavioral: [
          'Talking out of turn',
          'Disrupting others',
          'Needs directions',
          'Off task',
        ],
      },
      categories: ['academic', 'behavioral'],
    },
    red: {
      title: 'Red Flag',
      icon: (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-white" fill="currentColor" />
        </div>
      ),
      studentBg: 'bg-slate-50',
      activeCategoryBg: 'bg-red-500 text-white border-red-500',
      reasons: {
        academic: ['Cheating'],
        behavioral: [
          'Fighting',
          'Bullying',
          'Refusing directions',
          'Leaving class',
          'Other severe behavior',
        ],
      },
      categories: ['academic', 'behavioral'],
    },
    absent: {
      title: 'Not In Class',
      icon: (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-600" />
        </div>
      ),
      studentBg: 'bg-slate-50',
      activeCategoryBg: 'bg-gray-500 text-white border-gray-500',
      reasons: [],
      categories: [],
    },
  };

  const config = flagConfig[flagType];
  const reasons =
    typeof config.reasons === 'object' && 'academic' in config.reasons
      ? config.reasons[selectedCategory] || []
      : config.reasons || [];

  const toggleReason = (reason: string) => {
    logger.formChange(`flag-reason-${reason}`, true, 'FlagModal');
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = () => {
    logger.formSubmit('FlagModal', {
      flagType,
      studentId: student.id,
      category: selectedCategory,
      reasons: selectedReasons,
    });
    onSubmit({
      flagType,
      studentId: student.id,
      category: selectedCategory,
      reasons: selectedReasons,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <h2 className="text-xl font-medium text-slate-800">{config.title}</h2>
          </div>
          <button
            onClick={() => {
              logger.buttonClick('Close Flag Modal', 'FlagModal');
              onClose();
            }}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Student Info */}
          <div className={`${config.studentBg} rounded-xl p-4 flex items-center space-x-4 mb-6`}>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
              {student.initial}
            </div>
            <div>
              <p className="font-medium text-slate-800 text-lg">{student.name}</p>
              <p className="text-sm text-slate-500">
                Grade {student.grade} • Period {student.period}
              </p>
            </div>
          </div>

          {/* Category Selection (only for yellow/red) */}
          {config.categories.length > 1 && (
            <div className="mb-6">
              <p className="text-[15px] font-medium text-slate-700 mb-3">Category</p>
              <div className="flex gap-4">
                {config.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      logger.buttonClick(`Select category: ${cat}`, 'FlagModal');
                      setSelectedCategory(cat as 'academic' | 'behavioral');
                      setSelectedReasons([]);
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-full font-medium text-sm transition-all border ${
                      selectedCategory === cat
                        ? config.activeCategoryBg
                        : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason Selection */}
          {reasons.length > 0 && (
            <div className="mb-6">
              <p className="text-[15px] font-medium text-slate-700 mb-3">Select reason(s)</p>
              <div className="flex flex-wrap gap-2.5">
                {reasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`px-4 py-2 rounded-full text-sm transition-all font-medium border ${
                      selectedReasons.includes(reason)
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          {flagType === 'yellow' && (
            <div className="border border-amber-200 bg-[#fffdf0] rounded-lg p-3 flex items-center space-x-2 mb-2">
              <span className="text-amber-600 font-bold text-sm">!</span>
              <p className="text-sm text-amber-700">
                3 more flags → Red urgent
              </p>
            </div>
          )}

          {selectedReasons.length > 0 && flagType === 'red' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                This will trigger a <span className="font-semibold">counselor notification</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              logger.buttonClick('Cancel Flag Modal', 'FlagModal');
              onClose();
            }}
            className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={reasons.length > 0 && selectedReasons.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              (reasons.length > 0 && selectedReasons.length === 0)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}
