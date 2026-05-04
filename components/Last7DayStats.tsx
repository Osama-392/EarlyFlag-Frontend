'use client';

import { TrendingUp, AlertCircle } from 'lucide-react';

interface Last7DayStatsProps {
  student: {
    academicFlags: number;
    behavioralFlags: number;
    academicProgress: number;
    behavioralProgress: number;
  };
}

export default function Last7DayStats({ student }: Last7DayStatsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
        Last 7-Day
      </h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Academic Flags */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">📚</span>
            </div>
            <h3 className="font-medium text-gray-900">Academic Flags (7 Days)</h3>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-4xl font-bold text-blue-600">{student.academicFlags}</p>
            <p className="text-sm text-gray-500 mt-1">Academic Flags</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Addressing</span>
              <span className="text-xs font-medium text-gray-600">{student.academicProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${student.academicProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Behavioral Flags */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">⚠️</span>
            </div>
            <h3 className="font-medium text-gray-900">Behavioral Flags (7 Days)</h3>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-4xl font-bold text-purple-600">{student.behavioralFlags}</p>
            <p className="text-sm text-gray-500 mt-1">Behavioral Flags</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Improving</span>
              <span className="text-xs font-medium text-gray-600">{student.behavioralProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${student.behavioralProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
