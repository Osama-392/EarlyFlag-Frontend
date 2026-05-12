'use client';

import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-100">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">📚</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display' }}>
            EarlyFlag
          </h1>
          <p className="text-gray-600 text-sm">Student Monitoring & Early Intervention</p>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Sora' }}>Teacher Login</h2>
          <p className="text-sm text-gray-600 mt-1">Access your personalized dashboard</p>
        </div>

        <LoginForm />

        <div className="text-center text-xs text-gray-500 pt-4">
          <a href="/" className="hover:text-gray-700 font-medium">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
