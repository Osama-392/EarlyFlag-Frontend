'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface UploadStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadStudentsModal({
  isOpen,
  onClose,
}: UploadStudentsModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      console.log('Uploading file:', file);
      // Handle upload logic here
      setFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Roster PDF</h2>
            <p className="text-sm text-gray-600 mt-1">Add new students to your class roster</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200"></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* File Upload Area */}
          <label
            htmlFor="file-upload"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex items-center justify-between border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              id="file-upload"
              type="file"
              onChange={handleChange}
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
            />

            {/* Left: File text */}
            <span className="text-sm text-gray-500 font-medium">
              {file ? file.name : 'Upload a file'}
            </span>

            {/* Right: Upload Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('file-upload')?.click();
              }}
              className="flex-shrink-0 bg-red-400 hover:bg-red-500 text-white rounded-lg p-3 transition-colors shadow-md hover:shadow-lg"
            >
              <Upload className="w-5 h-5" />
            </button>
          </label>

          {/* Selected File Info */}
          {file && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900">
                ✓ {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
