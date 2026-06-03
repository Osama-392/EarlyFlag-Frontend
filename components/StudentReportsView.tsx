'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, FileText, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateReportModal from '@/components/CreateReportModal';
import ReportView from '@/components/ReportView';
import { logger } from '@/lib/logger';
import { useStudentRoster } from '@/lib/useStudentRoster';
import { Student } from '@/lib/studentService';

interface StudentReportsProps {
  classData: {
    id: string;
    name: string;
    period: number;
    subject?: string;
  };
  gradeSubjects: string[];
  onBack: () => void;
}

export default function StudentReportsView({
  classData,
  gradeSubjects,
  onBack,
}: StudentReportsProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const { students, loading, error, loadStudents } = useStudentRoster();

  useEffect(() => {
    logger.info(`Viewing students for ${classData.name}`, { period: classData.period }, 'StudentReportsView');
    if (classData?.id) {
      loadStudents(classData.id);
    }
  }, [classData, loadStudents]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    if (!searchTerm.trim()) return students;
    return students.filter((student) =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  const getSignalCounts = (student: Student) => {
    if (!student.today_signal) return { green: 0, yellow: 0, red: 0 };
    const signal = student.today_signal;
    if (signal.signal_type === 'green') return { green: 1, yellow: 0, red: 0 };
    if (signal.signal_type === 'yellow') return { green: 0, yellow: 1, red: 0 };
    if (signal.signal_type === 'red') return { green: 0, yellow: 0, red: 1 };
    return { green: 0, yellow: 0, red: 0 };
  };

  const getStatusBadge = (student: Student) => {
    const { green, yellow, red } = getSignalCounts(student);
    if (red > 0) return { text: 'Red Flag', color: 'bg-red-100 text-red-700' };
    if (yellow > 0) return { text: 'Yellow', color: 'bg-yellow-100 text-yellow-700' };
    if (green > 0) return { text: 'Super Green', color: 'bg-green-100 text-green-700' };
    return { text: 'Neutral', color: 'bg-gray-100 text-gray-700' };
  };

  const handleCreateReport = (student: Student) => {
    logger.buttonClick(`Create Report for ${student.first_name}`, 'StudentReportsView');
    setSelectedStudent(student);
    setIsReportModalOpen(true);
  };

  const handleGenerateReport = (reportData: any) => {
    logger.reportGeneration(`${selectedStudent?.first_name} ${selectedStudent?.last_name}`, reportData);
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
        student={{
          id: generatedReport.student.id,
          name: `${generatedReport.student.first_name} ${generatedReport.student.last_name}`,
          gradeLevel: parseInt(generatedReport.student.grade_level) || 9,
          initial: `${generatedReport.student.first_name.charAt(0)}${generatedReport.student.last_name.charAt(0)}`.toUpperCase(),
          bgColor: 'from-blue-400 to-blue-600'
        }}
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
        Back to Classes
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
        <p className="text-sm text-gray-500">Period {classData.period || '-'}</p>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <div className="animate-pulse text-gray-400">Loading students...</div>
        </div>
      )}

      {/* Student List */}
      {!loading && (
        <div className="space-y-3">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const status = getStatusBadge(student);
              const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();

              return (
                <div
                  key={student.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  {/* Left: Student Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                    >
                      {initials}
                    </div>

                    {/* Student Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{student.first_name} {student.last_name}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Grade {student.grade_level || 9}</p>
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
                    <button 
                      onClick={() => router.push(`/students/${classData.id}/${student.id}`)}
                      className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
      )}

      {/* Create Report Modal */}
      {selectedStudent && (
        <CreateReportModal
          isOpen={isReportModalOpen}
          student={{
            id: selectedStudent.id,
            name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
            status: getStatusBadge(selectedStudent).text.toLowerCase() as any,
            initial: `${selectedStudent.first_name.charAt(0)}${selectedStudent.last_name.charAt(0)}`.toUpperCase(),
            bgColor: 'from-blue-400 to-blue-600',
            redCount: getSignalCounts(selectedStudent).red,
            yellowCount: getSignalCounts(selectedStudent).yellow,
          }}
          defaultSubject={classData.subject || classData.name}
          gradeSubjects={gradeSubjects}
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
