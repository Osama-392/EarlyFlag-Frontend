'use client';

import { ArrowLeft } from 'lucide-react';
import QuickLogPage from '@/components/QuickLogPage';
import { logger } from '@/lib/logger';

interface QuickLogModalProps {
  onClose: () => void;
}

export default function QuickLogModal({ onClose }: QuickLogModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-end"
      onClick={() => {
        logger.buttonClick('Backdrop close Quick Log', 'QuickLogModal');
        onClose();
      }}
    >
      <div
        className="w-full max-w-7xl bg-white rounded-l-xl shadow-2xl h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
          <button
            onClick={() => {
              logger.buttonClick('Close Quick Log Modal', 'QuickLogModal');
              onClose();
            }}
            className="inline-flex items-center text-base text-teal-600 hover:text-teal-700 font-semibold transition-colors gap-2 py-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4">
          <QuickLogPage onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
