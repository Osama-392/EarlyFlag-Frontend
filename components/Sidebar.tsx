
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Home, Users, BarChart3, FileText, Award, LogOut } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Classes', href: '/students' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Award, label: 'Recognition', href: '/recognition' },
];

export default function Sidebar() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const isActive = (href: string) => {
    if (href === '/' && currentPath === '/') return true;
    if (href !== '/' && currentPath.startsWith(href)) return true;
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity w-full"
        >
          <Image
            src="/logo.png"
            alt="EarlyFlag Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-gray-900">EarlyFlag</span>
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
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50'
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
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

