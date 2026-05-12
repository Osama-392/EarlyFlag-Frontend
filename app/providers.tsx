'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  school_id?: string;
  role?: string;
  approval_status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, school_id: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');

        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsPending(parsedUser.approval_status === 'pending');
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/login', {
        email,
        password,
      });

      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsPending(userData.approval_status === 'pending');
    } catch (err: any) {
      let message = 'Login failed. Please try again.';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // Handle if detail is an array of error objects (Pydantic validation errors)
        if (Array.isArray(detail)) {
          message = detail.map((e: any) => e.msg || String(e)).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        }
      } else if (err.message && typeof err.message === 'string') {
        message = err.message;
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, schoolId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/signup', {
        email,
        password,
        schoolId,
      });

      const userData = response.data?.user;
      if (userData && typeof userData === 'object') {
        setUser(userData);
        setIsPending(true);
      } else {
        setIsPending(true);
      }
    } catch (err: any) {
      let message = 'Signup failed. Please try again.';
      
      try {
        if (err?.response?.data?.detail) {
          const detail = err.response.data.detail;
          if (Array.isArray(detail)) {
            message = detail.map((e: any) => {
              if (typeof e === 'object' && e.msg) return e.msg;
              return String(e);
            }).join(', ');
          } else if (typeof detail === 'string') {
            message = detail;
          }
        } else if (err?.message && typeof err.message === 'string') {
          message = err.message;
        }
      } catch (errorParsingErr) {
        // If error parsing fails, use default message
        message = 'Signup failed. Please try again.';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPending(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user && !isPending,
    isPending,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
