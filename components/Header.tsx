'use client';

import { Search, Bell, ChevronDown, Plus, Play, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import QuickLogModal from '@/components/QuickLogModal';
import { logger } from '@/lib/logger';
import { getIncompleteQuickLogs } from '@/lib/studentService';
import { useTheme } from 'next-themes';
import { useAuth } from '@/app/providers';

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [period, setPeriod] = useState('Period 3');
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [hasIncompleteLogs, setHasIncompleteLogs] = useState(false);
  const [quickLogClassId, setQuickLogClassId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  
  const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U';
  const userName = user?.first_name || 'Teacher';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchIncompleteLogs = async () => {
      try {
        const logs = await getIncompleteQuickLogs();
        setHasIncompleteLogs(logs && logs.length > 0);
      } catch (err) {
        console.error('Failed to fetch incomplete logs for header', err);
      }
    };
    fetchIncompleteLogs();
  }, []);

  // Listen for 'open-quicklog-for-class' event from Dashboard EOD reminder
  useEffect(() => {
    const handleOpenForClass = (e: Event) => {
      const classId = (e as CustomEvent<string>).detail;
      setQuickLogClassId(classId || undefined);
      setIsQuickLogOpen(true);
    };
    window.addEventListener('open-quicklog-for-class', handleOpenForClass);
    return () => window.removeEventListener('open-quicklog-for-class', handleOpenForClass);
  }, []);

  return (
    <>
      <header className="bg-[#151722] border-b border-[#262a3d] px-8 h-[73px] flex items-center sticky top-0 z-50 transition-colors">
        <div className="flex items-center justify-between w-full">
          {/* Left: Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search students, flags, or notes..."
                className="w-full pl-10 pr-4 py-2 text-sm border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-[#1b1e2c] text-white transition-colors placeholder-gray-500"
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-6 ml-8">

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle Night Mode"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>


            {/* Quick Log Button */}
            <button
              onClick={() => {
                logger.buttonClick('Open Quick Log', 'Header');
                setIsQuickLogOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-1.5 bg-[#f97316] text-white rounded-md hover:bg-orange-600 font-semibold text-sm transition-colors"
            >
              <span>{hasIncompleteLogs ? 'Resume Log' : 'Quick Log'}</span>
              {hasIncompleteLogs ? <Play className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#262a3d] cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-[#cbd5e1] text-slate-800 flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <span className="font-medium mr-1">{userName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <QuickLogModal
          onClose={() => {
            setIsQuickLogOpen(false);
            setQuickLogClassId(undefined);
          }}
          initialClassId={quickLogClassId}
        />
      )}
    </>
  );
}
