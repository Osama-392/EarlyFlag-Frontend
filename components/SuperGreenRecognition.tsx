
'use client';

import { Award, Star } from 'lucide-react';
import { recognitions } from '@/lib/mockData';

export default function SuperGreenRecognition() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-green-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Super Green Recognition</h2>
              <p className="text-xs text-gray-500">80+ Active on Flag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recognitions.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {teacher.teacherName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{teacher.teacherName}</h3>
                  <p className="text-xs text-gray-600 mt-1">{teacher.title}</p>
                </div>

                {/* Badge */}
                <div className="w-full pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Period {teacher.period}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
