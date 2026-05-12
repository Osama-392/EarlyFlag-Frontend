import { useState, useEffect } from 'react';
import { getTeacherClasses, createClass, Class, CreateClassRequest } from '@/lib/classService';

export const useClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTeacherClasses();
        setClasses(data);
      } catch (err: any) {
        let message = 'Failed to load classes';
        
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
          message = 'Failed to load classes';
        }
        
        setError(message);
        console.error('Error loading classes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  // Create a new class
  const addClass = async (classData: CreateClassRequest) => {
    try {
      setError(null);
      const newClass = await createClass(classData);
      setClasses([...classes, newClass]);
      return newClass;
    } catch (err: any) {
      let message = 'Failed to create class';
      
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
        message = 'Failed to create class';
      }
      
      setError(message);
      throw new Error(message);
    }
  };

  return {
    classes,
    loading,
    error,
    addClass,
    setClasses,
    setError,
  };
};
