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
    period: number;
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
      icon: '🟢',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      titleColor: 'text-emerald-700',
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
      title: 'Green',
      icon: '🟢',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      titleColor: 'text-green-700',
      reasons: [],
      categories: ['default'],
    },
    yellow: {
      title: 'Yellow Flag',
      icon: '🟡',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      titleColor: 'text-amber-700',
      reasons: {
        academic: [
          'Cannot follow lesson',
          'Missing homework',
          'Struggling with content',
          'Needs extra help',
        ],
        behavioral: [
          'Talking out of turn',
          'Off task',
          'Needs directions',
          'Disrupting others',
        ],
      },
      categories: ['academic', 'behavioral'],
    },
    red: {
      title: 'Red Flag',
      icon: '🔴',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleColor: 'text-red-700',
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
      icon: '⚪',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      titleColor: 'text-gray-700',
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`${config.bgColor} ${config.borderColor} border-b-2 px-6 py-4 flex items-center justify-between`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <h2 className={`text-lg font-bold ${config.titleColor}`}>{config.title}</h2>
          </div>
          <button
            onClick={() => {
              logger.buttonClick('Close Flag Modal', 'FlagModal');
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className={`${config.bgColor} rounded-xl p-4 flex items-center space-x-3`}>
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${student.bgColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
            >
              {student.initial}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">
                Grade {student.grade} • Period {student.period}
              </p>
            </div>
          </div>

          {/* Category Selection (only for yellow/red) */}
          {config.categories.length > 1 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Category</p>
              <div className="flex gap-3">
                {config.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      logger.buttonClick(`Select category: ${cat}`, 'FlagModal');
                      setSelectedCategory(cat as 'academic' | 'behavioral');
                      setSelectedReasons([]);
                    }}
                    className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === cat
                        ? cat === 'academic'
                          ? 'bg-amber-400 text-white'
                          : 'bg-purple-400 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Select reason(s)</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`w-full px-4 py-2 rounded-full text-sm transition-all font-medium ${
                      selectedReasons.includes(reason)
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          {flagType === 'red' && (
            <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 flex items-start space-x-2`}>
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <span className="font-semibold">3 more flags — Red urgent</span>
              </p>
            </div>
          )}

          {selectedReasons.length > 0 && flagType === 'red' && (
            <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 flex items-start space-x-2`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.titleColor.split('-')[1] }} />
              <p className="text-sm text-gray-700">
                This will trigger a <span className="font-semibold">counselor notification</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => {
              logger.buttonClick('Cancel Flag Modal', 'FlagModal');
              onClose();
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={reasons.length > 0 && selectedReasons.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}
