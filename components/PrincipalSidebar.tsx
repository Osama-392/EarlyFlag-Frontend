'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { 
  LayoutDashboard, 
  Globe, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronUp,
  User
} from 'lucide-react';

export default function PrincipalSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/principal-dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'School Overview',
      href: '/school-overview',
      icon: Globe,
    },
    {
      label: 'Classes',
      href: '/principal-students',
      icon: Users,
    },
    {
      label: 'Teachers',
      href: '/principal-teachers',
      icon: UserCheck,
    },
    {
      label: 'Reports',
      href: '/principal-reports',
      icon: BarChart3,
    },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/principal-dashboard' && (pathname === '/principal-dashboard' || pathname === '/')) return true;
    if (href !== '/principal-dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static left-0 top-0 h-screen w-64 bg-white dark:bg-[#151722] border-r border-[#262a3d] shadow-lg transition-colors duration-300 z-40 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-[73px] px-8 bg-[#151722] border-b border-[#262a3d] flex items-center shrink-0">
          <Link href="/principal-dashboard" className="flex items-center hover:opacity-80 transition-opacity w-full">
            <span className="text-[17px] font-bold tracking-[0.2em] text-white">EARLY <span className="text-[#f97316]">FLAG</span></span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1b1e2c]'
                }`}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-[#262a3d] relative">
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] rounded-xl shadow-lg overflow-hidden py-1 z-50">
              <button
                onClick={() => { router.push('/principal-profile'); setIsUserMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202330] transition-colors text-left text-sm"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Profile</span>
              </button>
              <button
                onClick={() => { router.push('/principal-settings'); setIsUserMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202330] transition-colors text-left text-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="font-medium">Settings</span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-[#262a3d]" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#1b1e2c] hover:bg-gray-100 dark:hover:bg-[#202330] transition-colors text-left"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-medium flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Principal</p>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
