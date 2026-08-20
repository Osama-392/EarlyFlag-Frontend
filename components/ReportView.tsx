'use client';

import { useRef, useState } from 'react';
import { Download, Printer, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getCategoryStyle } from '@/lib/categoryColors';
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

  // Helper to rule out global/cross-class auto-escalations from teacher reports
  const isGlobalAutoEscalation = (s: any): boolean => {
    if (!s) return false;
    const reasonCode = String(s.reason_code || '').toLowerCase();
    const reasonDesc = String(s.reason_description || s.reason || '').toLowerCase();
    const note = String(s.note || '').toLowerCase();
    const title = String(s.title || s.rule_name || s.rule_description || '').toLowerCase();
    const desc = String(s.description || '').toLowerCase();
    const alertRule = String(s.triggered_by_rule || s.rule || '').toLowerCase();
    
    if (alertRule.includes('global') || alertRule.includes('cross-class') || alertRule.includes('cross_class')) return true;
    if (reasonDesc.includes('(global)') || reasonDesc.includes('global') || reasonDesc.includes('cross-class') || reasonDesc.includes('across all classes')) return true;
    if (note.includes('across all classes') || note.includes('cross-class') || note.includes('auto-escalated to red') || note.includes('system auto-escalation (global)')) return true;
    if (title.includes('global') || title.includes('cross-class') || title.includes('across all classes')) return true;
    if (desc.includes('across all classes') || desc.includes('cross-class') || desc.includes('global auto-escalation') || desc.includes('system auto-escalation (global)')) return true;
    if (reasonCode === 'auto_escalation' && (note.includes('all classes') || note.includes('auto-escalat') || reasonDesc.includes('global'))) return true;
    return false;
  };

  // Filter out global auto-escalations from report flag_log
  const filteredFlagLog = (report?.flag_log || []).filter((flag: any) => !isGlobalAutoEscalation(flag));

  // Helper to categorize flags and referrals
  const isRedIncident = (f: any) => {
    const st = String(f.signal_type || '').toUpperCase();
    const cat = String(f.category || '').toUpperCase();
    const title = String(f.title || '').toUpperCase();
    const desc = String(f.description || '').toUpperCase();
    if (st === 'RED') return true;
    if (st === 'REFERRAL' || cat === 'REFERRAL') {
      return title.includes('ADMIN') || title.includes('RED') || desc.includes('ADMIN') || (!title.includes('YELLOW') && !title.includes('GREEN') && !title.includes('SUPER_GREEN') && !title.includes('POSITIVE'));
    }
    return false;
  };

  const isYellowIncident = (f: any) => {
    const st = String(f.signal_type || '').toUpperCase();
    const cat = String(f.category || '').toUpperCase();
    const title = String(f.title || '').toUpperCase();
    if (st === 'YELLOW') return true;
    if (st === 'REFERRAL' || cat === 'REFERRAL') {
      return title.includes('YELLOW');
    }
    return false;
  };

  const isSuperGreenIncident = (f: any) => {
    const st = String(f.signal_type || '').toUpperCase();
    const cat = String(f.category || '').toUpperCase();
    const title = String(f.title || '').toUpperCase();
    if (st === 'SUPER_GREEN' || st === 'GREEN' || cat === 'SUPER_GREEN') return true;
    if (st === 'REFERRAL' || cat === 'REFERRAL') {
      return title.includes('GREEN') || title.includes('POSITIVE') || title.includes('SUPER_GREEN');
    }
    return false;
  };

  // Count incidents accurately including referrals
  const redCount = filteredFlagLog.filter(isRedIncident).length;
  const yellowCount = filteredFlagLog.filter(isYellowIncident).length;
  const superGreenCount = filteredFlagLog.filter(isSuperGreenIncident).length;
  const presentCount = filteredFlagLog.filter((f: any) => String(f.signal_type || '').toUpperCase() === 'PRESENT').length;

  // Determine overall status based on count severities
  let statusText = 'Super Green';
  if (redCount > 0) {
    statusText = 'Red';
  } else if (yellowCount > 0) {
    statusText = 'Yellow';
  }

  // Calculate percentages for the summary bar
  const totalCounts = redCount + yellowCount + (superGreenCount + presentCount);
  const divisor = totalCounts || 1;
  const redPercent = Math.round((redCount / divisor) * 100);
  const yellowPercent = Math.round((yellowCount / divisor) * 100);
  const positivePercent = Math.round(((superGreenCount + presentCount) / divisor) * 100);

  // Flag log is already teacher-scoped and global auto escalations are ruled out
  const incidents = filteredFlagLog
    .map((flag: any) => {
      let rawDate = new Date(flag.signal_date + 'T00:00:00');
      let dayOfWeek = '';
      let shortDate = flag.signal_date;
      try {
        shortDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayOfWeek = rawDate.toLocaleDateString('en-US', { weekday: 'short' });
      } catch (e) {}
      
      const rawSType = flag.signal_type ? String(flag.signal_type).toUpperCase() : '';
      const catUpper = String(flag.category || '').toUpperCase();
      const titleUpper = String(flag.title || '').toUpperCase();

      let effectiveSType = rawSType;
      if (rawSType === 'REFERRAL' || catUpper === 'REFERRAL') {
        if (titleUpper.includes('YELLOW')) effectiveSType = 'YELLOW';
        else if (titleUpper.includes('GREEN') || titleUpper.includes('POSITIVE') || titleUpper.includes('SUPER_GREEN')) effectiveSType = 'SUPER_GREEN';
        else effectiveSType = 'RED';
      }

      let typeLabel = effectiveSType ? effectiveSType.charAt(0).toUpperCase() + effectiveSType.slice(1).toLowerCase() : '';
      if (effectiveSType === 'YELLOW') typeLabel = 'Yellow Incident';
      if (effectiveSType === 'RED') typeLabel = 'Red Incident';
      if (effectiveSType === 'SUPER_GREEN') typeLabel = 'Super Green';
      
      let catLabel = '';
      if (flag.category) {
        if (flag.category.toLowerCase() === 'super_green') catLabel = 'Super Green';
        else if (flag.category.toLowerCase() === 'referral') catLabel = 'Referral';
        else catLabel = flag.category.charAt(0).toUpperCase() + flag.category.slice(1).toLowerCase();
      }

      let displayType = catLabel && effectiveSType !== 'SUPER_GREEN' && catLabel !== typeLabel
        ? `${typeLabel} - ${catLabel}`
        : (effectiveSType === 'SUPER_GREEN' && catLabel === 'Referral' ? 'Super Green - Referral' : (effectiveSType === 'SUPER_GREEN' ? 'Super Green' : typeLabel));

      if (catUpper === 'REFERRAL') {
        if (effectiveSType === 'YELLOW') displayType = 'Yellow Referral';
        else if (effectiveSType === 'SUPER_GREEN') displayType = 'Positive Referral';
        else displayType = 'Admin Referral';
      }

      return {
        date: shortDate,
        dayOfWeek,
        type: displayType,
        title: flag.title ? flag.title.replace(/Yellow Flag/gi, 'Yellow Incident').replace(/Red Flag/gi, 'Red Incident') : (effectiveSType === 'RED' ? 'Red Incident Logged' : effectiveSType === 'YELLOW' ? 'Yellow Incident Logged' : 'Signal Logged'),
        description: flag.description ? flag.description.replace(/Yellow Flag/gi, 'Yellow Incident').replace(/Red Flag/gi, 'Red Incident') : '',
        className: flag.class_name,
        teacherName: flag.teacher_name,
        signalType: effectiveSType,
      };
    }) || [];

 const recommendations = report?.talking_points || [];
 const teachersNotes = report?.one_ask_for_parents || (report ? 'No notes provided.' : '');

 return (
 <div className="min-h-screen bg-gray-50 dark:bg-[#1b1e2c]" >
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
 <div className="bg-white dark:bg-[#151722] border-b border-gray-200 dark:border-[#262a3d] no-print">
 <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
 <div className="flex-1">
 <button
 onClick={() => {
 logger.buttonClick('Back from Report', 'ReportView');
 onBack();
 }}
 className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#1b1e2c] transition-colors shadow-sm mb-2"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Back to Reports</span>
 </button>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
 Grade {student.gradeLevel} • {reportData.subject}
 </p>
 </div>

 {/* Date Range */}
 <div className="text-right text-sm text-gray-600 dark:text-gray-400">
 <p>{formatDisplayDate(startDateStr)}</p>
 <p className="font-medium">to {formatDisplayDate(endDateStr)}</p>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div ref={reportContentRef} className="report-print-area max-w-6xl mx-auto px-8 py-8 space-y-6">
 
 {/* Profile Header Card */}
 <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-8 flex items-center justify-between">
 <div className="flex items-center space-x-6">
 {/* Avatar */}
 <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1b1e2c] flex items-center justify-center border-4 border-white dark:border-[#262a3d] shadow-md text-3xl font-bold text-slate-400 dark:text-slate-300 overflow-hidden">
 {student.initial || '??'}
 </div>
 
 <div>
 <div className="flex items-center mb-1">
 {statusText === 'Red' && <span className="px-2.5 py-0.5 bg-red-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Red</span>}
 {statusText === 'Yellow' && <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Yellow</span>}
 {statusText === 'Super Green' && <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">Super Green</span>}
 </div>
 <h1 className="text-3xl font-bold text-slate-800 dark:text-white ">
 {student.name}
 </h1>
 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
 Grade {student.gradeLevel} • {reportData.subject}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
  <div className={`px-4 py-2 text-xs font-bold rounded-lg border shadow-sm ${
  statusText === 'Red' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50' :
  statusText === 'Yellow' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50' :
  'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
  }`}>
  Status : {statusText} Active
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
  <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Incidents Summary</h2>
  </div>
  </div>

  <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 space-y-4">
  {/* Positive Incidents / Super Green */}
  <div className="bg-slate-50 dark:bg-[#1b1e2c] rounded-xl p-5 relative border border-slate-100 dark:border-[#262a3d]">
  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center text-slate-400 mb-3 shadow-sm">
  <span className="font-bold text-sm text-emerald-500">P</span>
  </div>
  <div className="text-4xl font-bold text-emerald-500 mb-1">
  {superGreenCount}
  </div>
  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Positive Incidents</h3>
  <p className="text-xs text-gray-400 mt-1">Super Green signals</p>
  </div>

  {/* Yellow Incidents */}
  <div className="bg-amber-50 dark:bg-[#1b1e2c] rounded-xl p-5 relative border border-amber-100 dark:border-[#262a3d]">
 <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-3 shadow-sm">
 <AlertCircle className="w-4 h-4 text-amber-500" />
 </div>
 <div className="text-4xl font-bold text-amber-500 mb-1">{yellowCount}</div>
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Yellow Incidents</h3>
 <p className="text-xs text-amber-500/80 mt-1">Light concerns tracked</p>
 </div>

 {/* Red Incidents */}
 <div className="bg-red-50 dark:bg-[#1b1e2c] rounded-xl p-5 relative border border-red-100 dark:border-[#262a3d]">
 <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#151722] border border-gray-200 dark:border-[#262a3d] flex items-center justify-center mb-3 shadow-sm">
 <AlertCircle className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-4xl font-bold text-red-500 mb-1">{redCount}</div>
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Red Incidents</h3>
 <p className="text-xs text-red-400/80 mt-1">Urgent interventions</p>
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
 <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Student History</h2>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Timeline</p>
 </div>
 </div>

 <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm p-6 h-[560px] overflow-y-auto">
 {incidents.length > 0 ? (
 <div className="space-y-5">
 {incidents.map((incident: any, idx: number) => {
 const categoryStyle = getCategoryStyle(incident.type);
 return (
 <div key={idx} className="flex items-start gap-4 group p-3 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] rounded-xl transition-colors">
 <div className="flex flex-col text-left shrink-0 w-14 pt-0.5">
 <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{incident.date}</span>
 <span className="text-xs font-semibold text-gray-400">{incident.dayOfWeek}</span>
 </div>
 
 <div className="flex-1 flex flex-col gap-1 pr-4">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
 {incident.title}
 </h3>
 </div>
 {incident.description && incident.description.toLowerCase() !== (incident.title || '').toLowerCase() && (
 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">
 {incident.description}
 </p>
 )}
 <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1">
 {incident.className} • {incident.teacherName}
 </div>
 </div>

 <div className="shrink-0 pt-0.5">
 <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
 incident.signalType === 'RED' || incident.signalType === 'REFERRAL'
 ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
 : incident.signalType === 'YELLOW'
 ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
 : incident.signalType === 'ABSENT'
 ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
 : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
 }`}>
 <div className={`w-1.5 h-1.5 rounded-full ${incident.signalType === 'RED' || incident.signalType === 'REFERRAL' ? 'bg-red-500' : incident.signalType === 'YELLOW' ? 'bg-amber-500' : incident.signalType === 'ABSENT' ? 'bg-slate-500' : 'bg-emerald-500'}`} />
 {incident.type}
 </div>
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
 <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm overflow-hidden">
 <div className="p-6 border-b border-gray-100 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50">
 <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recommended Next Steps</h2>
 </div>
 <div className="p-6">
 <ul className="space-y-3">
 {recommendations.map((rec: string, idx: number) => (
 <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
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
 <div className="bg-white dark:bg-[#151722] rounded-2xl border border-gray-100 dark:border-[#262a3d] shadow-sm overflow-hidden">
 <div className="p-6 border-b border-gray-100 dark:border-[#262a3d] bg-gray-50 dark:bg-[#1b1e2c]/50">
 <h2 className="text-lg font-bold text-slate-800 dark:text-white">Teachers Notes</h2>
 </div>
 <div className="p-6">
            {report?.recent_notes && report.recent_notes.length > 0 ? (
              <div className="space-y-4">
                {report.recent_notes.map((note: any, idx: number) => (
                  <div key={idx}>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {note.class_name} • {new Date(note.signal_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {note.note || note.excerpt || note.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {teachersNotes}
              </p>
            )}
 </div>
 </div>
 )}
 </div>

 {/* Footer Actions */}
 <div className="bg-white dark:bg-[#151722] border-t border-gray-200 dark:border-[#262a3d] no-print mt-8">
 <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
 <button 
 onClick={handlePrint}
 className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1b1e2c] dark:bg-[#1b1e2c] rounded-lg transition-colors font-medium text-sm"
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
