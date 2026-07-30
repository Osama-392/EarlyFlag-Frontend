'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Delete',
  isDestructive = true,
}: ConfirmDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#151722] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-[#262a3d]"
        onClick={e => e.stopPropagation()}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#262a3d] ${isDestructive ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-[#1b1e2c]'}`}>
          <div className={`flex items-center space-x-3 ${isDestructive ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {isDestructive && <AlertTriangle size={20} />}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="border-t border-gray-100 dark:border-[#262a3d] px-6 py-4 bg-gray-50 dark:bg-[#1b1e2c] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-sm' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
