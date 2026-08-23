'use client';

import { X, Send, AlertCircle, BookOpen, Users, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { sendCounselorReferral, SignalCategory } from '@/lib/studentService';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/Toast';

interface SendAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSubmitSuccess?: () => void;
}

export default function SendAdminModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSubmitSuccess,
}: SendAdminModalProps) {
  const [category, setCategory] = useState<SignalCategory>('academic');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason / note before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await sendCounselorReferral({
        student_id: studentId,
        referral_type: 'manual_admin',
        category: category,
        note: reason.trim(),
        priority: 'urgent',
      });

      logger.formSubmit('SendAdminModal', { studentId, category, hasReason: true });
      showToast('Successfully sent referral to admin', 'success');
      setReason('');
      setCategory('academic');
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.detail || 'Failed to send to admin. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error');
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
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sending <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span> to admin will create an urgent red referral for administrator review.
            </p>

            {/* Concern Category Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Concern Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('academic')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    category === 'academic'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-500 dark:border-red-500 ring-2 ring-red-500/20 shadow-sm'
                      : 'bg-gray-50 dark:bg-[#1b1e2c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-[#262a3d]'
                  }`}
                >
                  <BookOpen size={16} className={category === 'academic' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'} />
                  <span>Academic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('behavioral')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    category === 'behavioral'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-500 dark:border-red-500 ring-2 ring-red-500/20 shadow-sm'
                      : 'bg-gray-50 dark:bg-[#1b1e2c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-[#262a3d]'
                  }`}
                >
                  <Users size={16} className={category === 'behavioral' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'} />
                  <span>Behavioral</span>
                </button>
              </div>
            </div>
            
            {/* Notes / Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Teacher's Note / Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Describe the incident, academic deficit, or behavioral concern..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b1e2c] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-32"
                required
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
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send to Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
