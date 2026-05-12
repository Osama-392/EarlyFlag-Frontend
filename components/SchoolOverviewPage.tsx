'use client';

import { useState } from 'react';
import { ArrowLeft, Sparkles, Eye, DownloadCloud } from 'lucide-react';
import Link from 'next/link';

// Mock data for the chart
const chartData = [
  { week: 'Week 1', academic: 45, behavioral: 32, total: 77 },
  { week: 'Week 2', academic: 52, behavioral: 38, total: 90 },
  { week: 'Week 3', academic: 60, behavioral: 42, total: 102 },
  { week: 'Week 4', academic: 55, behavioral: 35, total: 90 },
  { week: 'Week 5', academic: 68, behavioral: 48, total: 116 },
  { week: 'Week 6', academic: 58, behavioral: 40, total: 98 },
  { week: 'Week 7', academic: 72, behavioral: 52, total: 124 },
  { week: 'Week 8', academic: 65, behavioral: 45, total: 110 },
];

// Mock data for weekly breakdown
const weeklyBreakdown = [
  {
    week: 'Feb week 1',
    academic: 2,
    behavioral: 3,
    total: 7,
    mostFlagged: 'Mr. Hannah - Math',
    nonEngagementDays: 1,
  },
  {
    week: 'Feb week 2',
    academic: 2,
    behavioral: 2,
    total: 8,
    mostFlagged: 'Ms. Jean - English',
    nonEngagementDays: 0,
  },
  {
    week: 'Feb week 3',
    academic: 1,
    behavioral: 3,
    total: 4,
    mostFlagged: 'Ms. Davis - Spanish',
    nonEngagementDays: 1,
  },
  {
    week: 'Mar week 1',
    academic: 3,
    behavioral: 2,
    total: 9,
    mostFlagged: 'Mr. Brown - Calculus',
    nonEngagementDays: 1,
  },
];

export default function SchoolOverviewPage() {
  const [startDate, setStartDate] = useState('2025-03-21');
  const [endDate, setEndDate] = useState('2025-04-21');

  const maxValue = Math.max(...chartData.map((d) => d.total));
  const totalFlags = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Link href="/principal-dashboard" className="text-blue-600 hover:text-blue-700 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
          School Weekly Flag Accumulation Overview
        </h1>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select a timeframe to overview:</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Last 2 months Breakdown</h2>

        {/* Bar Chart */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-flex-end gap-2 h-48 justify-between">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                {/* Bars */}
                <div className="relative w-full h-32 flex items-flex-end gap-0.5 justify-center">
                  {/* Academic bars */}
                  <div
                    className="bg-red-500 rounded-t transition-all group-hover:opacity-80"
                    style={{ height: `${(data.academic / maxValue) * 100}%`, width: '30%' }}
                    title={`Academic: ${data.academic}`}
                  ></div>
                  {/* Behavioral bars */}
                  <div
                    className="bg-yellow-400 rounded-t transition-all group-hover:opacity-80"
                    style={{ height: `${(data.behavioral / maxValue) * 100}%`, width: '30%' }}
                    title={`Behavioral: ${data.behavioral}`}
                  ></div>
                  {/* Other bars */}
                  <div
                    className="bg-green-500 rounded-t transition-all group-hover:opacity-80"
                    style={{ height: `${((data.total - data.academic - data.behavioral) / maxValue) * 100}%`, width: '30%' }}
                    title={`Other: ${data.total - data.academic - data.behavioral}`}
                  ></div>
                </div>
                {/* Label */}
                <span className="text-xs font-medium text-gray-600 text-center">{data.week}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-6 justify-center mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Academic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Behavioral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Other</span>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Total flags in last 2 months:
            <span className="font-semibold text-gray-900 ml-2">{totalFlags} flags</span>
          </p>
        </div>
      </div>

      {/* Weekly Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Weekly breakdown table</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Week</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Academic Flags</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Behavioral Flags</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Total Flags</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Most Flagged Classes</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Non-Eng Days/Hours</th>
              </tr>
            </thead>
            <tbody>
              {weeklyBreakdown.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.week}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                      🟡 {row.academic}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      🔴 {row.behavioral}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.total}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.mostFlagged}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.nonEngagementDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles size={24} className="text-blue-600 flex-shrink-0 mt-1" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Behavioral flags increased significantly in the last week.</span> With your current flag trend rising to 124 flags in week 7, it's crucial to look at what triggered this. Consider scheduling ongoing behavioral assessments and check if your students are dealing with internal or external stressors.
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Critical emerging academic gaps.</span> Of the flagged students, academic flags are consistently distributed in your school. This suggests behavioral support is necessary systematically and also look for academics and psychological diagnoses that necessitate specialized interventions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
            Dismiss suggestion
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition text-sm font-medium">
            Support More
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium ml-auto">
            <Eye size={18} />
            View All Classes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition text-sm font-medium">
            <DownloadCloud size={18} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
