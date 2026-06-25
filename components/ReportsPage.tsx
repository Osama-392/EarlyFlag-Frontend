'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StudentReportsView from '@/components/StudentReportsView';
import { logger } from '@/lib/logger';
import { useClasses } from '@/lib/useClasses';

interface GradedClasses {
  [key: string]: any[];
}

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const { classes: apiClasses, loading, error } = useClasses();

  useEffect(() => {
    logger.pageNavigation('Reports Page', 'Dashboard');
  }, []);

  // Group classes by grade from API
  const groupedClasses: GradedClasses = useMemo(() => {
    if (!apiClasses || apiClasses.length === 0) return {};
    return apiClasses.reduce((acc, cls) => {
      const grade = cls.grade_level?.toString() || 'Ungrouped';
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(cls);
      return acc;
    }, {} as GradedClasses);
  }, [apiClasses]);

  const sortedGrades = Object.keys(groupedClasses).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (isNaN(aNum) || isNaN(bNum)) return 0;
    return bNum - aNum;
  });

  // If a class is selected, show the student reports view
  if (selectedClass) {
    logger.info(`Selected class: ${selectedClass.name}`, { period: selectedClass.period }, 'ReportsPage');
    
    const grade = selectedClass.grade_level?.toString() || 'Ungrouped';
    const gradeClasses = groupedClasses[grade] || [];
    // Extract unique subjects or class names for this grade
    const gradeSubjects = Array.from(new Set(gradeClasses.map(c => c.subject || c.name)));

    return (
      <StudentReportsView
        classData={{
          id: selectedClass.id,
          name: selectedClass.name,
          period: selectedClass.period || 0,
          subject: selectedClass.subject,
        }}
        gradeSubjects={gradeSubjects}
        onBack={() => {
          logger.info('Back to Reports Page', undefined, 'ReportsPage');
          setSelectedClass(null);
        }}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-pulse text-gray-400">Loading classes...</div>
      </div>
    );
  }

  // Otherwise, show the classes list
  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quickly make a Detailed report for any student</p>
        {error && <p className="text-red-600 mt-1 text-sm">{error}</p>}
      </div>

      {/* Classes by Grade */}
      {sortedGrades.length > 0 ? (
        <div className="space-y-8">
          {sortedGrades.map((grade) => (
            <div key={grade}>
              {/* Grade Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Grade {grade}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {groupedClasses[grade].length} class{groupedClasses[grade].length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Class Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedClasses[grade].map((cls) => {
                  // Fallback values for color and initial if API doesn't have them
                  const color = cls.color || 'from-blue-400 to-blue-600';
                  const initial = cls.initial || (cls.subject ? cls.subject.charAt(0).toUpperCase() : 'C');
                  
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        logger.buttonClick(`Select Class: ${cls.name}`, 'ReportsPage');
                        setSelectedClass(cls);
                      }}
                      className="group bg-white dark:bg-[#151722] rounded-lg border border-gray-200 dark:border-[#262a3d] p-4 hover:shadow-md transition-all text-left"
                    >
                      {/* Class Icon Circle */}
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg mb-3`}
                      >
                        {initial}
                      </div>

                      {/* Class Details */}
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
                        {cls.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Period {cls.period || '-'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No classes found.</p>
        </div>
      )}
    </div>
  );
}
