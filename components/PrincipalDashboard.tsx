'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  teacher: string;
  period: string;
  status: 'critical' | 'at-risk' | 'on-track';
  critical: number;
  atRisk: number;
  onTrack: number;
  avatar: string;
}

interface GradeData {
  grade: string;
  classes: ClassData[];
}

// Mock data based on the design
const mockData: GradeData[] = [
  {
    grade: 'Grade 12',
    classes: [
      {
        id: '1',
        name: 'Statistics 3C',
        teacher: 'Ms. Oliveira BC',
        period: 'Period 3',
        status: 'critical',
        critical: 3,
        atRisk: 0,
        onTrack: 12,
        avatar: '👩‍🏫',
      },
      {
        id: '2',
        name: 'AP Chemistry',
        teacher: 'Dr. Mendez',
        period: 'Period 2',
        status: 'at-risk',
        critical: 0,
        atRisk: 4,
        onTrack: 18,
        avatar: '👨‍🏫',
      },
      {
        id: '3',
        name: 'English Literature',
        teacher: 'Mrs. Davis',
        period: 'Period 1',
        status: 'at-risk',
        critical: 0,
        atRisk: 2,
        onTrack: 15,
        avatar: '👩‍🏫',
      },
    ],
  },
  {
    grade: 'Grade 11',
    classes: [
      {
        id: '4',
        name: 'AP Calculus BC',
        teacher: 'Mr. Johnson',
        period: 'Period 3',
        status: 'critical',
        critical: 2,
        atRisk: 0,
        onTrack: 14,
        avatar: '👨‍🏫',
      },
      {
        id: '5',
        name: 'World History',
        teacher: 'Mr. Thompson',
        period: 'Period 2',
        status: 'on-track',
        critical: 0,
        atRisk: 0,
        onTrack: 20,
        avatar: '👨‍🏫',
      },
      {
        id: '6',
        name: 'Physics B',
        teacher: 'Dr. Martinez',
        period: 'Period 5',
        status: 'on-track',
        critical: 0,
        atRisk: 0,
        onTrack: 22,
        avatar: '👨‍🏫',
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical':
      return { bg: 'bg-red-100', border: 'border-red-200', icon: 'text-red-600', badge: 'bg-red-500' };
    case 'at-risk':
      return { bg: 'bg-yellow-100', border: 'border-yellow-200', icon: 'text-yellow-600', badge: 'bg-yellow-500' };
    case 'on-track':
      return { bg: 'bg-green-100', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-500' };
    default:
      return { bg: 'bg-gray-100', border: 'border-gray-200', icon: 'text-gray-600', badge: 'bg-gray-500' };
  }
};

export default function PrincipalDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Calculate overall statistics
  const stats = {
    totalClasses: 24,
    critical: 3,
    atRisk: 9,
    onTrack: 12,
  };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
          School Heat Map
        </h1>
        <p className="text-gray-600">Real-time class overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClasses}</p>
            </div>
            <BarChart3 size={32} className="text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
            </div>
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">At-Risk</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.atRisk}</p>
            </div>
            <Zap size={32} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">On Track</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.onTrack}</p>
            </div>
            <CheckCircle size={32} className="text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {['all', 'critical', 'at-risk', 'on-track'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === period
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Classes by Grade */}
      <div className="space-y-8">
        {mockData.map((gradeData) => (
          <div key={gradeData.grade}>
            {/* Grade Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Sora' }}>
                {gradeData.grade}
              </h2>
              <span className="text-sm text-gray-500 font-medium">
                {gradeData.classes.length} classes
              </span>
            </div>

            {/* Classes Grid */}
            <div className="grid md:grid-cols-3 gap-5">
              {gradeData.classes.map((classItem) => {
                const colors = getStatusColor(classItem.status);

                return (
                  <div
                    key={classItem.id}
                    className={`${colors.bg} ${colors.border} border-2 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-102`}
                  >
                    {/* Class Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-700 mt-1">{classItem.period}</p>
                      </div>
                      <div className={`w-12 h-12 ${colors.badge} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                        {classItem.avatar}
                      </div>
                    </div>

                    {/* Teacher Info */}
                    <div className="mb-4 pb-4 border-b border-gray-300 border-opacity-50">
                      <p className="text-sm font-medium text-gray-800">
                        {classItem.teacher}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      {classItem.critical > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-700">🔴 Critical</span>
                          <span className="text-lg font-bold text-red-700">+{classItem.critical}</span>
                        </div>
                      )}
                      {classItem.atRisk > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-700">🟡 At-Risk</span>
                          <span className="text-lg font-bold text-yellow-700">+{classItem.atRisk}</span>
                        </div>
                      )}
                      {classItem.onTrack > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">🟢 On-Track</span>
                          <span className="text-lg font-bold text-green-700">{classItem.onTrack}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
