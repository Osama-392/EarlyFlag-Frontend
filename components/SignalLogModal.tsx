'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SignalLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  onLog: (
    signalType: 'green' | 'yellow' | 'red',
    category?: string,
    note?: string,
    reason_code?: string
  ) => Promise<boolean>;
}

const YELLOW_CATEGORIES = ['Academic', 'Behavioral', 'Attendance'];
const RED_CATEGORIES = ['Academic', 'Behavioral', 'Attendance'];
const GREEN_REASON_CODES = ['Excellence', 'Improvement', 'Participation', 'Kindness'];

export default function SignalLogModal({
  isOpen,
  onClose,
  studentName,
  onLog,
}: SignalLogModalProps) {
  const [selectedSignal, setSelectedSignal] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!selectedSignal) {
      setError('Please select a signal type');
      return false;
    }

    if ((selectedSignal === 'yellow' || selectedSignal === 'red') && !category) {
      setError(`${selectedSignal === 'yellow' ? 'Yellow' : 'Red'} signals require a category`);
      return false;
    }

    if (selectedSignal === 'red' && !note && !saveForLater) {
      setError('Red signals require either a note or "Save for Later"');
      return false;
    }

    if (selectedSignal === 'green' && !reasonCode) {
      setError('Green signals require a reason code');
      return false;
    }

    return true;
  };

  const handleLog = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const success = await onLog(
        selectedSignal!,
        category || undefined,
        note || undefined,
        reasonCode || undefined
      );

      if (success) {
        setSelectedSignal(null);
        setCategory('');
        setNote('');
        setReasonCode('');
        setSaveForLater(false);
        onClose();
      } else {
        setError('Failed to log signal. Please try again.');
      }
    } catch (err: any) {
      console.error('Error in handleLog:', err);
      setError('An error occurred while logging the signal.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Signal</h2>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Signal Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Signal Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['green', 'yellow', 'red'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSignal(type)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                    selectedSignal === type
                      ? type === 'green'
                        ? 'bg-green-100 text-green-700 border-2 border-green-600'
                        : type === 'yellow'
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
                        : 'bg-red-100 text-red-700 border-2 border-red-600'
                      : type === 'green'
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : type === 'yellow'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                      : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  {type === 'green' ? '✨ Good' : type === 'yellow' ? '⚠️ Warning' : '🚨 Critical'}
                </button>
              ))}
            </div>
          </div>

          {/* Category - for Yellow and Red */}
          {(selectedSignal === 'yellow' || selectedSignal === 'red') && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
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
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Note {selectedSignal === 'red' ? <span className="text-red-500">*</span> : '(Optional)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details about this signal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
              disabled={loading}
            />
          </div>

          {/* Save for Later - Red signals only */}
          {selectedSignal === 'red' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveForLater}
                onChange={(e) => setSaveForLater(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Save for later (skip note)</span>
            </label>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLog}
            disabled={loading || !selectedSignal}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-all ${
              selectedSignal === 'green'
                ? 'bg-green-600 hover:bg-green-700'
                : selectedSignal === 'yellow'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : selectedSignal === 'red'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400'
            } disabled:opacity-50`}
          >
            {loading ? 'Logging...' : 'Log Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}
