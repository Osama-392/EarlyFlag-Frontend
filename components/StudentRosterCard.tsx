'use client';

import { Eye } from 'lucide-react';
import Link from 'next/link';

interface StudentRosterCardProps {
  student: {
    id: string;
    name: string;
    grade: number;
    status: 'at-risk' | 'monitor' | 'good' | 'excellent' | 'inactive';
    signals: {
      superGreen: number;
      yellow: number;
      red: number;
    };
  };
}

const statusConfig = {
  'at-risk': { color: 'bg-red-100 text-red-800', label: 'At-Risk' },
  monitor: { color: 'bg-yellow-100 text-yellow-800', label: 'Monitor' },
  good: { color: 'bg-green-100 text-green-800', label: 'Good' },
  excellent: { color: 'bg-emerald-100 text-emerald-800', label: 'Excellent' },
  inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
};

const signalColors = {
  superGreen: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
};

export default function StudentRosterCard({ student }: StudentRosterCardProps) {
  const statusStyle = statusConfig[student.status];
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      {/* Left Section - Student Info */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>

        {/* Student Details */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{student.name}</p>
          <p className="text-sm text-gray-500">Grade {student.grade}</p>
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Middle Section - Signal Indicators */}
      <div className="flex items-center space-x-3 px-6">
        {student.signals.superGreen > 0 && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${signalColors.superGreen}`}>
            +{student.signals.superGreen}
          </span>
        )}
        {student.signals.yellow > 0 && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${signalColors.yellow}`}>
            +{student.signals.yellow}
          </span>
        )}
        {student.signals.red > 0 && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${signalColors.red}`}>
            +{student.signals.red}
          </span>
        )}
      </div>

      {/* Right Section - Action */}
      <Link
        href={`/students/${student.id}`}
        className="inline-flex items-center space-x-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
      >
        <Eye className="w-4 h-4" />
        <span>View Profile</span>
      </Link>
    </div>
  );
}
