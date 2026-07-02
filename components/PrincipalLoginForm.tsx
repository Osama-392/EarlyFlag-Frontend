'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export default function PrincipalLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, logout, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      console.log('🔐 Attempting principal login with:', email);
      await login(email, password);
      console.log('✅ Login successful, user data:', JSON.parse(localStorage.getItem('user') || '{}'));
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        const userDataStr = localStorage.getItem('user') || '{}';
        const userData = JSON.parse(userDataStr);
        console.log('📋 Full user object:', userData);
        console.log('📋 User role:', userData.role);
        console.log('📋 Role type:', typeof userData.role);
        console.log('📋 Role === "admin"?', userData.role === 'admin');
        console.log('📋 Role === "teacher"?', userData.role === 'teacher');
        
        // Normalize the role (remove whitespace, convert to lowercase)
        const normalizedRole = userData.role ? userData.role.trim().toLowerCase() : null;
        const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';
        
        if (!isAdmin) {
          console.log('⛔ Access Denied: Teacher attempted principal login:', userData.role);
          logout();
          setLocalError("Access Denied: This login portal is strictly for Principals and Administrators. Please use the Teacher portal.");
          return;
        }

        console.log('🎯 Admin role detected - redirecting to principal dashboard');
        router.push('/principal-dashboard');
      }, 100);
    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      // Error is already set in context
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail size={18} strokeWidth={2} />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f95d12] focus:border-transparent outline-none transition text-sm text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock size={18} strokeWidth={2} />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f95d12] focus:border-transparent outline-none transition text-sm text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{displayError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#f95d12] text-white font-semibold rounded-xl hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} strokeWidth={2.5} />
      </button>

      <div className="text-center text-sm text-gray-600 mt-6" style={{ fontFamily: 'Sora, sans-serif' }}>
        Don't have an account?{' '}
        <Link href="/principal-signup" className="text-[#f95d12] hover:text-[#ea580c] font-bold hover:underline transition-colors">
          Sign up
        </Link>
      </div>
    </form>
  );
}
