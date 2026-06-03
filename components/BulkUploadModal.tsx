'use client';

import { useState } from 'react';
import { X, Upload as UploadIcon, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showSkippedNames, setShowSkippedNames] = useState(false);

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
      setShowSkippedNames(false);
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
    setShowSkippedNames(false);

    try {
      const data = await bulkUploadStudents(file, classId);
      setResult(data);

      // Refresh roster after successful upload
      await onUploadSuccess();

      // Invalidate cache so dashboard reflects new student counts
      cacheInvalidate();

      // Auto-close only when everything succeeded with no issues
      const hasErrors = data.errors && data.errors.length > 0;
      const hasSkipped = data.skipped && data.skipped > 0;
      if (!hasErrors && !hasSkipped) {
        setTimeout(() => {
          setFile(null);
          setResult(null);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      let message = 'Failed to upload file';
      const responseData = err?.response?.data;
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.detail) {
          const detail = responseData.detail;
          if (Array.isArray(detail)) {
            message = detail[0]?.msg || detail[0] || message;
          } else if (typeof detail === 'string') {
            message = detail;
          } else if (typeof detail === 'object') {
            message = detail.error || detail.message || JSON.stringify(detail);
          }
        } else if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        }
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      console.error('Upload error details:', err?.response?.status, err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setError('');
      setResult(null);
      setShowSkippedNames(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  // ─── Derive result scenario ──────────────────────────────────────────
  const hasErrors = result?.errors && result.errors.length > 0;
  const hasSkipped = result?.skipped > 0;
  const hasCreated = result?.created > 0;
  const skippedNames: string[] = result?.skipped_names || [];
  // All rows were duplicates — "roster already exists"
  const allSkipped = hasSkipped && !hasCreated && !hasErrors;
  // Some created, some skipped — partial success
  const partialSkipped = hasSkipped && hasCreated;

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
            // ─── Result States ────────────────────────────────────────
            <div className="space-y-4">

              {/* Scenario 1: All duplicates — Roster Already Exists */}
              {allSkipped && (
                <>
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-gray-900 text-lg">Roster Already Exists</h3>
                    <p className="text-sm text-gray-600">
                      All <span className="font-semibold text-amber-700">{result.skipped}</span> student{result.skipped !== 1 ? 's' : ''} in this file {result.skipped !== 1 ? 'are' : 'is'} already enrolled in this class.
                    </p>
                  </div>
                  {/* Expandable skipped names */}
                  {skippedNames.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setShowSkippedNames(!showSkippedNames)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        <span>View enrolled students ({skippedNames.length})</span>
                        {showSkippedNames ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showSkippedNames && (
                        <div className="px-4 pb-3 max-h-32 overflow-y-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {skippedNames.map((name: string, idx: number) => (
                              <span key={idx} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Scenario 2: Pure success (no skips, no errors) */}
              {hasCreated && !hasSkipped && !hasErrors && (
                <>
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-semibold text-gray-900 text-lg">Upload Successful!</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-700">{result.created}</span> student{result.created !== 1 ? 's' : ''} added successfully.
                    </p>
                  </div>
                </>
              )}

              {/* Scenario 3: Partial success — some created, some skipped */}
              {partialSkipped && !hasErrors && (
                <>
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-semibold text-gray-900 text-lg">Upload Completed</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-700">{result.created}</span> student{result.created !== 1 ? 's' : ''} added successfully.
                    </p>
                  </div>
                  {/* Skipped info box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <span className="font-semibold">{result.skipped}</span> student{result.skipped !== 1 ? 's were' : ' was'} already enrolled and skipped.
                      </p>
                    </div>
                    {skippedNames.length > 0 && (
                      <>
                        <button
                          onClick={() => setShowSkippedNames(!showSkippedNames)}
                          className="w-full flex items-center justify-between px-4 py-1.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors border-t border-amber-200"
                        >
                          <span>View skipped students</span>
                          {showSkippedNames ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {showSkippedNames && (
                          <div className="px-4 pb-3 max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-1.5">
                              {skippedNames.map((name: string, idx: number) => (
                                <span key={idx} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Scenario 4: Validation errors (from bad data) */}
              {hasErrors && (
                <>
                  {!hasCreated && !hasSkipped && (
                    <>
                      <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="w-7 h-7 text-red-600" />
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className="font-semibold text-gray-900 text-lg">Upload Failed</h3>
                      </div>
                    </>
                  )}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {result.errors.length} validation error{result.errors.length !== 1 ? 's' : ''}
                    </p>
                    <ul className="text-red-700 text-xs space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((err: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-px">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Also show created/skipped summary if partial */}
                  {(hasCreated || hasSkipped) && (
                    <div className="text-center text-sm text-gray-600 space-y-1">
                      {hasCreated && <p>✅ <span className="font-semibold text-green-700">{result.created}</span> student{result.created !== 1 ? 's' : ''} added</p>}
                      {hasSkipped && <p>⏭️ <span className="font-semibold text-amber-700">{result.skipped}</span> already enrolled</p>}
                    </div>
                  )}
                </>
              )}
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-left">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {result ? (
          (hasErrors || hasSkipped) && (
            <div className="border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-sm"
              >
                Close
              </button>
            </div>
          )
        ) : (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 text-sm"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
