'use client';

import { Search, Bell, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import QuickLogModal from '@/components/QuickLogModal';
import { logger } from '@/lib/logger';

export default function Header() {
  const [period, setPeriod] = useState('Period 3');
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, flags, or notes..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-3 ml-8">
            {/* Period Selector */}
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
              <span>{period}</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Quick Log Button */}
            <button 
              onClick={() => {
                logger.buttonClick('Open Quick Log', 'Header');
                setIsQuickLogOpen(true);
              }}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              <span>Quick Log</span>
              <Plus className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <QuickLogModal onClose={() => setIsQuickLogOpen(false)} />
      )}
    </>
  );
}
