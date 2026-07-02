'use client';

import PrincipalLoginForm from '@/components/PrincipalLoginForm';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrincipalLoginPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
      `}</style>
      
      {/* Background Graphic (Wavy flag-like pattern) */}
      <div className="absolute bottom-0 left-0 w-full h-[45vh] pointer-events-none opacity-80 z-0">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gradWavy" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fff3e0" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradOrange" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb74d" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffe0b2" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="gradDarkOrange" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f95d12" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff9800" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path fill="url(#gradWavy)" d="M0,256L48,229.3C96,203,192,149,288,138.7C384,128,480,160,576,186.7C672,213,768,235,864,224C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="url(#gradOrange)" d="M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,170.7C672,160,768,192,864,208C960,224,1056,224,1152,208C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="url(#gradDarkOrange)" d="M0,288L80,266.7C160,245,320,203,480,197.3C640,192,800,224,960,234.7C1120,245,1280,235,1360,229.3L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          
          {/* Flag Path */}
          <path d="M480,197.3 Q320,203 160,245" stroke="white" strokeWidth="2" strokeDasharray="5, 5" fill="none" opacity="0.6" />
          <line x1="480" y1="197.3" x2="480" y2="100" stroke="#1f2937" strokeWidth="4" />
          <path d="M480,100 L530,115 L480,130 Z" fill="#f95d12" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-10 font-bold text-2xl md:text-[26px] tracking-[0.15em] flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span className="text-[#1e293b]">EARLY</span>
          <span className="text-[#f95d12]">FLAG</span>
        </div>

        {/* Floating Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 md:p-10 w-full relative border border-gray-100/50">
          
          {/* Back Button inside card */}
          <div className="absolute top-6 left-6 z-20">
            <Link 
              href="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-200/60 shadow-xs transition-all font-medium text-xs"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Back
            </Link>
          </div>

          {/* Header Icon */}
          <div className="flex justify-center mb-5 relative">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex flex-col items-center justify-center text-[#f95d12] relative overflow-hidden">
               {/* Custom School Building shape to match mockup loosely */}
               <svg width="40" height="34" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-2">
                 {/* Center Building */}
                 <path d="M12 8 L28 8 L28 30 L12 30 Z" fill="#f95d12" />
                 <path d="M14 0 L26 0 L26 8 L14 8 Z" fill="#f95d12" />
                 {/* Left Wing */}
                 <path d="M2 16 L12 16 L12 30 L2 30 Z" fill="#ff7f3f" />
                 {/* Right Wing */}
                 <path d="M28 16 L38 16 L38 30 L28 30 Z" fill="#ff7f3f" />
                 {/* Flag on top */}
                 <path d="M20 0 L20 -6 L26 -4 L20 -2" fill="#f95d12" />
                 
                 {/* Door */}
                 <path d="M16 22 L24 22 L24 30 L16 30 Z" fill="white" />
                 <circle cx="20" cy="22" r="4" fill="white" />
                 
                 {/* Windows */}
                 <rect x="17" y="10" width="2" height="3" fill="white" />
                 <rect x="21" y="10" width="2" height="3" fill="white" />
                 
                 <rect x="5" y="19" width="4" height="4" fill="white" />
                 <rect x="31" y="19" width="4" height="4" fill="white" />
               </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[26px] md:text-[30px] font-bold text-[#0f172a] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              Principal Login
            </h1>
            <p className="text-[15px] text-[#64748b] leading-relaxed max-w-[280px] mx-auto">
              School-wide oversight and intervention analytics.
            </p>
          </div>

          <PrincipalLoginForm />

          {/* Footer Security Badge */}
          <div className="mt-10">
             <div className="flex items-center justify-center gap-4 text-gray-200 mb-5 relative">
                <div className="h-px bg-gray-200 flex-1"></div>
                <div className="bg-white px-2">
                   <Lock size={16} className="text-gray-400" strokeWidth={2.5} />
                </div>
                <div className="h-px bg-gray-200 flex-1"></div>
             </div>
             <p className="text-center text-[13px] text-gray-500 font-medium">
               Secure. Private. Built for schools.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
