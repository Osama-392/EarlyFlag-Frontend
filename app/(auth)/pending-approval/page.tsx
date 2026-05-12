'use client';

import { CheckCircle, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-yellow-50 rounded-full">
            <Clock size={48} className="text-yellow-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
        <p className="text-gray-600 mb-6">
          Your account has been created successfully! Your school administrator will review your
          request and approve your account soon.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Check Your Email</p>
              <p className="text-sm text-gray-600 mt-1">
                You'll receive a notification when your account is approved.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/auth"
          className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
