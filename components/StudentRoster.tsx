'use client';

import { Search, Upload, Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import StudentRosterCard from '@/components/StudentRosterCard';
import UploadStudentsModal from '@/components/UploadStudentsModal';

interface Student {
  id: string;
  name: string;
  grade: number;
  status: 'at-risk' | 'monitor' | 'good' | 'excellent' | 'inactive';
  signals: {
    superGreen: number;
    yellow: number;
    red: number;
  };
  classId: string;
}

interface ClassGroup {
  classId: string;
  className: string;
  period: number;
  students: Student[];
}

export default function StudentRoster() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mock data
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'James Wilson',
      grade: 11,
      status: 'excellent',
      signals: { superGreen: 4, yellow: 2, red: 0 },
      classId: 'class-1',
    },
    {
      id: '2',
      name: 'Amelia Taylor',
      grade: 11,
      status: 'at-risk',
      signals: { superGreen: 1, yellow: 1, red: 2 },
      classId: 'class-1',
    },
    {
      id: '3',
      name: 'Benjamin Moore',
      grade: 11,
      status: 'good',
      signals: { superGreen: 1, yellow: 1, red: 1 },
      classId: 'class-1',
    },
    {
      id: '4',
      name: 'Mia Anderson',
      grade: 11,
      status: 'monitor',
      signals: { superGreen: 2, yellow: 1, red: 1 },
      classId: 'class-1',
    },
    {
      id: '5',
      name: 'Oliver White',
      grade: 11,
      status: 'inactive',
      signals: { superGreen: 1, yellow: 0, red: 1 },
      classId: 'class-1',
    },
  ];

  // Group students by class
  const classGroups: ClassGroup[] = useMemo(() => {
    const grouped: Record<string, ClassGroup> = {};

    mockStudents.forEach((student) => {
      if (!grouped[student.classId]) {
        grouped[student.classId] = {
          classId: student.classId,
          className: 'AP Calculus BC',
          period: 3,
          students: [],
        };
      }
      grouped[student.classId].students.push(student);
    });

    return Object.values(grouped);
  }, []);

  // Filter students based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return classGroups;

    return classGroups
      .map((group) => ({
        ...group,
        students: group.students.filter((student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((group) => group.students.length > 0);
  }, [searchTerm, classGroups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Roster</h1>
          <p className="text-gray-500 mt-1">View or edit profile of any student</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Students</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Students by Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Student List by Class */}
      <div className="space-y-8">
        {filteredGroups.map((group) => (
          <div key={group.classId}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {group.className}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Period {group.period}</p>

            <div className="space-y-3">
              {group.students.map((student) => (
                <StudentRosterCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your search</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadStudentsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
