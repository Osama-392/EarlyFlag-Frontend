'use client';

import { Download, Printer, ArrowLeft } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ReportViewProps {
  student: {
    id: string;
    name: string;
    gradeLevel: number;
    initial: string;
    bgColor: string;
  };
  reportData: {
    startDate: string;
    endDate: string;
    subject: string;
    includeTeachersNotes: boolean;
    includeAIRecommendations: boolean;
  };
  onBack: () => void;
}

export default function ReportView({
  student,
  reportData,
  onBack,
}: ReportViewProps) {
  // Mock data for the report
  const engagementMetrics = [
    {
      label: 'Blue Incidents',
      value: '1',
      color: 'bg-blue-50 text-blue-700',
      bgGradient: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Yellow Flags / week',
      value: '9',
      color: 'bg-purple-50 text-purple-700',
      bgGradient: 'from-purple-400 to-purple-600',
    },
    {
      label: 'Red Incidents',
      value: '2',
      color: 'bg-red-50 text-red-700',
      bgGradient: 'from-red-400 to-red-600',
    },
  ];

  const chartData = [
    { month: 'Jan', academic: 3, behavioral: 4 },
    { month: 'Feb', academic: 5, behavioral: 2 },
    { month: 'Mar', academic: 2, behavioral: 6 },
    { month: 'Apr', academic: 4, behavioral: 3 },
    { month: 'May', academic: 3, behavioral: 5 },
    { month: 'Jun', academic: 2, behavioral: 4 },
    { month: 'Jul', academic: 5, behavioral: 3 },
    { month: 'Aug', academic: 4, behavioral: 2 },
  ];

  const incidents = [
    {
      type: 'Academic Flag',
      date: 'Sep 10, 2025',
      description: 'Missing assignment in Math class',
    },
    {
      type: 'Behavioral Flag',
      date: 'Sep 12, 2025',
      description: 'Off-task during lesson',
    },
    {
      type: 'Academic Flag',
      date: 'Sep 15, 2025',
      description: 'Low test performance',
    },
  ];

  const recommendations = [
    'Increase study time - additional sessions',
    'Behavioral support - positive reinforcement needed',
    'Parental communication - update on progress',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => {
                logger.buttonClick('Back from Report', 'ReportView');
                onBack();
              }}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Grade {student.gradeLevel} • {reportData.subject}
            </p>
          </div>

          {/* Date Range */}
          <div className="text-right text-sm text-gray-600">
            <p>{reportData.startDate.split('-')[2]} {reportData.startDate.split('-')[1]}</p>
            <p className="font-medium">
              {reportData.endDate.split('-')[2]} {reportData.endDate.split('-')[1]}, {reportData.endDate.split('-')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        {/* Engagement Summary */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engagementMetrics.map((metric, idx) => (
              <div key={idx} className={`${metric.color} rounded-lg p-6 border border-gray-200`}>
                <p className="text-sm font-medium text-gray-600 mb-2">{metric.label}</p>
                <p className="text-5xl font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Chart */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Flag Incidents</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-end justify-around h-56 gap-2">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex gap-1 items-end justify-center h-40">
                    {/* Academic bar */}
                    <div
                      className="flex-1 bg-orange-400 rounded-t"
                      style={{ height: `${(data.academic / 6) * 100}%` }}
                    />
                    {/* Behavioral bar */}
                    <div
                      className="flex-1 bg-red-400 rounded-t"
                      style={{ height: `${(data.behavioral / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{data.month}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded" />
                <span className="text-sm text-gray-600">Academic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded" />
                <span className="text-sm text-gray-600">Behavioral</span>
              </div>
            </div>
          </div>
        </section>

        {/* Incidents Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Flag Details</h2>
          <div className="space-y-4">
            {incidents.map((incident, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 ${
                      incident.type.includes('Academic')
                        ? 'bg-orange-400'
                        : 'bg-red-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{incident.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {incident.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        {reportData.includeAIRecommendations && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Next Steps
            </h2>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <ul className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700">
                    <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Teachers Notes */}
        {reportData.includeTeachersNotes && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Teachers Notes</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                Mia has shown improvement in recent weeks. She needs consistent support in managing time and staying focused on tasks. Regular communication with parents is recommended to reinforce positive behaviors at home.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <button 
            onClick={() => logger.buttonClick('Print Report', 'ReportView')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
          >
            <Print className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button 
            onClick={() => logger.buttonClick('Export as PDF', 'ReportView')}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
