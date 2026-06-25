'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trophy, Medal } from 'lucide-react';
import { getAdminLeaderboard, TeacherLeaderboardRow } from '@/lib/adminDashboardService';

export default function TeacherLeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<TeacherLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await getAdminLeaderboard('7d');
        setLeaderboard(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#151722] p-6 rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm flex items-center justify-between">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            Teacher Leaderboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Top performing teachers ranked by positive student outcomes this week.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1b1e2c] border-b border-gray-200 dark:border-[#262a3d]">
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 w-24 text-center">Rank</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Teacher</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Department</th>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Super Greens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#262a3d]">
              {leaderboard.map((teacher, index) => {
                const rank = index + 1;
                let rankDisplay = <span className="text-gray-500 dark:text-gray-400 font-bold">{rank}</span>;
                
                if (rank === 1) {
                  rankDisplay = <div className="mx-auto w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold border border-yellow-200 dark:border-yellow-400/30"><Medal size={16} /></div>;
                } else if (rank === 2) {
                  rankDisplay = <div className="mx-auto w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-300/20 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold border border-gray-200 dark:border-gray-300/30">{rank}</div>;
                } else if (rank === 3) {
                  rankDisplay = <div className="mx-auto w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-400/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-200 dark:border-orange-400/30">{rank}</div>;
                }

                return (
                  <tr key={teacher.teacher_id} className="hover:bg-gray-50/50 dark:hover:bg-[#1b1e2c]/50 transition-colors">
                    <td className="p-4 align-middle text-center">{rankDisplay}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#262a3d] dark:to-[#1b1e2c] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                          {teacher.teacher_first_name[0]}{teacher.teacher_last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {teacher.teacher_first_name} {teacher.teacher_last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#262a3d] dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {teacher.department || 'General'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="text-xl font-black text-green-600 dark:text-[#4ade80] leading-none">
                          {teacher.super_green_count}
                        </span>
                        <span className="text-[0.65rem] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                          Super Greens
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No leaderboard data available for this week yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
