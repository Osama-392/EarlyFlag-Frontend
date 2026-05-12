'use client';

import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function PrincipalReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState('all');

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
          Reports
        </h1>
        <p className="text-gray-600">School-wide reports and analytics</p>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="all">All School</option>
              <option value="grade">By Grade</option>
              <option value="teacher">By Teacher</option>
              <option value="class">By Class</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
        <button className="mt-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 hover:bg-gray-50 transition cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {i === 1 ? 'Monthly School Summary' : i === 2 ? 'Grade 12 Performance' : i === 3 ? 'Critical Cases Report' : 'Teacher Effectiveness Analysis'}
                  </p>
                  <p className="text-sm text-gray-600">Generated {i * 2} days ago</p>
                </div>
              </div>
              <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
