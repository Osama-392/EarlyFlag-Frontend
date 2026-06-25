'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import ClassCard from '@/components/ClassCard';
import ClassSetupModal from '@/components/ClassSetupModal';
import { useClasses } from '@/lib/useClasses';
import { Class, CreateClassRequest } from '@/lib/classService';

interface GradedClasses {
  [key: string]: Class[];
}

export default function ClassesPage() {
  const { classes: apiClasses, loading, error, addClass } = useClasses();
  const [classes, setClasses] = useState<GradedClasses>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Transform API classes to grouped format
  useEffect(() => {
    if (apiClasses && apiClasses.length > 0) {
      const grouped = apiClasses.reduce((acc, cls) => {
        const grade = cls.grade_level || 'Ungrouped';
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push({
          ...cls,
          studentCount: cls.studentCount || 0,
        });
        return acc;
      }, {} as GradedClasses);

      setClasses(grouped);
    }
  }, [apiClasses]);

  const handleAddClass = () => {
    setSelectedClass(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (classData: Partial<CreateClassRequest>) => {
    try {
      setModalError(null);
      
      if (selectedClass) {
        // Edit existing class - not implemented in API yet
        setClasses((prev) => {
          const grade = selectedClass.grade_level || 'Ungrouped';
          return {
            ...prev,
            [grade]: prev[grade].map((c) =>
              c.id === selectedClass.id ? { ...c, ...classData as any } : c
            ),
          };
        });
      } else {
        // Add new class via API
        const newClassData = {
          name: classData.name || '',
          subject: classData.subject || '',
          grade_level: classData.grade_level || 9,
          academic_year: classData.academic_year || '2025-2026',
          period: classData.period,
          room_number: classData.room_number,
        };

        await addClass(newClassData);
      }
      setIsModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Failed to save class';
      setModalError(message);
    }
  };

  const sortedGrades = Object.keys(classes).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (isNaN(aNum) || isNaN(bNum)) return 0;
    return bNum - aNum;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your classes</p>
          {error && <p className="text-red-600 mt-1 text-sm">{error}</p>}
        </div>
        <button
          onClick={handleAddClass}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add a class</span>
        </button>
      </div>

      {/* Classes by Grade */}
      {sortedGrades.length > 0 ? (
        <div className="space-y-8">
          {sortedGrades.map((grade) => (
            <div key={grade}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Grade {grade}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
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
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No classes yet. Create your first class to get started!</p>
        </div>
      )}

      {/* Unified Modal */}
      <ClassSetupModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(null);
          setModalError(null);
        }}
        classData={selectedClass}
        onSave={handleSaveClass}
        isEdit={!!selectedClass}
        error={modalError}
      />
    </div>
  );
}
