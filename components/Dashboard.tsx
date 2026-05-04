'use client';

import { Mail, Phone, Eye } from 'lucide-react';

export default function Dashboard() {

  const stats = [
    {
      label: 'Students Flagged This Week',
      value: '12',
      change: '+15%',
      icon: '👥',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-100',
    },
    {
      label: 'Yellow Flags (30 Days)',
      value: '34',
      change: '+8%',
      icon: '⚠️',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-100',
    },
    {
      label: 'Red Flags (30 Days)',
      value: '8',
      change: '-12%',
      icon: '🚨',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-100',
    },
  ];

  const yellowFlagData = [
    { name: 'Emma Rodriguez', academic: 2, behavioral: 1, total: 3, streak: '2 days ago', lastFlag: '2 days ago' },
    { name: 'Tyler Chen', academic: 3, behavioral: 0, total: 3, streak: 'Today', lastFlag: 'Today' },
    { name: 'Marcus Jefferson', academic: 1, behavioral: 1, total: 2, streak: 'Yesterday', lastFlag: '1 day ago' },
  ];

  const redUrgentData = [
    { name: 'Sarah Williams', issue: 'Chronic absenteeism', color: 'bg-red-100', badge: '3M' },
    { name: 'James Lee', issue: 'Academic regression pattern', color: 'bg-red-100', badge: '3M' },
    { name: 'Maya Patel', issue: 'Behavioral escalation', color: 'bg-red-100', badge: '5d' },
  ];

  const recentActivity = [
    { icon: '📋', text: 'Emma Rodriguez flagged for off-task behavior', time: '2 hrs ago' },
    { icon: '💬', text: 'Smart Recommendations updated', time: '4 hrs ago', highlight: true },
    { icon: '📊', text: 'Alex Kim reached 20-day green streak', time: '1 day ago' },
    { icon: '📋', text: 'Weekly pattern report available', time: '1 day ago' },
  ];

  const superGreenStudents = [
    { name: 'Alex Kim', grade: 'Grade 11, Period 2', days: '5 days' },
    { name: 'Sofia Martinez', grade: 'Grade 12, Period 5', days: '7 days' },
    { name: 'David Thompson', grade: 'Grade 10, Period 3', days: '3 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.bgColor} rounded-lg border border-gray-200 p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-2 ${stat.textColor}`}>{stat.change}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Yellow Watch List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <span>🟡</span>
                    <span>Yellow Watch List</span>
                  </h3>
                </div>
                <span className="text-sm font-semibold text-gray-600">3 or more</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Student</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Academic</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Behavioral</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Total Flags</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Streak</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Last Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {yellowFlagData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {row.academic}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {row.behavioral}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          {row.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.streak}</td>
                      <td className="px-6 py-4 text-gray-500">{row.lastFlag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">View All →</button>
              <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">Generate Report</button>
            </div>
          </div>

          {/* 7-Day Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Breakdown</h3>
            <p className="text-sm text-gray-500 mb-4">Academic vs Behavioral Flags</p>

            <div className="flex items-end space-x-3 h-48 justify-around">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const academicHeight = Math.random() * 80 + 20;
                const behavioralHeight = Math.random() * 80 + 20;
                return (
                  <div key={idx} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="flex gap-1 h-32 items-end">
                      <div
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{ height: `${academicHeight}%` }}
                      ></div>
                      <div
                        className="flex-1 bg-purple-500 rounded-t"
                        style={{ height: `${behavioralHeight}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center space-x-6 text-xs mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Academic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Behavioral</span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">Week's Total: <span className="font-bold text-gray-900">75 Flags</span></p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Red Urgent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🔴 Red Urgent</h3>
              <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-1 rounded">6</span>
            </div>

            <div className="space-y-3">
              {redUrgentData.map((item, idx) => (
                <div key={idx} className={`${item.color} rounded-lg p-4 border border-red-200`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.issue}</p>
                    </div>
                    <span className="text-xs font-bold text-red-700 bg-white px-2 py-1 rounded">
                      {item.badge}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-3 text-xs">
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded font-medium">
              Page 1 of 2 • View All →
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>

            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-0">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    {item.highlight ? (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <p className="text-sm text-gray-900">{item.text}</p>
                        <div className="flex items-center space-x-2 mt-1 text-xs">
                          <span className="text-blue-600 font-medium">13 Flags</span>
                          <span className="text-blue-600 font-medium">Smart Recommendations</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{item.text}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded font-medium">
              View All Activity →
            </button>
          </div>

          {/* Super Green Recognition */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">⭐ Super Green Recognition</h3>
              <span className="text-xs text-green-700 font-semibold">30+ days on Page</span>
            </div>

            <div className="space-y-2">
              {superGreenStudents.map((student, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.grade}</p>
                    </div>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                      {student.days}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-green-700 hover:bg-green-100 rounded font-medium">
              + Add Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
