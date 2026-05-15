'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function PrincipalLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, loading, error } = useAuth();
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
        console.log('📋 Normalized role:', normalizedRole);
        
        if (normalizedRole === 'admin') {
          console.log('🎯 Admin role detected - redirecting to principal dashboard');
          router.push('/principal-dashboard');
        } else if (normalizedRole === 'teacher') {
          console.log('⚠️ User is a teacher, redirecting to teacher dashboard');
          router.push('/dashboard');
        } else {
          console.log('❌ Unknown role:', userData.role);
          console.log('❌ All available data:', JSON.stringify(userData, null, 2));
          setLocalError(`Unknown user role: "${userData.role}". Principals must have 'admin' role.`);
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      // Error is already set in context
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm">{displayError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/principal-signup" className="text-blue-600 hover:underline font-medium">
          Request access
        </Link>
      </div>

      <div className="text-center text-xs text-gray-500 pt-2">
        <Link href="/" className="hover:text-gray-700">
          Back to home
        </Link>
      </div>
    </form>
  );
}
