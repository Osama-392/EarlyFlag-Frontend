'use client';

import { ArrowLeft } from 'lucide-react';
import QuickLogPage from '@/components/QuickLogPage';
import { logger } from '@/lib/logger';

interface QuickLogModalProps {
  onClose: () => void;
}

export default function QuickLogModal({ onClose }: QuickLogModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-end">
      <div className="w-full max-w-7xl bg-white rounded-l-xl shadow-2xl h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4">
          <button
            onClick={() => {
              logger.buttonClick('Close Quick Log Modal', 'QuickLogModal');
              onClose();
            }}
            className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8">
          <QuickLogPage onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
