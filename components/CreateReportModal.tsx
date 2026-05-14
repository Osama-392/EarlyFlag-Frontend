'use client';

import { useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { generateStudentReport } from '@/lib/studentService';

interface CreateReportModalProps {
  isOpen: boolean;
  student: {
    id: string;
    name: string;
    status: string;
    initial: string;
    bgColor: string;
  };
  defaultSubject: string;
  gradeSubjects: string[];
  onClose: () => void;
  onGenerate: (reportData: any) => void;
}

export default function CreateReportModal({
  isOpen,
  student,
  defaultSubject,
  gradeSubjects,
  onClose,
  onGenerate,
}: CreateReportModalProps) {
  // Calculate dynamic dates
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 90);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const [startDate, setStartDate] = useState(formatDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [subject, setSubject] = useState(defaultSubject);
  const [includeTeachersNotes, setIncludeTeachersNotes] = useState(true);
  const [includeAIRecommendations, setIncludeAIRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        subject,
        include_teachers_notes: includeTeachersNotes,
        include_ai_recommendations: includeAIRecommendations,
      };
      
      const apiResponse = await generateStudentReport(student.id, payload);
      logger.formSubmit('CreateReportModal', payload);
      
      // Pass both the payload settings and the actual response to the parent
      onGenerate({ ...payload, result: apiResponse });
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setError(err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Student Avatar */}
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.bgColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
            >
              {student.initial}
            </div>

            {/* Student Info */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{student.name}</h3>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                  1
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-400 text-white text-xs font-bold rounded-full">
                  2
                </span>
              </div>
            </div>
          </div>

          {/* Export & Close Buttons */}
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition-colors font-medium text-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              disabled={loading}
              onClick={() => {
                logger.modalClose('CreateReportModal');
                onClose();
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }} className="p-6 space-y-6">
          {/* Timeline Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Select a timeline for the Report
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value={formatDate(thirtyDaysAgo)}>Last 30 Days ({formatLabel(thirtyDaysAgo)})</option>
                  <option value={formatDate(ninetyDaysAgo)}>Last 90 Days ({formatLabel(ninetyDaysAgo)})</option>
                </select>
              </div>

              {/* End Date */}
              <div>
                <select
                  value={endDate}
                  onChange={(e) => {
                    logger.formChange('endDate', e.target.value, 'CreateReportModal');
                    setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value={formatDate(today)}>Today ({formatLabel(today)})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-600 mb-2">
              Subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => {
                logger.formChange('subject', e.target.value, 'CreateReportModal');
                setSubject(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {(gradeSubjects?.length ? gradeSubjects : [defaultSubject]).map((subj, idx) => (
                <option key={idx} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {/* Include Teachers Notes */}
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeTeachersNotes}
                onChange={(e) => {
                  logger.formChange('includeTeachersNotes', e.target.checked, 'CreateReportModal');
                  setIncludeTeachersNotes(e.target.checked);
                }}
                className="w-5 h-5 border-2 border-blue-500 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">Include Teachers Notes</span>
            </label>

            {/* Include AI Recommendations */}
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeAIRecommendations}
                onChange={(e) => {
                  logger.formChange('includeAIRecommendations', e.target.checked, 'CreateReportModal');
                  setIncludeAIRecommendations(e.target.checked);
                }}
                className="w-5 h-5 border-2 border-gray-300 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-400">Include AI Recommendations</span>
            </label>
          </div>

          {/* Create Report Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              'Create Report'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
