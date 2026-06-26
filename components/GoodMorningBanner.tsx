'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface GoodMorningBannerProps {
  name: string;
  metric1: React.ReactNode;
  metric2: React.ReactNode;
  metric3: React.ReactNode;
  recommendation?: string;
}

export default function GoodMorningBanner({
  name,
  metric1,
  metric2,
  metric3,
  recommendation,
}: GoodMorningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show once per day
    const today = new Date().toLocaleDateString();
    const dismissedDate = localStorage.getItem('goodMorningBannerDismissed');
    
    if (dismissedDate !== today) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('goodMorningBannerDismissed', today);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm mb-6 p-4 md:px-6 md:py-5 animate-fade-in group">
      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss banner"
      >
        <X size={20} />
      </button>
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80 dark:opacity-40">
        <svg
          className="absolute right-0 bottom-0 min-w-[800px] h-full object-cover transform translate-x-10 translate-y-4"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Waves */}
          <path
            d="M0,200 C150,150 250,220 400,120 C550,20 650,80 800,40 C950,0 1000,60 1000,60 L1000,200 L0,200 Z"
            fill="url(#grad1)"
            opacity="0.3"
          />
          <path
            d="M0,200 C200,180 300,100 450,140 C600,180 700,60 850,80 C950,90 1000,140 1000,140 L1000,200 L0,200 Z"
            fill="url(#grad2)"
            opacity="0.5"
          />
          
          {/* Dotted path leading to flag */}
          <path
            d="M300,200 Q450,160 550,120 T650,40"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="6 6"
            fill="none"
            opacity="0.6"
          />

          {/* Flagpole */}
          <line x1="650" y1="40" x2="650" y2="80" stroke="#1f2937" strokeWidth="4" />
          
          {/* Flag pennant */}
          <path d="M650,40 L690,50 L650,60 Z" fill="#ea580c" />

          <defs>
            <linearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fff7ed" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffedd5" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full md:w-2/3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Good Morning, {name} ☀️
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          {metric1},<br />
          {metric2},<br />
          and {metric3}.
        </p>
        
        {recommendation && (
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-orange-50/50 dark:bg-orange-900/10 p-2.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
            <Sparkles size={16} className="text-orange-500 shrink-0" />
            <p><span className="font-semibold text-orange-700 dark:text-orange-400">Today's tip:</span> {recommendation}</p>
          </div>
        )}
      </div>

    </div>
  );
}
