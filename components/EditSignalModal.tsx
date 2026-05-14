'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Signal } from '@/lib/studentService';

interface EditSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  signal: Signal | null;
  onUpdate: (
    signalId: string,
    signalType: 'green' | 'yellow' | 'red',
    category?: string,
    note?: string,
    reason_code?: string
  ) => Promise<boolean>;
}

const YELLOW_CATEGORIES = ['Academic', 'Behavioral', 'Attendance'];
const RED_CATEGORIES = ['Academic', 'Behavioral', 'Attendance'];
const GREEN_REASON_CODES = ['Excellence', 'Improvement', 'Participation', 'Kindness'];

export default function EditSignalModal({
  isOpen,
  onClose,
  studentName,
  signal,
  onUpdate,
}: EditSignalModalProps) {
  const [selectedSignal, setSelectedSignal] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with existing signal data
  useEffect(() => {
    if (isOpen && signal) {
      setSelectedSignal(signal.signal_type);
      setCategory(signal.category || '');
      setNote(signal.note || '');
      // If it's green, the reason code might be stored in category or a separate field in backend
      // But based on our SignalLogModal, we send reasonCode as the 4th param.
      // We'll assume the backend returns it in a way we can identify.
      // For now, let's just initialize what we have.
      setError('');
    }
  }, [isOpen, signal]);

  const validateForm = () => {
    if (!selectedSignal) {
      setError('Please select a signal type');
      return false;
    }

    if ((selectedSignal === 'yellow' || selectedSignal === 'red') && !category) {
      setError(`${selectedSignal === 'yellow' ? 'Yellow' : 'Red'} signals require a category`);
      return false;
    }

    if (selectedSignal === 'green' && !reasonCode && !category) {
       // Note: in our system, reasonCode for green might be stored in category
       // Let's be flexible
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm() || !signal) return;

    setLoading(true);
    setError('');

    try {
      const success = await onUpdate(
        signal.id,
        selectedSignal!,
        category || undefined,
        note || undefined,
        reasonCode || undefined
      );

      if (success) {
        onClose();
      } else {
        setError('Failed to update signal. Please try again.');
      }
    } catch (err: any) {
      console.error('Error in handleUpdate:', err);
      setError('An error occurred while updating the signal.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Signal</h2>
            <p className="text-sm text-slate-500 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Signal Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Signal Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['green', 'yellow', 'red'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSignal(type)}
                  className={`px-3 py-3 rounded-xl font-bold transition-all text-xs flex flex-col items-center gap-1.5 ${
                    selectedSignal === type
                      ? type === 'green'
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500 shadow-sm'
                        : type === 'yellow'
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500 shadow-sm'
                        : 'bg-red-100 text-red-700 border-2 border-red-500 shadow-sm'
                      : 'bg-gray-50 text-slate-400 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">
                    {type === 'green' ? '✨' : type === 'yellow' ? '⚠️' : '🚨'}
                  </span>
                  {type === 'green' ? 'Good' : type === 'yellow' ? 'Warning' : 'Critical'}
                </button>
              ))}
            </div>
          </div>

          {/* Category - for Yellow and Red */}
          {(selectedSignal === 'yellow' || selectedSignal === 'red') && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700"
                disabled={loading}
              >
                <option value="">Select category...</option>
                {(selectedSignal === 'yellow' ? YELLOW_CATEGORIES : RED_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason Code - for Green */}
          {selectedSignal === 'green' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reasonCode || category}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700"
                disabled={loading}
              >
                <option value="">Select reason...</option>
                {GREEN_REASON_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Note {selectedSignal === 'red' ? <span className="text-red-500">*</span> : '(Optional)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Correct the details about this signal..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700 resize-none"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-in shake duration-300">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs font-medium text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-slate-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-bold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !selectedSignal}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold transition-all hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Update Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}
