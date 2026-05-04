'use client';

import { X, Flag } from 'lucide-react';
import { useState } from 'react';

interface YellowFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function YellowFlagModal({ isOpen, onClose }: YellowFlagModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const categories = [
    { id: 'academic', label: 'Academic' },
    { id: 'behavioral', label: 'Behavioral' },
  ];

  const flagOptions = [
    'Missing assignment',
    'Low test score',
    'Needs support',
    'Incomplete work',
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-yellow-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Yellow Flag</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ER
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Emma Rodriguez</p>
                <p className="text-xs text-gray-500">Grade 10 - Period 3</p>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Category
            </label>
            <div className="flex gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-yellow-400 text-yellow-900 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Concerns Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select concern(s)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {flagOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              3 New Tags - Rollnegri
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Submit Flag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
