"use client";

import { Users, Search, Filter, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPendingTeachers, approveTeacher, rejectTeacher, PendingTeacher } from '@/lib/adminService';

export default function PrincipalTeachersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pending, setPending] = useState<PendingTeacher[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadPending = async () => {
      try {
        setLoadingPending(true);
        const data = await getPendingTeachers();
        setPending(data || []);
      } catch (err) {
        console.error('Failed to load pending teachers', err);
      } finally {
        setLoadingPending(false);
      }
    };

    loadPending();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this teacher?')) return;
    try {
      setActionLoading(id);
      await approveTeacher(id);
      setPending((p) => p.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Approve failed', err);
      alert('Failed to approve - check console');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this teacher?')) return;
    try {
      setActionLoading(id);
      await rejectTeacher(id);
      setPending((p) => p.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Reject failed', err);
      alert('Failed to reject - check console');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
          Teachers
        </h1>
        <p className="text-gray-600">Manage teachers and their class assignments</p>
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Teacher Approvals</h2>
          {loadingPending ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {pending.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{t.first_name} {t.last_name}</div>
                    <div className="text-sm text-gray-600">{t.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(t.id)}
                      disabled={actionLoading === t.id}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      {actionLoading === t.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(t.id)}
                      disabled={actionLoading === t.id}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Total Teachers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">127</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Active Classes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">342</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Avg Students/Teacher</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">22.4</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Teachers</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Teacher Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Classes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Students</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {i % 2 === 0 ? 'Ms. Johnson' : 'Mr. Williams'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {i % 2 === 0 ? 'mjohnson@school.edu' : 'mwilliams@school.edu'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {['Mathematics', 'English', 'Science', 'History', 'PE'][i - 1]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{4 + i}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{(i + 1) * 25}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center justify-center p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
