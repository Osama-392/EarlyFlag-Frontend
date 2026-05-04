'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import { weeklyBreakdown } from '@/lib/mockData';

export default function SevenDayBreakdown() {
  const maxCount = Math.max(...weeklyBreakdown.map(d => d.count));
  const totalFlags = weeklyBreakdown.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">7-Day Breakdown</h2>
              <p className="text-xs text-gray-500">Academic vs Behavioral Flags</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="flex items-end justify-between h-64 space-x-4">
          {weeklyBreakdown.map((day, index) => {
            const heightPercentage = day.count > 0 ? (day.count / maxCount) * 100 : 5;
            const barColor = day.color === 'yellow' ? 'bg-yellow-400' : 'bg-orange-400';

            return (
              <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                <div className="w-full flex flex-col justify-end flex-1">
                  <div
                    className={`w-full ${barColor} rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group`}
                    style={{ height: `${heightPercentage}%` }}
                  >
                    {day.count > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium text-gray-900 bg-white px-2 py-1 rounded shadow-lg">
                          {day.count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{day.day}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-xs text-gray-600">Academic</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span className="text-xs text-gray-600">Behavioral</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">Week Total: </span>
          <span className="text-sm font-bold text-gray-900">{totalFlags} Flags</span>
        </div>
        <button className="flex items-center space-x-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
          <ExternalLink className="w-4 h-4" />
          <span>Elevate Report</span>
        </button>
      </div>
    </div>
  );
}