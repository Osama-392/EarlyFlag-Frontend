import jsPDF from 'jspdf';
import { groupReportHistory, HistoryRow, reportCategoryCounts } from './reportPresentation';

export interface AdminReportPdfData {
  name: string; initials: string; grade: string; studentId?: string;
  iep: boolean; ell: boolean; period: string; dateRange: string; subject: string;
  kind?: 'class' | 'overview'; teacherName?: string; includeNotes?: boolean;
  counts: { superGreen: number; present: number; absent: number; yellow: number; red: number };
  categories?: ReturnType<typeof reportCategoryCounts>;
  canonicalRed?: { total: number; academic: number; behavioral: number; crossClass: number; range: string };
  crossClassAlerts?: Array<{
    date: string; description: string; contributions: string;
    items?: Array<{ title: string; className: string; date: string; inferred?: boolean }>;
  }>;
  classSnapshot?: { range: string; rows: Array<{
    className: string; teacherName: string; superGreen: number; present: number;
    absent: number; yellow: number; red: number; latestNote: string;
  }> };
  history: HistoryRow[];
  recommendations?: string[];
  notes?: Array<{ date: string; className: string; text: string }>;
}

/** Native text and shapes keep the reference layout sharp at any print size. */
export function createAdminReportPdf(data: AdminReportPdfData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const classReport = data.kind === 'class';
  const reportTitle = classReport ? 'Class Report' : 'Student Report';
  pdf.setProperties({ title: `${data.name} - ${reportTitle}`, creator: 'EarlyFlag' });
  const margin = 8, width = 194, bottom = 281, line = classReport ? 4.6 : 3.2;
  const ink = '#10133d', muted = '#496b9e', border = '#dce5ef';
  const green = '#009b78', yellow = '#ef9900', red = '#e50920';
  let y = margin;
  function font(size = 9, bold = false, color = ink) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(color);
  }
  function text(value: string | string[], x: number, top: number, size = 9, bold = false, color = ink, align: 'left' | 'center' | 'right' = 'left') {
    font(size, bold, color);
    pdf.text(value, x, top + size * 25.4 / 72 * 0.85, { baseline: 'alphabetic', align, lineHeightFactor: line / (size * 25.4 / 72) });
  }
  function wrap(value: string, w: number, size = 9, bold = false): string[] {
    font(size, bold); return pdf.splitTextToSize(String(value || ''), w);
  }
  function box(x: number, top: number, w: number, h: number, fill = '#ffffff', stroke = border, radius = 1.5) {
    pdf.setDrawColor(stroke); pdf.setFillColor(fill); pdf.setLineWidth(0.2);
    pdf.roundedRect(x, top, w, h, radius, radius, 'FD');
  }
  function rule(x1: number, top: number, x2: number, end = top, color = border) {
    pdf.setDrawColor(color); pdf.setLineWidth(0.2); pdf.line(x1, top, x2, end);
  }
  function page() { pdf.addPage(); y = margin; }
  function space(height: number) { if (y + height > bottom) page(); }
  function paragraph(value: string, color = muted, size = 8) {
    for (const item of wrap(value, width, size)) { space(line + 1); text(item, margin, y, size, false, color); y += line; }
    y += 2;
  }
  function heading(title: string, subtitle?: string, size = 14) {
    const titles = wrap(title, width, size, true);
    const subtitles = subtitle ? wrap(subtitle, width, 9) : [];
    const titleStep = size >= 16 ? 6.5 : classReport ? 6 : 5;
    const height = titles.length * titleStep + subtitles.length * line + 3;
    space(height + 15);
    titles.forEach(item => { text(item, margin, y, size, true); y += titleStep; });
    if (subtitles.length) { text(subtitles, margin, y, 9, false, muted); y += subtitles.length * line + (classReport ? 1 : 0.5); }
    y += classReport ? 2 : 1;
  }
  function number(value: number, x: number, top: number, color: string, maxWidth = 17, size = 28) {
    const valueText = String(value);
    font(size, true);
    const fitted = Math.min(size, size * maxWidth / Math.max(pdf.getTextWidth(valueText), 1));
    text(valueText, x, top, fitted, true, color);
  }

  const name = wrap(data.name, width - 31, 20, true);
  const details = wrap((classReport ? [data.subject, data.grade, data.teacherName] : [data.grade, data.studentId, data.subject]).filter(Boolean).join('  |  '), width - 31, 9);
  const dates = wrap(data.dateRange || data.period, 76, 9, true);
  const nameTop = Math.max(classReport ? 10 : 8, 4 + dates.length * line + 1);
  const nameStep = classReport ? 8 : 7;
  const detailsTop = nameTop + name.length * nameStep + 1;
  const headerHeight = detailsTop + details.length * line + (classReport ? 5 : 4);
  box(margin, y, width, headerHeight);
  pdf.setFillColor('#eef0f4'); pdf.circle(margin + 13, y + headerHeight / 2, 8.5, 'F');
  font(14, true, '#52617c'); pdf.text(data.initials, margin + 13, y + headerHeight / 2, { align: 'center', baseline: 'middle' });
  text(reportTitle.toUpperCase(), margin + 27, y + 4, 8, false, muted);
  text(dates, margin + width - 4, y + 4, 9, true, ink, 'right');
  name.forEach((item, i) => text(item, margin + 27, y + nameTop + i * nameStep, 20, true));
  const detailParts = (classReport ? [data.subject, data.grade, data.teacherName] : [data.grade, data.studentId, data.subject]).filter((value): value is string => Boolean(value));
  const styledParts = detailParts.flatMap((value, i) => [...(i ? [{ value: '  |  ', bold: false }] : []), { value, bold: value === data.subject }]);
  const detailWidth = styledParts.reduce((total, part) => { font(9, part.bold); return total + pdf.getTextWidth(part.value); }, 0);
  if (detailWidth <= width - 31) {
    let x = margin + 27;
    for (const part of styledParts) { text(part.value, x, y + detailsTop, 9, part.bold, part.bold ? ink : muted); x += pdf.getTextWidth(part.value); }
  } else text(details, margin + 27, y + detailsTop, 9, false, muted);
  y += headerHeight + (classReport ? 4 : 3);

  const categories = data.categories || reportCategoryCounts(data.history);
  const cards = [
    { title: 'Super Green', count: data.counts.superGreen, color: green, fill: '#effcf7', stroke: '#d0f3e8' },
    { title: 'Yellow Incidents', count: data.counts.yellow, color: yellow, fill: '#fffaef', stroke: '#faedd3', behavioral: categories.yellowBehavioral, academic: categories.yellowAcademic },
    { title: 'Red Incidents', count: data.counts.red, color: red, fill: '#fff0f3', stroke: '#f7d4dc', behavioral: categories.redBehavioral, academic: categories.redAcademic },
  ];
  const cardWidth = (width - 6) / 3;
  const cardHeight = classReport ? 34 : 27;
  const dividerTop = classReport ? 17 : 14;
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3);
    box(x, y, cardWidth, cardHeight, card.fill, card.stroke);
    number(card.count, x + 5, y + 3, card.color, 17, classReport ? 28 : 25);
    rule(x + 20, y + 4, x + 20, y + 13);
    text(wrap(card.title, cardWidth - 25, 10, true), x + 24, y + 7, 10, true);
    rule(x + 4, y + dividerTop, x + cardWidth - 4);
    if (card.behavioral === undefined) text('Positive recognitions', x + 5, y + dividerTop + 2, 9, false, muted);
    else {
      rule(x + cardWidth / 2, y + dividerTop + 3, x + cardWidth / 2, y + cardHeight - 3);
      text(String(card.behavioral), x + cardWidth / 4, y + dividerTop + 2, classReport ? 16 : 14, true, card.color, 'center');
      text(String(card.academic), x + cardWidth * 3 / 4, y + dividerTop + 2, classReport ? 16 : 14, true, card.color, 'center');
      text('Behavioral', x + cardWidth / 4, y + cardHeight - (classReport ? 7 : 5), 9, false, muted, 'center');
      text('Academic', x + cardWidth * 3 / 4, y + cardHeight - (classReport ? 7 : 5), 9, false, muted, 'center');
    }
  });
  y += cardHeight + (classReport ? 6 : 3);

  if (!classReport && data.crossClassAlerts?.length) {
    const alerts = data.crossClassAlerts;
    alerts.forEach((alert, index) => {
      const title = index === 0 ? `${alerts.length} Cross-Class ${alerts.length === 1 ? 'Alert' : 'Alerts'}` : `Cross-Class Alert - ${alert.date}`;
      const items = alert.items?.length ? alert.items : alert.contributions ? [{ title: '', className: alert.contributions, date: '', inferred: false }] : [];
      // Three contributions per band, with continuation bands for larger alerts.
      const batches = Math.max(1, Math.ceil(items.length / 3));
      let description = wrap(alert.description, 64, 8);
      for (let batch = 0; batch < batches || description.length; batch++) {
        const group = items.slice(batch * 3, batch * 3 + 3);
        const itemWidth = (width - 86) / Math.max(1, group.length);
        const cells = group.map(item => [
          ...wrap(item.title || 'Yellow incident', itemWidth - 8, 8, true).map(value => ({ value, bold: true, color: ink })),
          ...wrap(item.className, itemWidth - 8, 8).map(value => ({ value, bold: false, color: ink })),
          ...wrap(`${item.date}${item.inferred ? ' (inferred)' : ''}`, itemWidth - 8, 8).map(value => ({ value, bold: false, color: muted })),
        ]);
        const titleLines = wrap(batch ? `${title} (continued)` : title, 64, 12, true);
        let offset = 0;
        do {
          space(30);
          const maxLines = Math.max(1, Math.floor((bottom - y - 10 - titleLines.length * 5) / line));
          const count = Math.min(Math.max(description.length, ...cells.map(cell => cell.length - offset), 1), maxLines);
          const desc = description.slice(0, count);
          const h = Math.max(22, 8 + Math.max(titleLines.length * 5 + desc.length * line, count * line));
          box(margin, y, width, h, '#f7f4ff', '#e8e0fa');
          pdf.setFillColor('#e8ddff'); pdf.circle(margin + 9, y + 10, 6, 'F');
          // Small vector bell, so the export needs no icon font or raster image.
          pdf.setFillColor('#7946e8'); pdf.circle(margin + 9, y + 8, 2, 'F');
          pdf.triangle(margin + 6, y + 12, margin + 12, y + 12, margin + 9, y + 6, 'F');
          pdf.circle(margin + 9, y + 13, 0.7, 'F');
          titleLines.forEach((value, i) => text(value, margin + 18, y + 4 + i * 5, 12, true));
          text(desc, margin + 18, y + 5 + titleLines.length * 5, 8, false, muted);
          cells.forEach((cell, i) => {
            const x = margin + 86 + i * itemWidth;
            rule(x, y + 4, x, y + h - 4, '#d9cdf2');
            pdf.setFillColor(yellow); pdf.circle(x + 3, y + 6, 1.3, 'F');
            cell.slice(offset, offset + count).forEach((item, n) => text(item.value, x + 6, y + 4 + n * line, 8, item.bold, item.color));
          });
          y += h + 3; description = description.slice(count); offset += count;
          if (cells.some(cell => cell.length > offset)) page();
        } while (cells.some(cell => cell.length > offset));
      }
    });
    y += 2;
  }

  if (classReport) {
    heading(`${data.subject} Attendance`, `Recorded class signals for ${data.dateRange}; not a school-wide attendance total.`);
    space(24);
    const w = (width - 4) / 2;
    [{ label: 'Present', detail: 'Days in class', count: data.counts.present, color: green, fill: '#effcf7', stroke: '#d0f3e8' },
      { label: 'Absent', detail: 'Days absent', count: data.counts.absent, color: '#52617c', fill: '#f4f8fc', stroke: border }].forEach((card, i) => {
      const x = margin + i * (w + 4); box(x, y, w, 20, card.fill, card.stroke);
      number(card.count, x + 6, y + 4, card.color);
      rule(x + 23, y + 4, x + 23, y + 16);
      text(card.label, x + 29, y + 5, 11, true); text(card.detail, x + 29, y + 12, 9, false, muted);
    });
    y += 28;
  }

  // Keep ordinary rows intact; split very long notes at line boundaries and repeat headers.
  function table(title: string, subtitle: string, labels: string[], widths: number[], rows: string[][], types: string[] = [], snapshot = false) {
    const starts = widths.map((_, i) => margin + widths.slice(0, i).reduce((a, b) => a + b, 0));
    const numericColors = [ink, green, '#52617c', '#3767bc', yellow, red];
    let freshY = 0;
    const header = (continued = false) => {
      heading(`${title}${continued ? ' (continued)' : ''}`, subtitle, snapshot ? 17 : 13);
      const headerHeight = classReport ? 7 : 5.5;
      box(margin, y, width, headerHeight, '#f4f8fc');
      labels.forEach((label, i) => text(label, starts[i] + (snapshot && i ? widths[i] / 2 : 3), y + (classReport ? 2 : 1.2), 8, false, snapshot && i ? numericColors[i] : muted, snapshot && i ? 'center' : 'left'));
      y += headerHeight; freshY = y;
    };
    space(30); header();
    if (!rows.length) { paragraph('No student history in this period.'); return; }
    rows.forEach((row, rowIndex) => {
      const rowFont = classReport ? 10 : 8;
      const cells = row.map((cell, i) => wrap(cell, widths[i] - (!snapshot && i === 1 ? 10 : 6), rowFont));
      const total = Math.max(1, ...cells.map(cell => cell.length));
      let offset = 0;
      const padding = classReport ? 4 : 2;
      if (y + total * line + padding > bottom && y > freshY + 0.1) { page(); header(true); }
      while (offset < total) {
        if (y + Math.max(classReport ? 10 : 5.5, line + padding) > bottom) { page(); header(true); }
        const take = Math.min(total - offset, Math.max(1, Math.floor((bottom - y - padding) / line)));
        const height = Math.max(classReport ? 10 : 5.5, take * line + padding);
        pdf.setDrawColor(border); pdf.setLineWidth(0.15); pdf.rect(margin, y, width, height, 'S');
        cells.forEach((cell, i) => {
          const chunk = cell.slice(offset, offset + take);
          if (!chunk.length) return;
          if (snapshot) {
            if (i) text(chunk, starts[i] + widths[i] / 2, y + (height - 3) / 2, 10, true, numericColors[i], 'center');
            else chunk.forEach((value, n) => text(value, starts[i] + 3, y + 1.5 + n * line, 8, offset + n === 0, offset + n === 0 ? ink : muted));
          } else {
            if (i === 1) {
              pdf.setFillColor(types[rowIndex] === 'red' ? red : types[rowIndex] === 'yellow' ? yellow : types[rowIndex] === 'absent' ? '#a4b3c9' : green);
              pdf.circle(starts[i] + 3.5, y + (classReport ? 4 : 3), 1.4, 'F');
            }
            text(chunk, starts[i] + (i === 1 ? 8 : 3), y + (classReport ? 2 : 1.5), rowFont, false, i === 3 ? muted : ink);
          }
        });
        y += height; offset += take;
        if (offset < total) { page(); header(true); }
      }
    });
    y += classReport ? 5 : snapshot ? 1 : 3;
  }
  if (!classReport && data.classSnapshot) {
    if (data.classSnapshot.rows.length) table('Class Snapshot', data.classSnapshot.range,
      ['Subject / Teacher', 'Super Green', 'Present', 'Absent', 'Yellow', 'Red'], [69, 29, 24, 24, 24, 24],
      data.classSnapshot.rows.map(row => [`${row.className}\n${row.teacherName}`, String(row.superGreen), String(row.present), String(row.absent), String(row.yellow), String(row.red)]), [], true);
    else { heading('Class Snapshot'); paragraph('No active classes match this report.'); }
    paragraph('Present and Absent are recorded class signals, not verified days attended.', muted, 7);
    y += 1; rule(margin, y, margin + width); y += 4;
  }
  const includeNotes = data.includeNotes !== false;
  const groups = classReport ? [{ className: data.subject, teacherName: data.teacherName, rows: data.history }] : groupReportHistory(data.history);
  if (!classReport) {
    space(45); heading('Student History', undefined, 17);
    if (!groups.length) paragraph('No student history in this period.');
  }
  for (const group of groups) {
    table(classReport ? `Student History - ${group.className}` : group.className, [data.dateRange, group.teacherName].filter(Boolean).join(' | '),
      includeNotes ? ['Date', 'Incident Level', 'Description', 'Teacher Note'] : ['Date', 'Incident Level', 'Description'],
      includeNotes ? [29, 45, 65, 55] : [29, 45, 120],
      group.rows.map(row => [row.date, row.typeLabel.replace('·', '-'), row.title, ...(includeNotes ? [row.description || '—'] : [])]),
      group.rows.map(row => row.signalType));
  }
  const pages = pdf.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    pdf.setPage(n); text(`EarlyFlag – ${reportTitle}`, margin, 289, 7, false, muted);
    text(`${n} / ${pages}`, margin + width, 289, 7, false, muted, 'right');
  }
  return pdf;
}
