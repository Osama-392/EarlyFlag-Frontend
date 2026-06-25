'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getAdminHeatmap, HeatmapBlock } from '@/lib/adminDashboardService';

// Deterministic color based on the first letter of the class name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-purple-500',
    'bg-indigo-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export default function PrincipalStudentsPage() {
  const router = useRouter();
  const [heatmap, setHeatmap] = useState<HeatmapBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetching 30d range to get the latest class data, though range doesn't strictly matter for just listing classes
      const data = await getAdminHeatmap('30d');
      setHeatmap(data);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
      setError(err?.response?.data?.detail || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
        {[1, 2, 3].map((grade) => (
          <div key={grade} className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((card) => (
                <div key={card} className="h-24 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-900 dark:text-white dark:text-white font-semibold text-lg mb-2">Unable to load classes</p>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => fetchClasses()} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition">
          Try Again
        </button>
      </div>
    );
  }

  // Sort grade buckets descending (e.g., Grade 12, Grade 11, Grade 10)
  const sortedBuckets = heatmap?.grade_buckets ? [...heatmap.grade_buckets].sort((a, b) => b.grade_level - a.grade_level) : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center">
        <button 
          onClick={() => router.push('/principal-dashboard')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white dark:bg-[#151722] dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] dark:border-[#262a3d] rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white mb-2" style={{ fontFamily: 'Sora' }}>Classes</h1>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-base">View all classes across the school</p>
      </div>

      {/* Classes by Grade */}
      {sortedBuckets.map((bucket) => (
        <div key={bucket.grade_level} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontFamily: 'Sora' }}>
              Grade {bucket.grade_level}
            </h2>
            <span className="text-sm font-medium text-gray-400 bg-gray-50 dark:bg-[#1b1e2c] dark:bg-[#1b1e2c] px-3 py-1 rounded-full border border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d]">
              {bucket.tiles.length} classes
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bucket.tiles.map((tile) => (
              <div 
                key={tile.class_id}
                onClick={() => router.push(`/principal-classes/${tile.class_id}`)}
                className="bg-white dark:bg-[#151722] dark:bg-[#151722] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 dark:border-[#262a3d] dark:border-[#262a3d] flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform ${getAvatarColor(tile.class_name)}`}>
                  {tile.class_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white dark:text-white truncate pr-2">{tile.class_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1 truncate">{tile.teacher_first_name} {tile.teacher_last_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sortedBuckets.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 dark:text-gray-400">
          No classes found.
        </div>
      )}
    </div>
  );
}
