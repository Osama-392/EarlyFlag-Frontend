'use client';

import { useState } from 'react';
import StudentInfoModal from '@/components/StudentInfoModal';
import YellowFlagModal from '@/components/YellowFlagModal';
import RedFlagModal from '@/components/RedFlagModal';

export default function ModalsDemo() {
  const [studentInfoOpen, setStudentInfoOpen] = useState(false);
  const [yellowFlagOpen, setYellowFlagOpen] = useState(false);
  const [redFlagOpen, setRedFlagOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Modal Components</h1>
        <p className="text-gray-600 mb-12">Click any button below to open the corresponding modal.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Info Modal Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Student Info Modal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Shows detailed student information with current issues and action buttons.
            </p>
            <button
              onClick={() => setStudentInfoOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Modal
            </button>
          </div>

          {/* Yellow Flag Modal Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Yellow Flag Modal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Create a yellow flag with category selection and concern details.
            </p>
            <button
              onClick={() => setYellowFlagOpen(true)}
              className="w-full px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Open Modal
            </button>
          </div>

          {/* Red Flag Modal Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
              <span className="text-2xl">🚨</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Red Flag Modal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Escalate to urgent with immediate counselor notification.
            </p>
            <button
              onClick={() => setRedFlagOpen(true)}
              className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Open Modal
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentInfoModal
        isOpen={studentInfoOpen}
        onClose={() => setStudentInfoOpen(false)}
      />
      <YellowFlagModal
        isOpen={yellowFlagOpen}
        onClose={() => setYellowFlagOpen(false)}
      />
      <RedFlagModal
        isOpen={redFlagOpen}
        onClose={() => setRedFlagOpen(false)}
      />
    </div>
  );
}
