'use client';

import { ArrowLeft, Mail, MessageSquare, Edit, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getStudentHistory } from '@/lib/studentService';

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.studentId as string;
  const classId = params.classId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch student history which contains signal data
        const historyData = await getStudentHistory(studentId);
        setHistory(historyData);
      } catch (err: any) {
        const message = err?.response?.data?.detail?.[0]?.msg || 'Failed to load student data';
        setError(message);
        console.error('Error loading student:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href={`/students/${classId}`}
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Roster
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/students/${classId}`}
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Roster
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {studentId.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
              <p className="text-gray-600">ID: {studentId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Signal History</h2>
        </div>
        
        {history && history.signals && history.signals.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {history.signals.map((signal: any, idx: number) => {
              const signalColor = 
                signal.signal_type === 'green' ? 'bg-green-100 text-green-800' :
                signal.signal_type === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';

              return (
                <div key={idx} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${signalColor}`}>
                          {signal.signal_type === 'green' ? '✨ Good' : signal.signal_type === 'yellow' ? '⚠️ Warning' : '🚨 Critical'}
                        </span>
                        {signal.category && (
                          <span className="text-xs font-medium text-gray-600">{signal.category}</span>
                        )}
                      </div>
                      {signal.note && (
                        <p className="text-sm text-gray-700 mb-1">{signal.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {signal.created_at ? new Date(signal.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No signal history available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-3 pt-6 border-t border-gray-200">
        <button className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Mail className="w-5 h-5" />
          <span>Email Counselor</span>
        </button>
        <button className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          <MessageSquare className="w-5 h-5" />
          <span>Leave Note</span>
        </button>
        <button className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          <Edit className="w-5 h-5" />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
}
