
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Home, Users, BarChart3, FileText, Award, LogOut } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Classes', href: '/students' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Award, label: 'Recognition', href: '/recognition' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard' && (pathname === '/dashboard' || pathname === '/')) return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U';
  const userName = user?.first_name || 'Teacher';

  return (
    <aside className="w-64 bg-white dark:bg-[#151722] border-r border-[#262a3d] flex flex-col transition-colors">
      {/* Logo */}
      <div className="h-[73px] px-8 bg-[#151722] border-b border-[#262a3d] flex items-center shrink-0">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center hover:opacity-80 transition-opacity w-full"
        >
          <span className="text-[17px] font-bold tracking-[0.2em] text-white">EARLY <span className="text-[#f97316]">FLAG</span></span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    active
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1b1e2c]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-[#262a3d] space-y-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1b1e2c]">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-medium flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

