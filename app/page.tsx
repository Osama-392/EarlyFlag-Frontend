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

    if (user) {
      if (user.role === 'admin') {
        router.push('/principal-dashboard');
      } else if (user.role === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, mounted, router]);

  if (!mounted || user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Left Panel */}
      <div className="w-full md:w-[55%] relative flex flex-col justify-between pt-12 lg:pt-20 px-8 lg:px-20 overflow-hidden bg-gradient-to-b from-white to-orange-50/30">

        {/* Background Waves (SVG) Updated */}
        <div className="absolute bottom-0 left-0 w-full z-0 h-[100%] md:h-[50%] pointer-events-none">
          <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="w-full h-full text-orange-400/20 absolute bottom-0">
            <path fill="url(#grad1)" d="M0,300 C200,200 300,400 500,300 C700,200 800,400 1000,250 L1000,500 L0,500 Z" opacity="0.6" />
            <path fill="url(#grad2)" d="M0,400 C250,500 400,200 700,300 C850,350 950,250 1000,200 L1000,500 L0,500 Z" opacity="0.8" />
            <path fill="url(#grad3)" d="M0,500 C150,350 350,350 550,450 C750,550 900,300 1000,400 L1000,500 L0,500 Z" />

            {/* Dashed Line */}
            <path d="M-50,450 C100,400 200,300 350,350" fill="none" stroke="white" strokeWidth="4" strokeDasharray="12 12" />

            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>

          {/* Flag Illustration */}
          <div className="absolute bottom-[20%] left-[30%] z-10 w-24 h-32">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl overflow-visible">
              {/* Pole Base */}
              <ellipse cx="20" cy="115" rx="16" ry="4" fill="#000000" />
              {/* Pole */}
              <rect x="17" y="5" width="6" height="110" fill="#000000" rx="1" />
              {/* Pole Top */}
              <circle cx="20" cy="5" r="6" fill="#000000" />
              {/* Flag Body */}
              <path d="M23 12 C 45 0, 60 30, 98 10 L 75 38 L 98 66 C 60 86, 45 46, 23 58 Z" fill="#eb4b00" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-start font-inter">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-16 lg:mb-24">
            <span className="text-xl font-bold tracking-widest text-slate-800">EARLY <span className="text-orange-500">FLAG</span></span>
          </div>

          {/* Headlines */}
          <div className="max-w-xl">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-800 tracking-tight leading-tight mb-2">
              See risk earlier.
            </h1>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-800 tracking-tight leading-tight mb-6">
              Support students <span className="text-orange-500">better.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              The all-in-one platform for monitoring students, identifying risks, and driving early intervention.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 pb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Identify<br /><span className="font-normal text-slate-500">at-risk students</span></span>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Collaborate<br /><span className="font-normal text-slate-500">with your team</span></span>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Save time,<br /><span className="font-normal text-slate-500">increase impact</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[45%] flex flex-col items-center justify-center p-8 lg:p-16 bg-[#fafafa] relative z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">

        <div className="w-full max-w-md font-inter">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm">Choose how you'd like to sign in.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-12">

            {/* Teacher Card */}
            <button
              onClick={() => router.push('/auth')}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="mb-4 text-emerald-500 bg-emerald-50 p-4 rounded-full group-hover:scale-105 transition-transform">
                {/* Custom Icon for Teacher */}
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="16" r="8" fill="#10b981" />
                  <path d="M10 40C10 32 16 28 24 28C32 28 38 32 38 40" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
                  <path d="M8 44C12 40 18 38 24 38C30 38 36 40 40 44L24 44L8 44Z" fill="#6ee7b7" opacity="0.7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Teacher</h3>
              <p className="text-xs text-slate-500 mb-6 flex-grow leading-relaxed">
                Monitor your students and identify at-risk learners.
              </p>
              <div className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                Sign In <span>→</span>
              </div>
            </button>

            {/* Principal Card */}
            <button
              onClick={() => router.push('/principal-auth')}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="mb-4 text-orange-500 bg-orange-50 p-4 rounded-full group-hover:scale-105 transition-transform">
                {/* Custom Icon for Principal */}
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 8L8 20V42H40V20L24 8Z" fill="#f97316" />
                  <path d="M20 42V28H28V42" fill="#fff" />
                  <circle cx="24" cy="18" r="3" fill="#fff" />
                  <path d="M14 26H18V32H14V26Z" fill="#fff" />
                  <path d="M30 26H34V32H30V26Z" fill="#fff" />
                  <path d="M28 8V4L32 6V11L28 8Z" fill="#ea580c" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Principal</h3>
              <p className="text-xs text-slate-500 mb-6 flex-grow leading-relaxed">
                School-wide oversight and intervention analytics.
              </p>
              <div className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                Sign In <span>→</span>
              </div>
            </button>

          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 11V8.5C9 6.6 10.3 5 12 5c1.7 0 3 1.6 3 3.5V11" stroke="currentColor" strokeWidth="2" />
              <path d="M7 11h10v4.5L12 18l-5-2.5V11z" fill="currentColor" />
              <circle cx="12" cy="13.5" r="1" fill="#fafafa" />
              <path d="M11.3 13.5l-.5 2.5h2.4l-.5-2.5z" fill="#fafafa" />
            </svg>
            Secure. Private. Built for schools.
          </div>
        </div>
      </div>
    </div>
  );
}

