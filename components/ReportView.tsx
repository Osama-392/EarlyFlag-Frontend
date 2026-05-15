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
    startDate?: string;
    endDate?: string;
    start_date?: string;
    end_date?: string;
    subject: string;
    includeTeachersNotes?: boolean;
    includeAIRecommendations?: boolean;
    include_teachers_notes?: boolean;
    include_ai_recommendations?: boolean;
    result?: any;
  };
  onBack: () => void;
}

export default function ReportView({
  student,
  reportData,
  onBack,
}: ReportViewProps) {
  const report = reportData?.result?.report;

  const engagementMetrics = report ? [
    {
      label: 'Positive Incidents',
      value: String((report.summary_counts?.window_30d?.super_green || 0) + (report.summary_counts?.window_30d?.present || 0)),
      color: 'bg-blue-50 text-blue-700',
      bgGradient: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Yellow Flags',
      value: String(report.summary_counts?.window_30d?.yellow || 0),
      color: 'bg-purple-50 text-purple-700',
      bgGradient: 'from-purple-400 to-purple-600',
    },
    {
      label: 'Red Incidents',
      value: String(report.summary_counts?.window_30d?.red || 0),
      color: 'bg-red-50 text-red-700',
      bgGradient: 'from-red-400 to-red-600',
    },
  ] : [
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

  const chartData = report ? report.timeline_30d?.map((day: any) => {
    const dateObj = new Date(day.day);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { month, yellow: day.counts?.yellow || 0, red: day.counts?.red || 0 };
  }) || [] : [
    { month: 'Jan', yellow: 3, red: 4 },
    { month: 'Feb', yellow: 5, red: 2 },
    { month: 'Mar', yellow: 2, red: 6 },
    { month: 'Apr', yellow: 4, red: 3 },
    { month: 'May', yellow: 3, red: 5 },
    { month: 'Jun', yellow: 2, red: 4 },
    { month: 'Jul', yellow: 5, red: 3 },
    { month: 'Aug', yellow: 4, red: 2 },
  ];

  const maxChartValue = Math.max(6, ...chartData.flatMap((d: any) => [d.yellow || 0, d.red || 0]));

  const incidents = report ? report.recent_notes?.map((note: any) => ({
    type: note.class_name ? `Flag in ${note.class_name}` : 'Flag Note',
    date: note.signal_date,
    description: note.excerpt,
  })) || [] : [
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

  const recommendations = report ? report.talking_points || [] : [
    'Increase study time - additional sessions',
    'Behavioral support - positive reinforcement needed',
    'Parental communication - update on progress',
  ];

  const teachersNotes = report ? report.one_ask_for_parents || 'No notes provided.' : 'Mia has shown improvement in recent weeks. She needs consistent support in managing time and staying focused on tasks. Regular communication with parents is recommended to reinforce positive behaviors at home.';

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
            <p>
              {(reportData.startDate || reportData.start_date || '').split('-')[2]}{' '}
              {(reportData.startDate || reportData.start_date || '').split('-')[1]}
            </p>
            <p className="font-medium">
              {(reportData.endDate || reportData.end_date || '').split('-')[2]}{' '}
              {(reportData.endDate || reportData.end_date || '').split('-')[1]},{' '}
              {(reportData.endDate || reportData.end_date || '').split('-')[0]}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Flag Incidents</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-8 overflow-x-auto">
            <div className="flex items-end justify-around h-56 gap-2 min-w-[500px]">
              {chartData.map((data: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex gap-1 items-end justify-center h-40">
                    {/* Yellow bar */}
                    <div
                      className="flex-1 bg-amber-400 rounded-t"
                      style={{ height: `${(data.yellow / maxChartValue) * 100}%` }}
                    />
                    {/* Red bar */}
                    <div
                      className="flex-1 bg-red-400 rounded-t"
                      style={{ height: `${(data.red / maxChartValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{data.month}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 min-w-[500px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded" />
                <span className="text-sm text-gray-600">Yellow Flags</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded" />
                <span className="text-sm text-gray-600">Red Flags</span>
              </div>
            </div>
          </div>
        </section>

        {/* Incidents Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Flag Details</h2>
          <div className="space-y-4">
            {incidents.map((incident: any, idx: number) => (
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
        {(reportData.includeAIRecommendations || reportData.include_ai_recommendations) && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Next Steps
            </h2>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <ul className="space-y-3">
                {recommendations.map((rec: string, idx: number) => (
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
        {(reportData.includeTeachersNotes || reportData.include_teachers_notes) && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Teachers Notes</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                {teachersNotes}
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
            <Printer className="w-4 h-4" />
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
