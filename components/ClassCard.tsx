'use client';

import { Edit2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleCardClick = () => {
    console.log('Navigating to class:', classData.id);
    router.push(`/students/${classData.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer hover:border-teal-300 group"
    >
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(classData);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Class Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
          {classData.name}
        </h3>
        <p className="text-sm text-gray-500">{classData.subject}</p>
        <p className="text-sm text-gray-500">Period {classData.period}</p>
      </div>

      {/* Footer with Student Count */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 text-teal-600 group-hover:text-teal-700 transition-colors">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">{classData.studentCount || 0} students</span>
      </div>
    </div>
  );
}
