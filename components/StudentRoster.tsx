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
import EditSignalModal from '@/components/EditSignalModal';
import AddStudentModal from '@/components/AddStudentModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import { updateSignal } from '@/lib/studentService';
import { ArrowLeft, Search, Upload, Plus, Edit2 } from 'lucide-react';

export default function StudentRoster() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { students, loading, error, loadStudents, loadStudentHistory, studentHistory, logStudentSignal } = useStudentRoster();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [selectedStudentForSignal, setSelectedStudentForSignal] = useState<Student | null>(null);
  const [selectedSignalToEdit, setSelectedSignalToEdit] = useState<{ student: Student; signal: any } | null>(null);
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

  const handleUpdateSignal = async (
    signalId: string,
    signalType: 'green' | 'yellow' | 'red',
    category?: string,
    note?: string,
    reasonCode?: string
  ) => {
    try {
      await updateSignal(signalId, {
        signal_type: signalType,
        category,
        note,
        // reason_code: reasonCode // Backend might expect this in category or separate field
      });
      
      await loadStudents(classId);
      setSelectedSignalToEdit(null);
      return true;
    } catch (err) {
      console.error('Failed to update signal:', err);
      return false;
    }
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



  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Back to Classes */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center text-sm text-blue-500 bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>
            {classInfo ? classInfo.name : 'Student Roster'}
          </h1>
          <p className="text-gray-500 mt-1">
            {classInfo
              ? `Grade ${classInfo.grade_level} · ${classInfo.subject || ''} · ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`
              : 'View or edit profile of any student'}
          </p>
          {classId && <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-100 inline-block px-2 py-1 rounded">Class ID: {classId}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span>Upload Students</span>
          </button>
          <button 
            onClick={() => setIsAddStudentOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 max-w-2xl mt-8">
        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search Students by Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button
          className="px-8 py-2.5 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-colors font-medium shadow-sm"
        >
          Search
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Class Container Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">{classInfo ? classInfo.name : 'Loading Class...'}</h2>
            <p className="text-sm text-gray-500">Period {classInfo?.period || '—'}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No students found.</div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => {
                const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();
                
                // MOCKUP Logic: Map status based on today's signal, fallback to neutral
                let statusColor = "bg-gray-400 text-white";
                let statusText = "Neutral";
                if (student.today_signal?.signal_type === 'green') {
                  statusColor = "bg-emerald-500 text-white";
                  statusText = "Super Green";
                } else if (student.today_signal?.signal_type === 'red') {
                  statusColor = "bg-red-400 text-white";
                  statusText = "Red";
                } else if (student.today_signal?.signal_type === 'yellow') {
                  statusColor = "bg-amber-400 text-white";
                  statusText = "Yellow";
                }

                // Mockup counts (using static or extracted if available)
                const yellowCount = student.today_signal?.signal_type === 'yellow' ? 1 : 0; // Ideally from actual history
                const redCount = student.today_signal?.signal_type === 'red' ? 1 : 0;

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                        {initials}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor} tracking-wide uppercase`}>
                            {statusText}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Grade {student.grade_level}</p>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center space-x-3">
                      {/* Indicator Pills */}
                      <div className="flex space-x-2 mr-2">
                        <div className="flex items-center px-2 py-1 bg-amber-50 rounded text-xs font-bold text-amber-600 border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                          {yellowCount}
                        </div>
                        <div className="flex items-center px-2 py-1 bg-red-50 rounded text-xs font-bold text-red-600 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                          {redCount}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {student.today_signal && (
                        <button
                          onClick={() => setSelectedSignalToEdit({ student, signal: student.today_signal })}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors border border-indigo-100/50 flex items-center gap-1"
                          title="Correct today's signal"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/students/${classId}/${student.id}`)}
                        className="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ml-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

      <EditSignalModal
        isOpen={selectedSignalToEdit !== null}
        onClose={() => setSelectedSignalToEdit(null)}
        studentName={selectedSignalToEdit ? `${selectedSignalToEdit.student.first_name} ${selectedSignalToEdit.student.last_name}` : ''}
        signal={selectedSignalToEdit?.signal}
        onUpdate={handleUpdateSignal}
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
        classId={classId}
        onUploadSuccess={async () => {
          await loadStudents(classId);
        }}
      />
    </div>
  );
}
