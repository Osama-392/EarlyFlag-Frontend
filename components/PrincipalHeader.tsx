'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Bell, Settings, LogOut, Search, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function PrincipalHeader() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userInitials = user ? `${user.first_name?.[0] || user.email?.charAt(0) || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'P';
  const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email?.split('@')[0];

  return (
    <header className="bg-[#151722] border-b border-[#262a3d] px-8 h-[73px] flex items-center sticky top-0 z-50 transition-colors">
      <div className="flex items-center justify-between w-full">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search classes, students, teachers..."
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

          {/* Notifications */}
          <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#151722]">3</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 pl-4 border-l border-[#262a3d] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-[#cbd5e1] text-slate-800 flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <span className="font-medium mr-1">{userName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-600">Principal</p>
                </div>

                <button
                  onClick={() => {
                    router.push('/principal-settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left text-sm"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left text-sm border-t border-gray-200"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
