import { useState, useEffect } from 'react';
import { getTeacherClasses, createClass, Class, CreateClassRequest } from '@/lib/classService';
import { getTeacherDashboard } from '@/lib/dashboardService';
import { withCache, CACHE_KEYS } from '@/lib/dataCache';

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
        
        const finalClasses = await withCache<Class[]>(
          CACHE_KEYS.TEACHER_CLASSES,
          async () => {
            // Fetch classes and dashboard concurrently. 
            // By using getTeacherDashboard(), we hook into the promise cache, avoiding 429 errors.
            const [classesData, dashboardData] = await Promise.all([
              getTeacherClasses(),
              getTeacherDashboard().catch(() => null)
            ]);

            // Merge student_count_active from dashboard if available
            if (dashboardData && dashboardData.classes) {
              return classesData.map(cls => {
                const dashClass = dashboardData.classes.find((c: any) => c.class_id === cls.id);
                return {
                  ...cls,
                  studentCount: dashClass?.student_count_active || 0
                };
              });
            }
            return classesData;
          }
        );
        
        setClasses(finalClasses);
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
