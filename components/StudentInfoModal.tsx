'use client';

import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface StudentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentInfoModal({ isOpen, onClose }: StudentInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              SR
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sarah Williams</h2>
              <p className="text-xs text-gray-500">Grade 10 - Period 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search students, flags, or notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Status Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Academic</p>
                <p className="text-sm font-semibold text-green-700">Excellent</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Behavioral</p>
                <p className="text-sm font-semibold text-orange-700">Needs work</p>
              </div>
            </div>
          </div>

          {/* Current Issues */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Current Issues</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Academic Issues (1)</p>
                  <p className="text-xs text-gray-500 mt-1">Missing homework assignments</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Behavioral Issues (1)</p>
                  <p className="text-xs text-gray-500 mt-1">Off-task behavior in class</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Attendance (1)</p>
                  <p className="text-xs text-gray-500 mt-1">Testing during instruction</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Testing Issues (1)</p>
                  <p className="text-xs text-gray-500 mt-1">Low scores</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
              View Full Profile
            </button>
            <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm">
              Learn More
            </button>
            <button className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
