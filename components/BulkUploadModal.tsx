'use client';

import { useState } from 'react';
import { X, Upload as UploadIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { bulkUploadStudents } from '@/lib/studentService';
import { cacheInvalidate } from '@/lib/dataCache';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  onUploadSuccess: () => Promise<void>;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  classId,
  onUploadSuccess,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const validExtensions = ['.csv', '.xlsx'];

      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      const isValidType = validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension);

      if (!isValidType) {
        setError('Only CSV and XLSX files are supported');
        setFile(null);
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await bulkUploadStudents(file, classId);
      setResult(data);

      // Refresh roster after successful upload
      await onUploadSuccess();

      // Invalidate cache so dashboard reflects new student counts
      cacheInvalidate();

      // Close modal after 2 seconds to show success
      setTimeout(() => {
        setFile(null);
        setResult(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      let message = 'Failed to upload file';
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        message = detail[0]?.msg || message;
      } else if (typeof detail === 'string') {
        message = detail;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      console.error('Upload error:', err?.response?.status, err?.response?.data, err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setError('');
      setResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bulk Upload Students</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {result ? (
            // Success State
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-gray-900">Upload Successful!</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>✅ Created: {result.created} students</p>
                  {result.skipped > 0 && <p>⏭️ Skipped: {result.skipped} students</p>}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-semibold text-yellow-900 text-xs mb-1">Errors:</p>
                      <ul className="text-yellow-700 text-xs space-y-1">
                        {result.errors.slice(0, 3).map((err: string, idx: number) => (
                          <li key={idx}>• {err}</li>
                        ))}
                        {result.errors.length > 3 && (
                          <li>• ... and {result.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Upload Form State
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-2">
                <div className="flex justify-center">
                  <UploadIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {file ? file.name : 'Choose a file to upload'}
                </p>
                <p className="text-xs text-gray-500">CSV or XLSX files up to 5MB</p>
                <label className="inline-block mt-3">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors inline-block disabled:opacity-50">
                    {file ? 'Change File' : 'Select File'}
                  </span>
                </label>
              </div>

              {/* File Format Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">Required Columns:</p>
                <ul className="text-xs text-blue-700 space-y-1 font-mono">
                  <li>• student_id (required)</li>
                  <li>• first_name (required)</li>
                  <li>• last_name (required)</li>
                  <li>• grade_level (required, 6-12)</li>
                  <li>• middle_name (optional)</li>
                  <li>• date_of_birth (optional, YYYY-MM-DD)</li>
                  <li>• gender (optional)</li>
                  <li>• parent_email (optional)</li>
                  <li>• parent_phone (optional)</li>
                  <li>• class_id (optional - auto-assigned to {classId ? 'current class' : 'school'})</li>
                </ul>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
