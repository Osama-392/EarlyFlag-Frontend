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
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'DM Serif Display', serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes float-flag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.5deg); }
        }
        @keyframes trail-draw {
          from { stroke-dashoffset: 600; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.7s ease-out forwards; }
        .animate-fade-up-delay-1 { animation: fade-up 0.7s ease-out 0.1s forwards; opacity: 0; }
        .animate-fade-up-delay-2 { animation: fade-up 0.7s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-up-delay-3 { animation: fade-up 0.7s ease-out 0.35s forwards; opacity: 0; }
        .animate-trail { animation: trail-draw 2s ease-out 0.5s forwards; stroke-dashoffset: 600; }
      `}</style>

      {/* Left Panel */}
      <div className="w-full md:w-[55%] relative flex flex-col justify-between pt-10 lg:pt-16 px-8 lg:px-16 xl:px-20 overflow-hidden" style={{ background: 'linear-gradient(175deg, #ffffff 0%, #fffbf5 40%, #fff7ed 100%)' }}>

        {/* Subtle decorative accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          {/* Top-left rotated square */}
          <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-orange-200/30 rotate-45 rounded-md" />
          {/* Floating accent dot */}
          <div className="absolute top-[18%] right-[8%] w-2 h-2 rounded-full bg-orange-300/40" />
          {/* Cross accent */}
          <svg className="absolute top-[12%] right-[14%] w-5 h-5 opacity-[0.12]" viewBox="0 0 20 20">
            <line x1="0" y1="10" x2="20" y2="10" stroke="#f97316" strokeWidth="2" />
            <line x1="10" y1="0" x2="10" y2="20" stroke="#f97316" strokeWidth="2" />
          </svg>
          {/* Another rotated square, larger, faint */}
          <div className="absolute top-[45%] right-[3%] w-16 h-16 border border-orange-200/20 rotate-[30deg] rounded-sm" />
        </div>

        {/* Mountain Landscape with Flag — bottom portion */}
        <div className="absolute bottom-0 left-0 w-full z-[1] pointer-events-none" style={{ height: '48%' }}>
          <svg
            viewBox="0 0 1000 420"
            preserveAspectRatio="none"
            className="w-full h-full absolute bottom-0"
          >
            <defs>
              <linearGradient id="mtnBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde5c7" />
                <stop offset="100%" stopColor="#fdd8a8" />
              </linearGradient>
              <linearGradient id="mtnMid" x1="0%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="100%" stopColor="#f9a54b" />
              </linearGradient>
              <linearGradient id="mtnMidFront" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="mtnFront" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="flagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* Layer 1 — farthest back, very faded rolling hills */}
            <path
              fill="url(#mtnBack)"
              d="M-50,350 C50,310 120,270 220,240 C320,210 380,280 480,250 C580,220 650,190 750,220 C850,250 950,230 1050,200 L1050,420 L-50,420 Z"
              opacity="0.3"
            />

            {/* Layer 2 — mid-back, gentle ridgeline */}
            <path
              fill="url(#mtnMid)"
              d="M-50,370 C30,340 90,300 180,310 C270,320 340,260 420,220 C480,190 530,210 600,250 C680,295 780,260 880,280 C950,295 1010,270 1050,260 L1050,420 L-50,420 Z"
              opacity="0.4"
            />

            {/* Layer 3 — mid-front mountain with ridge */}
            <path
              fill="url(#mtnMidFront)"
              d="M-50,390 C20,375 80,355 160,360 C240,365 300,310 370,250 C410,215 440,200 470,215 C510,240 560,290 640,320 C730,355 840,340 940,350 C990,356 1030,360 1050,365 L1050,420 L-50,420 Z"
              opacity="0.6"
            />

            {/* Layer 4 — front mountain range, solid, prominent peak in center-left */}
            <path
              fill="url(#mtnFront)"
              d="M-50,410 C0,405 50,395 120,380 C190,365 250,340 310,300 C350,275 380,235 415,190 C430,170 442,160 455,160 C468,160 480,170 495,190 C530,230 560,280 620,315 C690,355 770,370 850,378 C920,384 980,392 1050,398 L1050,420 L-50,420 Z"
            />

            {/* Dashed trail — from bottom-left curving up to the peak */}
            <path
              d="M-20,415 C30,408 90,398 170,380 C250,362 310,335 360,298 C390,275 410,248 435,215"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="3"
              strokeDasharray="9 9"
              strokeLinecap="round"
              className="animate-trail"
            />

            {/* Flag on the peak */}
            <g transform="translate(443, 65)">
              {/* Pole shadow */}
              <line x1="11" y1="12" x2="11" y2="96" stroke="rgba(0,0,0,0.08)" strokeWidth="5" strokeLinecap="round" />
              {/* Pole */}
              <line x1="10" y1="0" x2="10" y2="95" stroke="#1a202c" strokeWidth="3" strokeLinecap="round" />
              {/* Pole knob */}
              <circle cx="10" cy="0" r="3" fill="#1a202c" />
              {/* Flag pennant */}
              <path d="M12 5 C24 -1, 34 12, 50 6 L42 19 L50 32 C34 40, 24 25, 12 31 Z" fill="url(#flagGrad)" />
            </g>
          </svg>
        </div>

        {/* Text content — above the mountains */}
        <div className="relative z-10 flex flex-col items-start font-body">
          {/* Logo */}
          <div className="flex items-center gap-1.5 mb-12 lg:mb-16 animate-fade-up">
            <span className="text-[0.95rem] font-extrabold tracking-[0.32em] uppercase text-slate-800">
              Early <span className="text-orange-500">Flag</span>
            </span>
          </div>

          {/* Headlines */}
          <div className="max-w-xl animate-fade-up-delay-1">
            <h1 className="font-display text-[2.8rem] sm:text-[3.4rem] lg:text-[3.8rem] text-slate-800 leading-[1.08] mb-1.5 tracking-tight">
              See risk earlier.
            </h1>
            <h1 className="font-display text-[2.8rem] sm:text-[3.4rem] lg:text-[3.8rem] text-slate-800 leading-[1.08] mb-7 tracking-tight">
              Support students{' '}
              <span className="text-orange-500" style={{ fontStyle: 'italic' }}>better.</span>
            </h1>
            <p className="text-[1.05rem] lg:text-[1.12rem] text-slate-500 leading-[1.7] mb-10 max-w-md font-medium">
              The all-in-one platform for monitoring students, identifying risks, and driving early intervention.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center gap-5 lg:gap-7 pb-16 animate-fade-up-delay-3">
            {/* Identify */}
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-orange-100/80 flex items-center justify-center transition-transform group-hover:scale-110">
                <svg className="w-[18px] h-[18px] text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="text-[0.82rem] font-bold text-slate-700 leading-tight">
                Identify<br /><span className="font-medium text-slate-400">at-risk students</span>
              </span>
            </div>

            <div className="hidden md:block w-px h-7 bg-slate-200/80" />

            {/* Collaborate */}
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-100/80 flex items-center justify-center transition-transform group-hover:scale-110">
                <svg className="w-[18px] h-[18px] text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-[0.82rem] font-bold text-slate-700 leading-tight">
                Collaborate<br /><span className="font-medium text-slate-400">with your team</span>
              </span>
            </div>

            <div className="hidden md:block w-px h-7 bg-slate-200/80" />

            {/* Save time */}
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-100/80 flex items-center justify-center transition-transform group-hover:scale-110">
                <svg className="w-[18px] h-[18px] text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[0.82rem] font-bold text-slate-700 leading-tight">
                Save time,<br /><span className="font-medium text-slate-400">increase impact</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[45%] flex flex-col items-center justify-center p-8 lg:p-16 bg-[#fafafa] relative z-20 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">

        <div className="w-full max-w-md font-body">
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
    </div >
  );
}

