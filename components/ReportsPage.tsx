'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StudentReportsView from '@/components/StudentReportsView';
import { logger } from '@/lib/logger';

interface Class {
  id: string;
  name: string;
  subject: string;
  period: number;
  gradeLevel: number;
  color: string;
  initial: string;
}

interface GradedClasses {
  [key: number]: Class[];
}

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  useEffect(() => {
    logger.pageNavigation('Reports Page', 'Dashboard');
  }, []);

  // Mock data - same as ClassesPage
  const mockClasses: Class[] = [
    {
      id: '1',
      name: 'AP Calculus BC',
      subject: 'Math',
      initial: 'A',
      period: 3,
      gradeLevel: 12,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: '2',
      name: 'Physics',
      subject: 'Science',
      initial: 'P',
      period: 4,
      gradeLevel: 12,
      color: 'from-green-400 to-green-600',
    },
    {
      id: '3',
      name: 'Art Studio',
      subject: 'Arts',
      initial: 'A',
      period: 6,
      gradeLevel: 12,
      color: 'from-pink-400 to-pink-600',
    },
    {
      id: '4',
      name: 'AP Calculus BC',
      subject: 'Math',
      initial: 'A',
      period: 3,
      gradeLevel: 6,
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: '5',
      name: 'Physics',
      subject: 'Science',
      initial: 'P',
      period: 4,
      gradeLevel: 6,
      color: 'from-green-400 to-green-600',
    },
    {
      id: '6',
      name: 'Art Studio',
      subject: 'Arts',
      initial: 'A',
      period: 6,
      gradeLevel: 7,
      color: 'from-pink-400 to-pink-600',
    },
  ];

  // Group classes by grade
  const groupedClasses: GradedClasses = useMemo(() => {
    return mockClasses.reduce((acc, cls) => {
      if (!acc[cls.gradeLevel]) {
        acc[cls.gradeLevel] = [];
      }
      acc[cls.gradeLevel].push(cls);
      return acc;
    }, {} as GradedClasses);
  }, []);

  const sortedGrades = Object.keys(groupedClasses)
    .map(Number)
    .sort((a, b) => b - a);

  // If a class is selected, show the student reports view
  if (selectedClass) {
    logger.info(`Selected class: ${selectedClass.name}`, { period: selectedClass.period }, 'ReportsPage');
    return (
      <StudentReportsView
        classData={{
          id: selectedClass.id,
          name: selectedClass.name,
          period: selectedClass.period,
        }}
        onBack={() => {
          logger.info('Back to Reports Page', undefined, 'ReportsPage');
          setSelectedClass(null);
        }}
      />
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
        <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
        <p className="text-gray-500 mt-1">Quickly make a Detailed report for any student</p>
      </div>

      {/* Classes by Grade */}
      <div className="space-y-8">
        {sortedGrades.map((grade) => (
          <div key={grade}>
            {/* Grade Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Grade {grade}</h2>
              <span className="text-sm text-gray-500">
                {groupedClasses[grade].length} class{groupedClasses[grade].length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedClasses[grade].map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    logger.buttonClick(`Select Class: ${cls.name}`, 'ReportsPage');
                    setSelectedClass(cls);
                  }}
                  className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all text-left"
                >
                  {/* Class Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${cls.color} flex items-center justify-center text-white font-bold text-lg mb-3`}
                  >
                    {cls.initial}
                  </div>

                  {/* Class Details */}
                  <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Period {cls.period}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
