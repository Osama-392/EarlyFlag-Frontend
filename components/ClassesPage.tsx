'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import ClassCard from '@/components/ClassCard';
import AddClassModal from '@/components/AddClassModal';
import EditClassModal from '@/components/EditClassModal';

interface Class {
  id: string;
  name: string;
  subject: string;
  period: number;
  gradeLevel: number;
  studentCount: number;
  icon?: React.ReactNode;
  color?: string;
}

interface GradedClasses {
  [key: number]: Class[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<GradedClasses>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  const mockClasses: Class[] = [
    {
      id: '1',
      name: 'AP Calculus BC',
      subject: 'Math',
      period: 1,
      gradeLevel: 12,
      studentCount: 24,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: '2',
      name: 'Physics',
      subject: 'Science',
      period: 4,
      gradeLevel: 12,
      studentCount: 28,
      color: 'from-green-400 to-green-600',
    },
    {
      id: '3',
      name: 'Art Studio',
      subject: 'Arts',
      period: 5,
      gradeLevel: 12,
      studentCount: 18,
      color: 'from-pink-400 to-pink-600',
    },
    {
      id: '4',
      name: 'AP Calculus BC',
      subject: 'Math',
      period: 3,
      gradeLevel: 11,
      studentCount: 22,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: '5',
      name: 'Physics',
      subject: 'Science',
      period: 4,
      gradeLevel: 11,
      studentCount: 26,
      color: 'from-green-400 to-green-600',
    },
    {
      id: '6',
      name: 'AP Calculus BC',
      subject: 'Math',
      period: 5,
      gradeLevel: 8,
      studentCount: 20,
      color: 'from-blue-400 to-blue-600',
    },
  ];

  useEffect(() => {
    setLoading(false);
    const grouped = mockClasses.reduce((acc, cls) => {
      if (!acc[cls.gradeLevel]) {
        acc[cls.gradeLevel] = [];
      }
      acc[cls.gradeLevel].push(cls);
      return acc;
    }, {} as GradedClasses);

    setClasses(grouped);
  }, []);

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditModalOpen(true);
  };

  const handleSaveClass = (classData: Partial<Class>) => {
    if (selectedClass) {
      setClasses((prev) => ({
        ...prev,
        [selectedClass.gradeLevel]: prev[selectedClass.gradeLevel].map((c) =>
          c.id === selectedClass.id ? { ...c, ...classData } : c
        ),
      }));
    }
    setIsEditModalOpen(false);
    setSelectedClass(null);
  };

  const handleAddClass = (classData: Partial<Class>) => {
    const newClass: Class = {
      id: String(Math.random()),
      name: classData.name || '',
      subject: classData.subject || '',
      period: classData.period || 0,
      gradeLevel: classData.gradeLevel || 12,
      studentCount: 0,
      color: classData.color,
    };

    setClasses((prev) => ({
      ...prev,
      [newClass.gradeLevel]: [...(prev[newClass.gradeLevel] || []), newClass],
    }));
    setIsAddModalOpen(false);
  };

  const sortedGrades = Object.keys(classes)
    .map(Number)
    .sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">View and edit classes</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add a class</span>
        </button>
      </div>

      {/* Classes by Grade */}
      <div className="space-y-8">
        {sortedGrades.map((grade) => (
          <div key={grade}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Grade {grade}</h2>
              <span className="text-sm text-gray-500">
                {classes[grade].length} class{classes[grade].length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes[grade].map((cls) => (
                <ClassCard
                  key={cls.id}
                  classData={cls}
                  onEdit={handleEditClass}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AddClassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddClass}
      />

      {selectedClass && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClass(null);
          }}
          classData={selectedClass}
          onSave={handleSaveClass}
        />
      )}
    </div>
  );
}
