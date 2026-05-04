
'use client';

import { Flag, Lightbulb, Info, Clock, ChevronRight } from 'lucide-react';
import { recentActivities } from '@/lib/mockData';

export default function RecentActivity() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'flag':
        return Flag;
      case 'lightbulb':
        return Lightbulb;
      case 'info':
        return Info;
      default:
        return Clock;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'flag':
        return 'bg-yellow-100 text-yellow-600';
      case 'recommendation':
        return 'bg-blue-100 text-blue-600';
      case 'update':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200">
        {recentActivities.map((activity) => {
          const Icon = getIcon(activity.icon);
          const iconColor = getIconColor(activity.type);

          return (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 ${iconColor} rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.studentName && (
                      <span className="font-medium">{activity.studentName} </span>
                    )}
                    <span className="text-gray-600">{activity.description}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <button className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center space-x-1">
          <span>View All Activity</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
