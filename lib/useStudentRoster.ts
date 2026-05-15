import { useState, useCallback } from 'react';
import { Student, Signal, getClassStudents, getStudentHistory, logSignals, updateSignal, BatchSignalPayload } from '@/lib/studentService';

export const useStudentRoster = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async (classId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClassStudents(classId);
      setStudents(data);
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to load students';
      setError(message);
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudentHistory = useCallback(async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const history = await getStudentHistory(studentId);
      setStudentHistory(history);
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to load history';
      setError(message);
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const logStudentSignal = useCallback(async (
    studentId: string, 
    signalType: 'green' | 'yellow' | 'red', 
    category?: string, 
    note?: string,
    reason_code?: string
  ) => {
    try {
      setError(null);
      console.log('logStudentSignal called with:', {
        studentId,
        signalType,
        category,
        note,
        reason_code,
      });

      const batch: BatchSignalPayload = {
        signals: [{
          student_id: studentId,
          signal_type: signalType,
          category,
          note,
          reason_code,
        }],
      };

      console.log('Sending batch:', JSON.stringify(batch, null, 2));

      const response = await logSignals(batch);
      
      console.log('Signal logged successfully:', response);
      return true;
    } catch (err: any) {
      const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to log signal';
      setError(message);
      console.error('Error logging signal:', err);
      return false;
    }
  }, []);

  return {
    students,
    selectedStudent,
    setSelectedStudent,
    studentHistory,
    loading,
    error,
    loadStudents,
    loadStudentHistory,
    logStudentSignal,
  };
};
