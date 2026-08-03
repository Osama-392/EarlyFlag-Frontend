'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  const { login, verify2FA, logout, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      console.log('🔐 Attempting login with:', email);
      const result = await login(email, password);
      
      if (result && result.requires2fa) {
        console.log('📱 2FA Required');
        setRequires2FA(true);
        if (result.temporaryToken) {
          setTempToken(result.temporaryToken);
        }
        return;
      }

      console.log('✅ Login successful');

      // Add a small delay to ensure state updates
      setTimeout(() => {
        const userDataStr = localStorage.getItem('user') || '{}';
        const userData = JSON.parse(userDataStr);
        console.log('📋 User role:', userData.role);
        const normalizedRole = userData.role ? userData.role.trim().toLowerCase() : null;
        const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';

        if (isAdmin) {
          console.log('⛔ Access Denied: Admin attempted teacher login:', userData.role);
          logout();
          setLocalError("Invalid Credentials");
          return;
        }

        console.log('👨‍🏫 Redirecting to teacher/student dashboard');
        router.push('/dashboard');
      }, 100);
    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      // Error is already set in context
    }
  };

  const displayError = localError || error;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!code) {
      setLocalError('Please enter the 6-digit code');
      return;
    }

    try {
      await verify2FA(code, tempToken);
      
      setTimeout(() => {
        const userDataStr = localStorage.getItem('user') || '{}';
        const userData = JSON.parse(userDataStr);
        const normalizedRole = userData.role ? userData.role.trim().toLowerCase() : null;
        const isAdmin = normalizedRole === 'admin' || normalizedRole === 'principal';

        if (isAdmin) {
          logout();
          setLocalError("Invalid Credentials");
          return;
        }

        router.push('/dashboard');
      }, 100);
    } catch (err) {
      // Error is set in context
    }
  };

  if (requires2FA) {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1.5 font-sora">
            Verification Code
          </label>
          <div className="relative">
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm text-gray-900 placeholder-gray-400"
              disabled={loading}
              maxLength={6}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">A code has been sent to your registered phone number.</p>
        </div>

        {displayError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-500/20 flex items-center justify-center disabled:opacity-70"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Verify'
          )}
        </button>
        
        <button
          type="button"
          onClick={() => setRequires2FA(false)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
        >
          Back to Login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 font-sora">
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
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 font-sora">
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
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm text-gray-900 placeholder-gray-400"
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
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#00a650] text-white font-semibold rounded-xl hover:bg-[#009045] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} strokeWidth={2.5} />
      </button>

      <div className="text-center text-sm text-gray-600 mt-6 font-sora">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#00a650] hover:text-[#009045] font-bold hover:underline transition-colors">
          Sign up
        </Link>
      </div>
    </form>
  );
}
