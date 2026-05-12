'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStudentRoster } from '@/lib/useStudentRoster';
import { Student } from '@/lib/studentService';
import { getStudentHistory } from '@/lib/studentService';
import { getClass, Class } from '@/lib/classService';
import StudentHistoryModal from '@/components/StudentHistoryModal';
import SignalLogModal from '@/components/SignalLogModal';
import AddStudentModal from '@/components/AddStudentModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import { ArrowLeft, Search, Upload, Plus, LogOut } from 'lucide-react';

export default function StudentRoster() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { students, loading, error, loadStudents, loadStudentHistory, studentHistory, logStudentSignal } = useStudentRoster();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [selectedStudentForSignal, setSelectedStudentForSignal] = useState<Student | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<Class | null>(null);

  // Load students and class info on mount or classId change
  useEffect(() => {
    if (classId) {
      loadStudents(classId);
      // Fetch class details to get grade level
      getClass(classId)
        .then((cls) => setClassInfo(cls))
        .catch((err) => console.error('Failed to load class info:', err));
    }
  }, [classId, loadStudents]);

  const handleViewHistory = async (student: Student) => {
    setSelectedStudentForHistory(student);
    setHistoryLoading(true);
    await loadStudentHistory(student.id);
    setHistoryLoading(false);
  };

  const handleLogSignal = async (student: Student) => {
    setSelectedStudentForSignal(student);
  };

  const handleSignalLogged = async (signalType: 'green' | 'yellow' | 'red', category?: string, note?: string, reasonCode?: string) => {
    console.log('handleSignalLogged called with:', {
      signalType,
      category,
      note,
      reasonCode,
      student: selectedStudentForSignal?.first_name,
    });

    if (!selectedStudentForSignal) {
      console.error('No student selected');
      return false;
    }
    
    const success = await logStudentSignal(selectedStudentForSignal.id, signalType, category, note, reasonCode);
    console.log('logStudentSignal returned:', success);

    if (success) {
      console.log('Signal logged successfully, refreshing students...');
      // Refresh students list
      await loadStudents(classId);
      setSelectedStudentForSignal(null);
    }
    return success;
  };

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
    
    if (red > 0) return { text: 'At Risk', color: 'bg-red-100 text-red-700' };
    if (yellow > 0) return { text: 'Monitor', color: 'bg-yellow-100 text-yellow-700' };
    if (green > 0) return { text: 'Good', color: 'bg-green-100 text-green-700' };
    return null;
  };

  const filteredStudents = Array.isArray(students)
    ? students.filter((student) =>
        `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {classInfo ? classInfo.name : 'Student Roster'}
          </h1>
          <p className="text-gray-500 mt-1">
            {classInfo
              ? `Grade ${classInfo.grade_level} · ${classInfo.subject || ''} · ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`
              : 'View or edit profile of any student'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="w-5 h-5" />
            <span>Upload Students</span>
          </button>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" onClick={() => setIsAddStudentOpen(true)}>
            <Plus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form className="flex items-center space-x-3">
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

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-semibold">Error loading students:</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">Loading students for this class...</p>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No students found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => {
              const { green, yellow, red } = getSignalCounts(student);
              const status = getStatusBadge(student);
              const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();

              return (
                <div
                  key={student.id}
                  onClick={() => router.push(`/students/${classId}/${student.id}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {initials}
                    </div>

                    {/* Student Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        {status && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Grade {student.grade_level}</p>
                    </div>
                  </div>

                  {/* Signal Badges */}
                  <div className="flex items-center space-x-2">
                    {green > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✨ {green}
                      </span>
                    )}
                    {yellow > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ {yellow}
                      </span>
                    )}
                    {red > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🚨 {red}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => handleLogSignal(student)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Log signal"
                    >
                      <LogOut className="w-4 h-4" />
                      Log
                    </button>
                    <button
                      onClick={() => handleViewHistory(student)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      title="View history"
                    >
                      👤
                      <span>History</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentHistoryModal
        isOpen={selectedStudentForHistory !== null}
        onClose={() => setSelectedStudentForHistory(null)}
        studentName={selectedStudentForHistory ? `${selectedStudentForHistory.first_name} ${selectedStudentForHistory.last_name}` : ''}
        history={studentHistory}
        loading={historyLoading}
      />

      <SignalLogModal
        isOpen={selectedStudentForSignal !== null}
        onClose={() => setSelectedStudentForSignal(null)}
        studentName={selectedStudentForSignal ? `${selectedStudentForSignal.first_name} ${selectedStudentForSignal.last_name}` : ''}
        onLog={handleSignalLogged}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        classId={classId}
        classGradeLevel={classInfo?.grade_level}
        onAddSuccess={async () => {
          await loadStudents(classId);
        }}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={async () => {
          await loadStudents(classId);
        }}
      />
    </div>
  );
}
