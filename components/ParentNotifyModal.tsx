'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { notifyParent } from '@/lib/studentService';

interface ParentNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
}

export default function ParentNotifyModal({
  isOpen,
  onClose,
  studentName,
  studentId,
}: ParentNotifyModalProps) {
  const [template, setTemplate] = useState('Academic Update');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      await notifyParent({
        student_id: studentId,
        template,
        message,
      });

      setSuccess(true);
      setTimeout(() => {
        setTemplate('Academic Update');
        setMessage('');
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to notify parent:', err);
      setError(err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || 'Failed to send notification to parent.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notify Parent of {studentName}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              <CheckCircle size={16} />
              Notification queued successfully!
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={loading || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Academic Update">Academic Update (Grade/Progress)</option>
              <option value="Behavioral Alert">Behavioral Alert (Disruption/Action)</option>
              <option value="Attendance Concern">Attendance Concern (Absence/Tardy)</option>
              <option value="Positive Recognition">Positive Recognition (Good Behavior/Achievement)</option>
              <option value="Custom Message">Custom Message</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context / Message *
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || success}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={5}
              placeholder="Provide specific details about the incident or update..."
            />
            <p className="text-xs text-gray-500 mt-2">
              This message will be included in the automated email/SMS template sent to the primary contact on file.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || loading || success}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Notification'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
