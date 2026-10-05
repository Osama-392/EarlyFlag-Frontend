import jsPDF from 'jspdf';
import { groupReportHistory, HistoryRow } from './reportPresentation';

export interface AdminReportPdfData {
  name: string; initials: string; grade: string; studentId?: string;
  iep: boolean; ell: boolean; period: string; dateRange: string; subject: string;
  kind?: 'class' | 'overview'; teacherName?: string; includeNotes?: boolean;
  counts: { superGreen: number; present: number; absent: number; yellow: number; red: number };
  canonicalRed?: { total: number; academic: number; behavioral: number; crossClass: number; range: string };
  crossClassAlerts?: Array<{ date: string; description: string; contributions: string }>;
  classSnapshot?: { range: string; rows: Array<{
    className: string; teacherName: string; superGreen: number; present: number;
    absent: number; yellow: number; red: number; latestNote: string;
  }> };
  history: HistoryRow[];
  recommendations?: string[];
  notes?: Array<{ date: string; className: string; text: string }>;
}

/** One native, paginated renderer for both roles and report scopes. */
export function createAdminReportPdf(data: AdminReportPdfData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const classReport = data.kind === 'class';
  const reportTitle = classReport ? 'Class Report' : 'Student Report';
  pdf.setProperties({ title: `${data.name} - ${reportTitle}`, creator: 'EarlyFlag' });
  const margin = 12, width = 186, bottom = 279, line = 4;
  let y = margin;
  const ink = '#172033', muted = '#64748b', border = '#e2e8f0';
  function font(size = 9, bold = false, color = ink) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(color);
  }
  function text(value: string | string[], x: number, top: number, size = 9, bold = false, color = ink) {
    font(size, bold, color);
    pdf.text(value, x, top + 3, { baseline: 'alphabetic', lineHeightFactor: line / (size * 25.4 / 72) });
  }
  function wrap(value: string, w: number, size = 9, bold = false): string[] {
    font(size, bold); return pdf.splitTextToSize(value || '', w);
  }
  function box(x: number, top: number, w: number, h: number, fill = '#ffffff') {
    pdf.setDrawColor(border); pdf.setFillColor(fill); pdf.setLineWidth(0.2);
    pdf.roundedRect(x, top, w, h, 2, 2, 'FD');
  }
  function page() { pdf.addPage(); y = margin; }
  function space(height: number) { if (y + height > bottom) page(); }
  function paragraph(value: string, color = muted, size = 8) {
    const lines = wrap(value, width - 4, size);
    for (const item of lines) { space(line + 1); text(item, margin + 2, y, size, false, color); y += line; }
    y += 3;
  }
  function heading(title: string, subtitle?: string) {
    space(20); text(title, margin, y, 11, true); y += 7;
    if (subtitle) paragraph(subtitle);
  }
  const name = wrap(data.name, 104, 17, true);
  const details = wrap([data.grade, classReport ? data.subject : data.studentId, classReport ? data.teacherName : ''].filter(Boolean).join(' | '), 104, 8);
  const headerHeight = Math.max(34, 16 + name.length * 7 + details.length * line);
  box(margin, y, width, headerHeight);
  pdf.setFillColor('#f1f5f9'); pdf.circle(margin + 11, y + 17, 8, 'F');
  font(12, true, muted); pdf.text(data.initials, margin + 11, y + 17, { align: 'center', baseline: 'middle' });
  text(reportTitle.toUpperCase(), margin + 23, y + 4, 7, false, muted);
  name.forEach((item, index) => text(item, margin + 23, y + 11 + index * 7, 17, true));
  text(details, margin + 23, y + 13 + name.length * 7, 8, false, muted);
  text(wrap(data.dateRange || data.period, 48, 8), margin + width - 51, y + 5, 8, true);
  if (!classReport) text(wrap(data.subject, 48, 8), margin + width - 51, y + 19, 8, false, muted);
  y += headerHeight + 5;

  function cards(items: Array<[string, number, string, string]>) {
    space(18); const w = (width - (items.length - 1) * 3) / items.length;
    items.forEach(([label, value, fill, color], index) => {
      const x = margin + index * (w + 3); box(x, y, w, 16, fill);
      text(String(value), x + 4, y + 5, 16, true, color); text(label, x + 18, y + 6, 8, true);
    }); y += 22;
  }
  cards([
    ['Super Green', data.counts.superGreen, '#ecfdf5', '#047857'],
    ['Yellow Incidents', data.counts.yellow, '#fffbeb', '#b45309'],
    ['Red Incidents', data.counts.red, '#fef2f2', '#b91c1c'],
  ]);
  if (!classReport && data.crossClassAlerts?.length) {
    heading(`${data.crossClassAlerts.length} Cross-Class ${data.crossClassAlerts.length === 1 ? 'Alert' : 'Alerts'}`);
    for (const alert of data.crossClassAlerts) {
      paragraph(`${alert.date} | ${alert.description}`, '#4338ca');
      if (alert.contributions) paragraph(alert.contributions, '#4338ca');
    }
    paragraph('Admin-only; does not add a Red to any class.', '#4338ca');
  }
  if (classReport) {
    heading(`${data.subject} Attendance`, `Recorded class signals for ${data.dateRange}; not a school-wide attendance total.`);
    cards([['Present', data.counts.present, '#ecfdf5', '#047857'], ['Absent', data.counts.absent, '#f8fafc', muted]]);
    paragraph('A recorded zero does not confirm every class period was logged.');
  }

  // Rows can span pages; every continuation repeats its heading and column labels.
  function table(title: string, subtitle: string, labels: string[], widths: number[], rows: string[][], types: string[] = []) {
    const starts = widths.map((_, i) => margin + widths.slice(0, i).reduce((a, b) => a + b, 0));
    const header = (continued = false) => {
      heading(`${title}${continued ? ' (continued)' : ''}`, subtitle);
      box(margin, y, width, 8, '#f8fafc');
      labels.forEach((label, i) => text(label, starts[i] + 2, y + 2, 7, false, muted)); y += 8;
    };
    space(35); header();
    if (!rows.length) { paragraph('No student history in this period.'); return; }
    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, i) => wrap(cell, widths[i] - 4, 8, i === 2));
      const total = Math.max(1, ...cells.map(cell => cell.length));
      let offset = 0;
      while (offset < total) {
        if (y + Math.min(total - offset, 4) * line + 5 > bottom) { page(); header(true); }
        const take = Math.min(total - offset, Math.max(1, Math.floor((bottom - y - 5) / line)));
        const height = Math.max(11, take * line + 5);
        box(margin, y, width, height);
        cells.forEach((cell, i) => {
          const chunk = cell.slice(offset, offset + take);
          if (!chunk.length) return;
          const color = i === 1 && types[rowIndex] ? types[rowIndex] === 'red' ? '#b91c1c' : types[rowIndex] === 'yellow' ? '#b45309' : muted : i === 3 ? muted : ink;
          text(chunk, starts[i] + 2, y + 2, 8, i === 2, color);
        });
        y += height; offset += take;
        if (offset < total) { page(); header(true); }
      }
    }); y += 7;
  }
  if (!classReport && data.classSnapshot) {
    if (data.classSnapshot.rows.length) {
      table('Class-by-Class Snapshot', data.classSnapshot.range,
        ['Subject / Teacher', 'Super Green', 'Present', 'Absent', 'Yellow', 'Red'], [66, 28, 23, 23, 23, 23],
        data.classSnapshot.rows.map(row => [`${row.className}\n${row.teacherName}`, String(row.superGreen), String(row.present), String(row.absent), String(row.yellow), String(row.red)]));
    } else { heading('Class-by-Class Snapshot'); paragraph('No active classes match this report.'); }
    paragraph('Present and Absent are recorded class signals, not verified days attended.');
  }
  const includeNotes = data.includeNotes !== false;
  const groups = classReport ? [{ className: data.subject, teacherName: data.teacherName, rows: data.history }] : groupReportHistory(data.history);
  if (!groups.length) { heading('Student History'); paragraph('No student history in this period.'); }
  for (const group of groups) {
    table(`Student History - ${group.className}`, [data.dateRange, group.teacherName].filter(Boolean).join(' | '),
      includeNotes ? ['Date', 'Incident Level', 'Description', 'Teacher Note'] : ['Date', 'Incident Level', 'Description'],
      includeNotes ? [30, 42, 57, 57] : [30, 42, 114],
      group.rows.map(row => [row.date, row.typeLabel.replace('·', '-'), row.title, ...(includeNotes ? [row.description] : [])]),
      group.rows.map(row => row.signalType));
  }
  const pages = pdf.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    pdf.setPage(n); text(`EarlyFlag - ${reportTitle}`, margin, 287, 7, false, muted);
    text(`${n} / ${pages}`, 183, 287, 7, false, muted);
  }
  return pdf;
}
