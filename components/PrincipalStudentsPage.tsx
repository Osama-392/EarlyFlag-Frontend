'use client';

import { Users, Search, TrendingDown, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'on-track' | 'at-risk' | 'critical';
  class: string;
  flagCount: number;
  lastActivity: string;
  avatar: string;
  flagTrend: 'up' | 'down' | 'stable';
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Kai Washington',
    grade: 'Grade 12',
    status: 'on-track',
    class: 'AP Calculus BC',
    flagCount: 2,
    lastActivity: '2h ago',
    avatar: '🎯',
    flagTrend: 'down',
  },
  {
    id: '2',
    name: 'Emma Rodriguez',
    grade: 'Grade 11',
    status: 'at-risk',
    class: 'AP Chemistry',
    flagCount: 7,
    lastActivity: '15m ago',
    avatar: '⚠️',
    flagTrend: 'up',
  },
  {
    id: '3',
    name: 'Jordan Smith',
    grade: 'Grade 10',
    status: 'on-track',
    class: 'English Literature',
    flagCount: 1,
    lastActivity: '3h ago',
    avatar: '✨',
    flagTrend: 'stable',
  },
  {
    id: '4',
    name: 'Alex Chen',
    grade: 'Grade 12',
    status: 'critical',
    class: 'Physics',
    flagCount: 12,
    lastActivity: '5m ago',
    avatar: '🚩',
    flagTrend: 'up',
  },
  {
    id: '5',
    name: 'Sophia Martinez',
    grade: 'Grade 11',
    status: 'at-risk',
    class: 'Spanish III',
    flagCount: 5,
    lastActivity: '1h ago',
    avatar: '📚',
    flagTrend: 'stable',
  },
  {
    id: '6',
    name: 'Marcus Johnson',
    grade: 'Grade 10',
    status: 'on-track',
    class: 'AP Calculus BC',
    flagCount: 0,
    lastActivity: '30m ago',
    avatar: '🌟',
    flagTrend: 'down',
  },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        icon: 'text-red-600',
        dot: 'bg-red-500',
      };
    case 'at-risk':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-700',
        icon: 'text-yellow-600',
        dot: 'bg-yellow-500',
      };
    default:
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-700',
        icon: 'text-green-600',
        dot: 'bg-green-500',
      };
  }
};

export default function PrincipalStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockStudents.length,
    onTrack: mockStudents.filter((s) => s.status === 'on-track').length,
    atRisk: mockStudents.filter((s) => s.status === 'at-risk').length,
    critical: mockStudents.filter((s) => s.status === 'critical').length,
  };

  return (
    <div className="space-y-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .student-card {
          animation: slideInUp 0.5s ease-out forwards;
        }
        
        .student-card:nth-child(1) { animation-delay: 0.05s; }
        .student-card:nth-child(2) { animation-delay: 0.1s; }
        .student-card:nth-child(3) { animation-delay: 0.15s; }
        .student-card:nth-child(4) { animation-delay: 0.2s; }
        .student-card:nth-child(5) { animation-delay: 0.25s; }
        .student-card:nth-child(6) { animation-delay: 0.3s; }
      `}</style>

      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Students
            </h1>
            <p className="text-gray-600 text-sm mt-1">View all students across the school</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">Across all grades</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">On Track</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.onTrack}</p>
          <p className="text-xs text-green-600 mt-2">✓ Good standing</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">At-Risk</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.atRisk}</p>
          <p className="text-xs text-yellow-600 mt-2">⚠️ Needs support</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Critical</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.critical}</p>
          <p className="text-xs text-red-600 mt-2">🚩 Urgent action</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Name, class, or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
          >
            <option value="all">All Students</option>
            <option value="on-track">On Track</option>
            <option value="at-risk">At-Risk</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((student) => {
          const styles = getStatusStyles(student.status);
          return (
            <div
              key={student.id}
              className={`student-card ${styles.bg} border-2 ${styles.border} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              {/* Header with Avatar and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm border border-gray-200">
                    {student.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{student.name}</h3>
                    <p className="text-xs text-gray-600">{student.grade}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${styles.dot}`}></div>
              </div>

              {/* Main Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Primary Class</span>
                  <p className="text-xs font-semibold text-gray-900">{student.class}</p>
                </div>

                {/* Flag Count with Trend */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className={styles.icon} />
                    <span className="text-xs font-medium text-gray-600">Flags This Month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{student.flagCount}</span>
                    {student.flagTrend === 'up' && (
                      <TrendingUp size={16} className="text-red-500" />
                    )}
                    {student.flagTrend === 'down' && (
                      <TrendingDown size={16} className="text-green-500" />
                    )}
                    {student.flagTrend === 'stable' && (
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge and Activity */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
                  {student.status === 'on-track' && '✓ On Track'}
                  {student.status === 'at-risk' && '⚠️ At-Risk'}
                  {student.status === 'critical' && '🚩 Critical'}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-blue-600 transition">
                  <span>{student.lastActivity}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No students found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
