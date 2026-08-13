'use client';

import { Edit2, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Class } from '@/lib/classService';

interface ClassCardProps {
 classData: Class & {
 icon?: React.ReactNode;
 color?: string;
 };
 onEdit: (classData: any) => void;
 onDelete?: (classData: any) => void;
}

export default function ClassCard({ classData, onEdit, onDelete }: ClassCardProps) {
 const router = useRouter();

 const handleCardClick = (e: React.MouseEvent) => {
 e.stopPropagation();
 router.push(`/classes/${classData.slug}`);
 };

 return (
 <div
 onClick={handleCardClick}
 className="bg-white dark:bg-[#151722] rounded-lg border border-gray-200 dark:border-[#262a3d] p-4 hover:shadow-lg transition-all cursor-pointer hover:border-teal-300 group"
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
 <div className="flex items-center space-x-1">
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 onEdit(classData);
 }}
 className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#1b1e2c] rounded-lg transition-colors"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 {onDelete && (
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 onDelete(classData);
 }}
 className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>

 {/* Class Info */}
 <div className="space-y-2 mb-4">
 <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
 {classData.name}
 </h3>
 <p className="text-sm text-gray-500 dark:text-gray-400">{classData.subject}</p>
 <p className="text-sm text-gray-500 dark:text-gray-400">Period {classData.period}</p>
 </div>

 {/* Footer with Student Count */}
 <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-[#262a3d] text-teal-600 group-hover:text-teal-700 transition-colors">
 <Users className="w-4 h-4" />
 <span className="text-sm font-medium">{classData.studentCount || 0} students</span>
 </div>
 </div>
 );
}
