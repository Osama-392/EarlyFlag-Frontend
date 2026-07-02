'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Download, Printer, Loader2, AlertCircle, Users, BookOpen } from 'lucide-react';
import { getAdminTeacherSpecificReport, AdminTeacherSpecificReportBlock } from '@/lib/adminDashboardService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AdminTeacherReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}

export default function AdminTeacherReportModal({ isOpen, onClose, teacherId, teacherName }: AdminTeacherReportModalProps) {
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<AdminTeacherSpecificReportBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = { range };
        if (from && to) {
          params.from = from;
          params.to = to;
          delete params.range;
        }
        const result = await getAdminTeacherSpecificReport(teacherId, params);
        setData(result);
      } catch (err: any) {
        console.error('Failed to load teacher specific report:', err);
        setError(err?.response?.data?.detail || 'Failed to load report. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, teacherId, range, from, to]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
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

      const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Teacher_Report_${safeName}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-[#0b0d14] overflow-hidden">
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white dark:bg-[#151722] border-b border-gray-200 dark:border-[#262a3d] shrink-0 px-6 py-4 flex items-center justify-between no-print z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1b1e2c] rounded-full transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{teacherName} - Report</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Teacher Performance & Student Signals</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1b1e2c] p-1 rounded-lg border border-gray-200 dark:border-[#262a3d]">
            {(['1d', '7d', '30d'] as const).map(r => (
              <button
                key={r}
                onClick={() => { setRange(r); setFrom(''); setTo(''); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === r && !from && !to ? 'bg-white dark:bg-[#262a3d] text-blue-700 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262a3d]'
                }`}
              >
                {r === '1d' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <div className="flex items-center gap-1 px-1">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-2 py-1 text-xs border border-gray-200 dark:border-[#262a3d] bg-transparent dark:bg-[#151722] dark:text-gray-300 rounded focus:outline-none" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-2 py-1 text-xs border border-gray-200 dark:border-[#262a3d] bg-transparent dark:bg-[#151722] dark:text-gray-300 rounded focus:outline-none" />
            </div>
          </div>
          
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b1e2c] rounded-lg transition-colors font-medium text-sm">
            <Printer size={16} /> Print
          </button>
          <button 
            onClick={handleExportPDF} 
            disabled={exporting || loading || !!error}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 report-print-area">
        <div ref={contentRef} className="max-w-5xl mx-auto space-y-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p>Loading teacher report...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-80" />
              <p className="font-medium">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Report Title / Meta info */}
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{data.first_name} {data.last_name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                    <Calendar size={14} /> 
                    {formatDisplayDate(data.range_start)} to {formatDisplayDate(data.range_end)} ({data.range_days} days)
                  </p>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-[#1b1e2c] px-4 py-2 rounded-lg border border-gray-100 dark:border-[#262a3d]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Classes</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{data.classes.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1b1e2c] px-4 py-2 rounded-lg border border-gray-100 dark:border-[#262a3d]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Flags</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {data.classes.reduce((sum, c) => sum + c.total_flags, 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Classes Table */}
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50 flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-500" />
                  <h3 className="font-bold text-gray-800 dark:text-white">Class Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 dark:bg-[#1b1e2c]/30 text-gray-500 dark:text-gray-400 uppercase text-xs border-b border-gray-200 dark:border-[#262a3d]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Class Name</th>
                        <th className="px-4 py-3 font-semibold text-center">Super Green</th>
                        <th className="px-4 py-3 font-semibold text-center">Present</th>
                        <th className="px-4 py-3 font-semibold text-center">Yellow</th>
                        <th className="px-4 py-3 font-semibold text-center">Red</th>
                        <th className="px-4 py-3 font-semibold text-center">Absent</th>
                        <th className="px-4 py-3 font-semibold text-center">Total Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                      {data.classes.map((cls) => (
                        <tr key={cls.class_id} className="hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{cls.class_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Grade {cls.grade_level}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 font-medium">
                              {cls.super_green_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 font-medium">
                              {cls.present_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 font-medium">
                              {cls.yellow_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 font-medium">
                              {cls.red_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 font-medium">
                              {cls.absent_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                            {cls.total_flags}
                          </td>
                        </tr>
                      ))}
                      {data.classes.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No classes found for this teacher.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Students Table */}
              <div className="bg-white dark:bg-[#151722] rounded-xl border border-gray-200 dark:border-[#262a3d] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-red-500" />
                    <h3 className="font-bold text-gray-800 dark:text-white">Top 5 Most Flagged Students</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#262a3d] px-2 py-1 rounded border border-gray-200 dark:border-[#1b1e2c]">
                    Weighted: Red × 3 + Yellow × 1
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 dark:bg-[#1b1e2c]/30 text-gray-500 dark:text-gray-400 uppercase text-xs border-b border-gray-200 dark:border-[#262a3d]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        <th className="px-4 py-3 font-semibold text-center">Super Green</th>
                        <th className="px-4 py-3 font-semibold text-center">Present</th>
                        <th className="px-4 py-3 font-semibold text-center">Yellow</th>
                        <th className="px-4 py-3 font-semibold text-center">Red</th>
                        <th className="px-4 py-3 font-semibold text-center">Absent</th>
                        <th className="px-4 py-3 font-semibold text-center">Weighted Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                      {data.top_students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Grade {student.grade_level}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">{student.super_green_count}</td>
                          <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-medium">{student.present_count}</td>
                          <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-medium">{student.yellow_count}</td>
                          <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-medium">{student.red_count}</td>
                          <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-medium">{student.absent_count}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block min-w-[2rem] px-2 py-1 rounded-md text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 font-bold">
                              {student.weighted_score}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.top_students.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No flags recorded for students in this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
