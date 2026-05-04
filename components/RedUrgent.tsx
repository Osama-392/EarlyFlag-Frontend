'use client';

import { AlertCircle, Mail, ChevronRight } from 'lucide-react';
import { urgentAlerts } from '@/lib/mockData';

export default function RedUrgent() {
  return (
    <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
      {/* Header */}
      <div className="bg-red-50 border-b border-red-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Red Urgent</h2>
          </div>
          <button className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1">
            <span className="flex items-center justify-center w-5 h-5 bg-red-200 rounded text-red-800">3</span>
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-gray-200">
        {urgentAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {alert.student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900">{alert.student.name}</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      {alert.student.age}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Grade {alert.student.grade} - Period {alert.student.period}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-sm text-gray-700">{alert.concern}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>{alert.timeSinceContact}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span className="text-red-600 font-medium">{alert.flagCount} Flags</span>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <button className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center space-x-1">
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

