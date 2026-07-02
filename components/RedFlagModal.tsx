'use client';

import { X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface RedFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RedFlagModal({ isOpen, onClose }: RedFlagModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = [
    { id: 'academic', label: 'Academic' },
    { id: 'behavioral', label: 'Behavioral' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Red Flag – Urgent</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ET
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Emma Thompson</p>
                <p className="text-xs text-gray-500">Grade 10 - Period 3</p>
                <span className="inline-block mt-2 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  2 total flags
                </span>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Category <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-sm ring-1 ring-rose-500'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What happened? <span className="text-red-600">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about the incident or concern..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
              rows={4}
            />
          </div>

          {/* Error Message */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 text-sm">Counselor will be notified</p>
              <p className="text-xs text-red-700 mt-1">This creates an urgent intervention ticket</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm">
              Escalate to Urgent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
