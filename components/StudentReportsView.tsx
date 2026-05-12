'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, FileText, Eye } from 'lucide-react';
import CreateReportModal from '@/components/CreateReportModal';
import ReportView from '@/components/ReportView';
import { logger } from '@/lib/logger';

interface Student {
  id: string;
  name: string;
  gradeLevel: number;
  status: 'super-green' | 'yellow' | 'red' | 'neutral';
  initial: string;
  bgColor: string;
}

interface StudentReportsProps {
  classData: {
    id: string;
    name: string;
    period: number;
  };
  onBack: () => void;
}

export default function StudentReportsView({
  classData,
  onBack,
}: StudentReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  useEffect(() => {
    logger.info(`Viewing students for ${classData.name}`, { period: classData.period }, 'StudentReportsView');
  }, [classData]);

  // Mock student data
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'James Wilson',
      gradeLevel: 11,
      status: 'super-green',
      initial: 'JW',
      bgColor: 'from-blue-400 to-blue-600',
    },
    {
      id: '2',
      name: 'Amelia Taylor',
      gradeLevel: 9,
      status: 'red',
      initial: 'AT',
      bgColor: 'from-purple-400 to-purple-600',
    },
    {
      id: '3',
      name: 'Benjamin Moore',
      gradeLevel: 11,
      status: 'super-green',
      initial: 'BM',
      bgColor: 'from-cyan-400 to-cyan-600',
    },
    {
      id: '4',
      name: 'Mia Anderson',
      gradeLevel: 9,
      status: 'yellow',
      initial: 'MA',
      bgColor: 'from-red-400 to-red-600',
    },
    {
      id: '5',
      name: 'Oliver White',
      gradeLevel: 10,
      status: 'neutral',
      initial: 'OW',
      bgColor: 'from-gray-400 to-gray-600',
    },
  ];

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return mockStudents;
    return mockStudents.filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'super-green':
        return 'bg-green-100 text-green-700';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'neutral':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'super-green':
        return 'Super Green';
      case 'yellow':
        return 'Yellow';
      case 'red':
        return 'Red Flag';
      case 'neutral':
        return 'Neutral';
      default:
        return 'Unknown';
    }
  };

  const handleCreateReport = (student: Student) => {
    logger.buttonClick(`Create Report for ${student.name}`, 'StudentReportsView');
    setSelectedStudent(student);
    setIsReportModalOpen(true);
  };

  const handleGenerateReport = (reportData: any) => {
    logger.reportGeneration(selectedStudent?.name || 'Unknown', reportData);
    // Store report data and show report view
    setGeneratedReport({
      student: selectedStudent,
      reportData: reportData,
    });
    setIsReportModalOpen(false);
  };

  const handleBackFromReport = () => {
    logger.info('Back from report view', undefined, 'StudentReportsView');
    setGeneratedReport(null);
    setSelectedStudent(null);
  };

  // Show report view if a report has been generated
  if (generatedReport) {
    return (
      <ReportView
        student={generatedReport.student}
        reportData={generatedReport.reportData}
        onBack={handleBackFromReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Classes */}
      <button
        onClick={() => {
          logger.buttonClick('Back to Reports', 'StudentReportsView');
          onBack();
        }}
        className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Reports</h1>
        <p className="text-gray-500 mt-1">Quickly make a Detailed report for any student</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Students by Name..."
              value={searchTerm}
              onChange={(e) => {
                logger.formChange('studentSearch', e.target.value, 'StudentReportsView');
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <button className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
          Search
        </button>
      </div>

      {/* Class Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">{classData.name}</h2>
        <p className="text-sm text-gray-500">Period {classData.period}</p>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              {/* Left: Student Info */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${student.bgColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {student.initial}
                </div>

                {/* Student Details */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeColor(
                        student.status
                      )}`}
                    >
                      {getStatusLabel(student.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Grade {student.gradeLevel}</p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <button 
                  onClick={() => handleCreateReport(student)}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Report</span>
                </button>
                <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm">
                  <Eye className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No students found</p>
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {selectedStudent && (
        <CreateReportModal
          isOpen={isReportModalOpen}
          student={selectedStudent}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedStudent(null);
          }}
          onGenerate={handleGenerateReport}
        />
      )}
    </div>
  );
}
