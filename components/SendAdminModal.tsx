'use client';

import { X, Send, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { sendCounselorReferral } from '@/lib/studentService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/Toast';

interface SendAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function SendAdminModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: SendAdminModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await sendCounselorReferral({
        student_id: studentId,
        referral_type: 'manual_admin',
        note: reason,
        priority: 'normal'
      });
      
      logger.formSubmit('SendAdminModal', { studentId, hasReason: true });
      showToast('Successfully sent to admin', 'success');
      setReason('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail?.[0]?.msg || 'Failed to send to admin. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#151722] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-[#262a3d]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-[#262a3d] px-6 py-4 flex items-center justify-between bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center space-x-3 text-red-600 dark:text-red-500">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send to Admin</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sending <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span> to admin will create a referral in the Admin Dashboard for review.
          </p>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Provide details about why you are sending this student to the admin..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b1e2c] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-32"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-[#262a3d] px-6 py-4 bg-gray-50 dark:bg-[#1b1e2c] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={16} />
            {isSubmitting ? 'Sending...' : 'Send to Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
