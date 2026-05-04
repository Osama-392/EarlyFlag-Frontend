
'use client';

import { TrendingDown, TrendingUp, Users, AlertTriangle, AlertCircle } from 'lucide-react';
import { statsData } from '@/lib/mockData';

export default function StatsCards() {
  const cards = [
    {
      ...statsData.studentsFlagged,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      ...statsData.yellowFlags,
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      ...statsData.redFlags,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trend < 0 ? TrendingDown : TrendingUp;
        const isPositiveTrend = card.trend < 0;

        return (
          <div
            key={index}
            className={`bg-white rounded-xl border ${card.borderColor} p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                isPositiveTrend ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(card.trend)}%</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-gray-900">{card.current}</h3>
              <p className="text-sm font-medium text-gray-900">{card.label}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
