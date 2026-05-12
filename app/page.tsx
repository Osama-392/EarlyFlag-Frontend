'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';

export default function RootPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // If user is logged in, redirect to appropriate dashboard
    if (user) {
      if (user.role === 'admin') {
        router.push('/principal-dashboard');
      } else if (user.role === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard'); // Default to teacher dashboard
      }
    }
  }, [user, mounted, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user exists, don't show selection page
  if (user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>
      
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-2xl">🚩</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            EarlyFlag
          </h1>
          <p className="text-xl text-slate-300">Student Monitoring & Early Intervention Platform</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Teacher Card */}
          <button
            onClick={() => router.push('/auth')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Sora' }}>Teacher</h2>
              <p className="text-emerald-100 mb-6">Monitor your students and identify at-risk learners</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-emerald-100 text-sm font-medium group-hover:bg-white/30 transition-colors">
                Sign In <span>→</span>
              </div>
            </div>
          </button>

          {/* Principal Card */}
          <button
            onClick={() => router.push('/principal-auth')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/10 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">👔</div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Sora' }}>Principal</h2>
              <p className="text-amber-100 mb-6">School-wide oversight and intervention analytics</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-amber-100 text-sm font-medium group-hover:bg-white/30 transition-colors">
                Sign In <span>→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>Early intervention. Real impact. For every student.</p>
        </div>
      </div>
    </div>
  );
}
