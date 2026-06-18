'use client';

import { useRef, useState } from 'react';
import { Download, Printer, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const report = reportData?.result?.report;

  // Helper to format YYYY-MM-DD into a readable date
  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const startDateStr = reportData.startDate || reportData.start_date || '';
  const endDateStr = reportData.endDate || reportData.end_date || '';

  const handlePrint = () => {
    logger.buttonClick('Print Report', 'ReportView');
    window.print();
  };

  const handleExportPDF = async () => {
    if (!reportContentRef.current) return;
    logger.buttonClick('Export as PDF', 'ReportView');
    setExporting(true);
    try {
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      let yOffset = 0;
      let page = 0;

      while (yOffset < imgHeight) {
        if (page > 0) pdf.addPage();
        // Calculate the source region of the image for this page
        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceH = (usableHeight / imgHeight) * canvas.height;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(sourceH, canvas.height - sourceY);
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, pageCanvas.height,
            0, 0, canvas.width, pageCanvas.height,
          );
          const pageImg = pageCanvas.toDataURL('image/png');
          const drawHeight = (pageCanvas.height * imgWidth) / canvas.width;
          pdf.addImage(pageImg, 'PNG', margin, margin, imgWidth, drawHeight);
        }
        yOffset += usableHeight;
        page++;
      }

      const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeName}_Report.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Use custom window counts if available, otherwise fall back to 30d window
  const summaryCounts = report?.summary_counts?.window_custom || report?.summary_counts?.window_30d;

  // Determine overall status based on count severities
  let statusText = 'Super Green';
  if ((summaryCounts?.red || 0) > 0) {
    statusText = 'Red';
  } else if ((summaryCounts?.yellow || 0) > 0) {
    statusText = 'Yellow';
  }

  // Calculate percentages for the summary bar
  const totalCounts = (summaryCounts?.red || 0) + (summaryCounts?.yellow || 0) + ((summaryCounts?.super_green || 0) + (summaryCounts?.present || 0));
  const divisor = totalCounts || 1;
  const redPercent = Math.round(((summaryCounts?.red || 0) / divisor) * 100);
  const yellowPercent = Math.round(((summaryCounts?.yellow || 0) / divisor) * 100);
  const positivePercent = Math.round((((summaryCounts?.super_green || 0) + (summaryCounts?.present || 0)) / divisor) * 100);

  const incidents = report?.recent_notes?.map((note: any) => ({
    type: note.class_name ? `Flag in ${note.class_name}` : 'Flag Note',
    date: formatDisplayDate(note.signal_date) || note.signal_date,
    description: note.excerpt,
  })) || [];

  const recommendations = report?.talking_points || [];
  const teachersNotes = report?.one_ask_for_parents || (report ? 'No notes provided.' : '');

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => {
                logger.buttonClick('Back from Report', 'ReportView');
                onBack();
              }}
              className="inline-flex items-center text-sm text-blue-500 bg-white border border-blue-100 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-sm font-medium mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back to Reports</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Grade {student.gradeLevel} • {reportData.subject}
            </p>
          </div>

          {/* Date Range */}
          <div className="text-right text-sm text-gray-600">
            <p>{formatDisplayDate(startDateStr)}</p>
            <p className="font-medium">to {formatDisplayDate(endDateStr)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={reportContentRef} className="report-print-area max-w-6xl mx-auto px-8 py-8 space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md text-3xl font-bold text-slate-400 overflow-hidden">
              {student.initial || '??'}
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                {statusText === 'Red' && <span className="px-2.5 py-0.5 bg-red-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Red</span>}
                {statusText === 'Yellow' && <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Yellow</span>}
                {statusText === 'Super Green' && <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Super Green</span>}
              </div>
              <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                {student.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Grade {student.gradeLevel} • {reportData.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 text-xs font-bold rounded-lg border shadow-sm ${
              statusText === 'Red' ? 'bg-red-50 text-red-600 border-red-100' :
              statusText === 'Yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              Status : {statusText} Active
            </div>
            <div className="px-4 py-2 bg-gray-100 text-slate-700 text-xs font-bold rounded-lg border border-gray-200 shadow-sm">
              Total Signals : {incidents.length}
            </div>
            <div className="px-4 py-2 bg-amber-100/50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200/50 shadow-sm">
              Period : {formatDisplayDate(startDateStr)} - {formatDisplayDate(endDateStr)}
            </div>
          </div>
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Flags Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-800">Flags Summary</h2>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Report Period</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              {/* Positive Incidents / Super Green */}
              <div className="bg-slate-50 rounded-xl p-5 relative border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                  <span className="font-bold text-sm text-emerald-500">P</span>
                </div>
                <div className="text-4xl font-bold text-emerald-500 mb-1">
                  {(summaryCounts?.super_green || 0) + (summaryCounts?.present || 0)}
                </div>
                <h3 className="text-sm font-bold text-slate-700">Positive Incidents</h3>
                <p className="text-xs text-gray-400 mt-1">Super Green / Present signals</p>
              </div>

              {/* Yellow Flags */}
              <div className="bg-amber-50 rounded-xl p-5 relative border border-amber-100">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-4xl font-bold text-amber-500 mb-1">{summaryCounts?.yellow || 0}</div>
                <h3 className="text-sm font-bold text-slate-700">Yellow Flags</h3>
                <p className="text-xs text-amber-500/80 mt-1">Light concerns tracked</p>
              </div>

              {/* Red Flags */}
              <div className="bg-red-50 rounded-xl p-5 relative border border-red-100">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-4xl font-bold text-red-500 mb-1">{summaryCounts?.red || 0}</div>
                <h3 className="text-sm font-bold text-slate-700">Red Incidents</h3>
                <p className="text-xs text-red-400/80 mt-1">Urgent interventions</p>
              </div>

              {/* Bar Chart Summary */}
              <div className="pt-4">
                <div className="flex justify-between text-xs text-gray-500 font-semibold mb-2">
                  <span>Positive</span>
                  <span>Yellow</span>
                  <span>Red</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                  <div style={{ width: `${positivePercent}%` }} className="bg-emerald-400 relative" />
                  <div style={{ width: `${yellowPercent}%` }} className="bg-amber-400 relative" />
                  <div style={{ width: `${redPercent}%` }} className="bg-red-400 relative" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Flag Details / History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-800">Flag History</h2>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Timeline</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-[560px] overflow-y-auto">
              {incidents.length > 0 ? (
                <div className="space-y-5">
                  {incidents.map((incident: any, idx: number) => {
                    const isRed = incident.type.toLowerCase().includes('red');
                    const isYellow = incident.type.toLowerCase().includes('yellow') || incident.type.toLowerCase().includes('academic') || incident.type.toLowerCase().includes('behavioral');
                    return (
                      <div key={idx} className="flex items-center space-x-4 group">
                        <span className="text-xs font-semibold text-gray-500 w-20 shrink-0">{incident.date}</span>
                        <div className={`w-3 h-1 rounded-full ${isRed ? 'bg-red-500' : isYellow ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                        <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${isRed ? 'bg-red-50 text-red-600 border border-red-100' : isYellow ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {incident.type}
                        </div>
                        <div className="flex-1 px-4 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-slate-600 border border-gray-100 truncate">
                          {incident.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No signals logged in this period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {(reportData.includeAIRecommendations || reportData.include_ai_recommendations) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-slate-800">Recommended Next Steps</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700">
                    <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Teachers Notes */}
        {(reportData.includeTeachersNotes || reportData.include_teachers_notes) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-slate-800">Teachers Notes</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {teachersNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold text-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{exporting ? 'Exporting...' : 'Export as PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
