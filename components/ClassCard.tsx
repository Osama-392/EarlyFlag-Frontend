'use client';

import { Edit2 } from 'lucide-react';

interface ClassCardProps {
  classData: {
    id: string;
    name: string;
    subject: string;
    period: number;
    gradeLevel: number;
    studentCount: number;
    icon?: React.ReactNode;
    color?: string;
  };
  onEdit: (classData: any) => void;
}

export default function ClassCard({ classData, onEdit }: ClassCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header with Icon and Edit Button */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${
            classData.color || 'from-gray-400 to-gray-600'
          } flex items-center justify-center text-white`}
        >
          {classData.icon}
        </div>
        <button
          onClick={() => onEdit(classData)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Class Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{classData.name}</h3>
        <p className="text-sm text-gray-500">Period {classData.period}</p>
      </div>
    </div>
  );
}
