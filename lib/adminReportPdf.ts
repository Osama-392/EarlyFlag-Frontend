import jsPDF from 'jspdf';

export interface AdminReportPdfData {
  name: string;
  initials: string;
  grade: string;
  studentId?: string;
  iep: boolean;
  ell: boolean;
  period: string;
  dateRange: string;
  subject: string;
  counts: {
    superGreen: number;
    present: number;
    yellow: number;
    red: number;
    absent: number;
  };
  canonicalRed?: {
    total: number;
    academic: number;
    behavioral: number;
    crossClass: number;
    range: string;
  };
  classSnapshot?: {
    range: string;
    rows: Array<{
      className: string; teacherName: string;
      present: number; absent: number; yellow: number; red: number; superGreen: number;
      latestNote: string;
    }>;
  };
  history: Array<{
    date: string;
    dayOfWeek: string;
    title: string;
    description: string;
    className: string;
    teacherName: string;
    typeLabel: string;
    signalType: string;
  }>;
  recommendations?: string[];
  notes?: Array<{ date: string; className: string; text: string }>;
}

const palette = {
  ink: '#0b1f41',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  surface: '#f8fafc',
  white: '#ffffff',
  red: { text: '#dc2626', fill: '#fef2f2', border: '#fecaca' },
  yellow: { text: '#ca8a04', fill: '#fefce8', border: '#fef08a' },
  green: { text: '#059669', fill: '#ecfdf5', border: '#a7f3d0' },
  blue: { text: '#2563eb', fill: '#eff6ff', border: '#bfdbfe' },
  neutral: { text: '#64748b', fill: '#f8fafc', border: '#e2e8f0' },
};

/** Native PDF equivalent of the admin report preview. */
export function createAdminReportPdf(data: AdminReportPdfData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `${data.name} - Admin Student Report`, creator: 'EarlyFlag' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const width = pageWidth - margin * 2;
  const bottom = pageHeight - 15;
  const lineHeight = 4.2;
  let y = margin;

  const setText = (size = 9, bold = false, color = palette.ink) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  };
  const text = (
    value: string | string[], x: number, top: number, size = 9, bold = false,
    color = palette.ink, options: { align?: 'left' | 'center' | 'right' } = {},
  ) => {
    setText(size, bold, color);
    pdf.text(value, x, top + size * 25.4 / 72 * 1.075, {
      baseline: 'alphabetic',
      lineHeightFactor: lineHeight / (size * 25.4 / 72),
      ...options,
    });
  };
  const wrap = (value: string, maxWidth: number, size = 9, bold = false): string[] => {
    setText(size, bold);
    return pdf.splitTextToSize(String(value || ''), maxWidth);
  };
  const box = (x: number, top: number, w: number, h: number, fill = palette.white, border = palette.border, radius = 2.5) => {
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(border);
    pdf.setFillColor(fill);
    pdf.roundedRect(x, top, w, h, radius, radius, 'FD');
  };
  const nextPage = () => {
    pdf.addPage();
    y = margin;
  };
  const ensureSpace = (height: number) => {
    if (y + height > bottom) nextPage();
  };
  const heading = (title: string, subtitle?: string, continued = false) => {
    ensureSpace(subtitle ? 13 : 9);
    text(`${title}${continued ? ' (continued)' : ''}`, margin + 3, y, 11, true);
    y += 6;
    if (subtitle) {
      text(subtitle, margin + 3, y, 8, false, palette.muted);
      y += 5;
    }
  };
  const themeFor = (signalType: string) => {
    const normalized = signalType.toLowerCase();
    if (normalized === 'red') return palette.red;
    if (normalized === 'yellow') return palette.yellow;
    if (['green', 'super_green', 'present'].includes(normalized)) return palette.green;
    return palette.neutral;
  };

  // Student identity and configured report scope.
  const identityHeight = 34;
  box(margin, y, width, identityHeight);
  const avatarX = margin + 14;
  const avatarY = y + identityHeight / 2;
  pdf.setFillColor('#f1f5f9');
  pdf.circle(avatarX, avatarY, 8.5, 'F');
  setText(13, true, palette.muted);
  pdf.text(data.initials, avatarX, avatarY, { align: 'center', baseline: 'middle' });

  const nameX = margin + 28;
  text('STUDENT REPORT', nameX, y + 4, 7, true, palette.faint);
  const nameLines = wrap(data.name, 88, 16, true).slice(0, 2);
  text(nameLines, nameX, y + 9, 16, true);
  const details = [data.grade, data.studentId, data.iep ? 'IEP' : '', data.ell ? 'ELL' : ''].filter(Boolean).join('  |  ');
  text(details, nameX, y + 10 + nameLines.length * 7.3, 8.5, true, palette.muted);

  const scopeX = pageWidth - margin - 4;
  text(data.period, scopeX, y + 6, 9, true, palette.ink, { align: 'right' });
  text(data.dateRange, scopeX, y + 12, 8, false, palette.muted, { align: 'right' });
  text(data.subject, scopeX, y + 18, 8, false, palette.muted, { align: 'right' });
  y += identityHeight + 5;

  // Same five report-period totals shown in the admin preview.
  heading(`Report Period - ${data.period}`);
  const countCards = [
    { label: 'Super Green', value: data.counts.superGreen, theme: palette.green },
    { label: 'Present', value: data.counts.present, theme: palette.green },
    { label: 'Yellow', value: data.counts.yellow, theme: palette.yellow },
    { label: 'Red', value: data.counts.red, theme: palette.red },
    { label: 'Absent', value: data.counts.absent, theme: palette.neutral },
  ];
  const countCardWidth = (width - 12) / 5;
  countCards.forEach((card, index) => {
    const x = margin + index * (countCardWidth + 3);
    box(x, y, countCardWidth, 18, card.theme.fill, card.theme.border, 2);
    text(String(card.value), x + countCardWidth / 2, y + 2.2, 14, true, card.theme.text, { align: 'center' });
    text(card.label, x + countCardWidth / 2, y + 11.5, 7.5, false, palette.muted, { align: 'center' });
  });
  y += 23;

  if (data.canonicalRed) {
    heading('Red Summary', data.canonicalRed.range);
    const redCards = [
      { label: 'Total Red', value: data.canonicalRed.total },
      { label: 'Academic', value: data.canonicalRed.academic },
      { label: 'Behavioral', value: data.canonicalRed.behavioral },
      { label: 'Cross-Class', value: data.canonicalRed.crossClass },
    ];
    const redCardWidth = (width - 9) / 4;
    redCards.forEach((card, index) => {
      const x = margin + index * (redCardWidth + 3);
      box(x, y, redCardWidth, 18, palette.red.fill, palette.red.border, 2);
      text(String(card.value), x + redCardWidth / 2, y + 2.2, 14, true, palette.red.text, { align: 'center' });
      text(card.label, x + redCardWidth / 2, y + 11.5, 7.5, false, palette.muted, { align: 'center' });
    });
    y += 23;
  }

  if (data.classSnapshot) {
    const snapshot = data.classSnapshot;
    const columnWidths = [43, 16, 15, 15, 13, 23, width - 125];
    const columnX = columnWidths.map((_, index) => margin + columnWidths.slice(0, index).reduce((sum, value) => sum + value, 0));
    const tableHeading = (continued = false) => {
      // Keep the heading, column labels and at least one row together.
      ensureSpace(35);
      heading('Class-by-Class Snapshot', snapshot.range, continued);
      box(margin, y, width, 9, palette.surface, palette.border, 1);
      ['Subject / Teacher', 'Present', 'Absent', 'Yellow', 'Red', 'Super Green', 'Latest Note'].forEach((label, index) => {
        const numeric = index > 0 && index < 6;
        text(label, columnX[index] + (numeric ? columnWidths[index] / 2 : 2), y + 2, 7, true, palette.muted,
          numeric ? { align: 'center' } : {});
      });
      y += 9;
    };
    tableHeading();
    if (!snapshot.rows.length) {
      text('No active classes match this report.', margin + 3, y + 3, 9, false, palette.muted);
      y += 12;
    }
    for (const row of snapshot.rows) {
      const nameLines = wrap(row.className, columnWidths[0] - 4, 8, true);
      const teacherLines = wrap(row.teacherName, columnWidths[0] - 4, 7.5);
      const noteLines = wrap(row.latestNote, columnWidths[6] - 4, 7.5);
      const labelLines = [...nameLines, ...teacherLines];
      const totalLines = Math.max(labelLines.length, noteLines.length, 1);
      const values = [row.present, row.absent, row.yellow, row.red, row.superGreen];
      const themes = [palette.green, palette.neutral, palette.yellow, palette.red, palette.green];
      let offset = 0;
      while (offset < totalLines) {
        const desiredHeight = Math.max(12, (totalLines - offset) * lineHeight + 5);
        if (y + desiredHeight > bottom && y > margin + 21) {
          nextPage();
          tableHeading(true);
        }
        const capacity = Math.max(1, Math.floor((bottom - y - 5) / lineHeight));
        const length = Math.min(capacity, totalLines - offset);
        const height = Math.max(12, length * lineHeight + 5);
        box(margin, y, width, height, palette.white, palette.border, 1);
        for (let line = 0; line < length; line++) {
          const at = offset + line;
          if (labelLines[at]) text(labelLines[at], columnX[0] + 2, y + 2 + line * lineHeight,
            at < nameLines.length ? 8 : 7.5, at < nameLines.length, at < nameLines.length ? palette.ink : palette.muted);
          if (noteLines[at]) text(noteLines[at], columnX[6] + 2, y + 2 + line * lineHeight, 7.5, false, palette.muted);
        }
        if (offset === 0) values.forEach((value, index) => {
          const center = columnX[index + 1] + columnWidths[index + 1] / 2;
          box(center - 5, y + 2, 10, 7, themes[index].fill, themes[index].border, 1);
          text(String(value), center, y + 3, 8, true, themes[index].text, { align: 'center' });
        });
        y += height;
        offset += length;
        if (offset < totalLines) { nextPage(); tableHeading(true); }
      }
    }
    y += 3;
    const caption = wrap('Present and Absent count recorded signals. Super Green includes automatic entries. Cross-class Reds appear in Red Summary.', width - 6, 7.5);
    ensureSpace(caption.length * lineHeight + 5);
    text(caption, margin + 3, y, 7.5, false, palette.muted);
    y += caption.length * lineHeight + 6;
  }

  if (data.history.length) {
    const historyHeading = (continued = false) => {
      heading('Student History', `${data.period}  |  ${data.subject}`, continued);
    };
    historyHeading();
    const freshHistoryY = y;

    for (const row of data.history) {
      const theme = themeFor(row.signalType);
      const titleX = margin + 30;
      const titleWidth = 25;
      const descriptionX = titleX + titleWidth + 3;
      const descriptionWidth = 43;
      const metaX = descriptionX + descriptionWidth + 3;
      const metaWidth = 40;
      const descriptionBaselineOffset = (8.5 - 8) * 25.4 / 72 * 1.075;
      const metaBaselineOffset = (8.5 - 7.5) * 25.4 / 72 * 1.075;
      const title = row.title || 'Flag Logged';
      const meta = [row.className, row.teacherName].filter(Boolean).join(' • ');
      const description = row.description && row.description.toLowerCase() !== title.toLowerCase()
        ? row.description
        : '';
      const titleLines = wrap(title, titleWidth, 8.5, true);
      const descriptionLines = description ? wrap(description, descriptionWidth, 8) : [];
      const metaLines = meta ? wrap(meta, metaWidth, 7.5, true) : [];
      let items = Array.from(
        { length: Math.max(titleLines.length, descriptionLines.length, metaLines.length, 1) },
        (_, index) => ({
          title: titleLines[index] || '',
          description: descriptionLines[index] || '',
          meta: metaLines[index] || '',
        }),
      );
      let continued = false;

      while (items.length) {
        const desiredHeight = Math.max(15, items.length * lineHeight + 6);
        if (y + desiredHeight > bottom && y > freshHistoryY + 0.1) {
          nextPage();
          historyHeading(true);
        }
        const capacity = Math.max(1, Math.floor((bottom - y - 6) / lineHeight));
        const chunk = items.slice(0, capacity);
        const rowHeight = Math.max(15, chunk.length * lineHeight + 6);
        box(margin, y, width, rowHeight, palette.white, palette.border, 2);

        text(continued ? '(cont.)' : row.date, margin + 4, y + 2.3, 8.5, true, palette.ink);
        if (!continued && row.dayOfWeek) text(row.dayOfWeek, margin + 4, y + 7, 7.5, true, palette.faint);

        let contentY = y + 2.3;
        chunk.forEach((line) => {
          if (line.title) text(line.title, titleX, contentY, 8.5, true, palette.ink);
          if (line.description) text(line.description, descriptionX, contentY + descriptionBaselineOffset, 8, false, palette.muted);
          if (line.meta) text(line.meta, metaX, contentY + metaBaselineOffset, 7.5, true, palette.faint);
          contentY += lineHeight;
        });

        const pillX = margin + width - 43;
        const pillLines = wrap(row.typeLabel, 35, 7.5, true).slice(0, 2);
        const pillHeight = Math.max(7, pillLines.length * 3.5 + 2);
        box(pillX, y + 3, 39, pillHeight, theme.fill, theme.border, 2);
        text(pillLines, pillX + 19.5, y + 3.5, 7.5, true, theme.text, { align: 'center' });

        y += rowHeight + 2;
        items = items.slice(capacity);
        continued = true;
      }
    }
  }

  const renderTextBlocks = (title: string, values: string[], emptyText?: string) => {
    nextPage();
    heading(title);
    if (!values.length && emptyText) text(emptyText, margin + 3, y + 2, 9, false, palette.muted);
    values.forEach((value, index) => {
      let lines = wrap(value, width - 8);
      let continued = false;
      while (lines.length) {
        const desiredHeight = 7 + lines.length * lineHeight;
        if (y + desiredHeight > bottom && y > margin + 12) {
          nextPage();
          heading(title, undefined, true);
        }
        const capacity = Math.max(1, Math.floor((bottom - y - 7) / lineHeight));
        const chunk = lines.slice(0, capacity);
        const blockHeight = 6 + chunk.length * lineHeight;
        box(margin, y, width, blockHeight, palette.surface, palette.border, 2);
        text(title === 'Recommended Next Steps' ? `• ${chunk[0]}` : chunk[0], margin + 4, y + 2.5, 9, false, palette.muted);
        if (chunk.length > 1) text(chunk.slice(1), margin + 4, y + 2.5 + lineHeight, 9, false, palette.muted);
        lines = lines.slice(capacity);
        y += blockHeight + 3;
        continued = true;
      }
      if (continued && index < values.length - 1) y += 0.5;
    });
  };

  if (data.recommendations?.length) renderTextBlocks('Recommended Next Steps', data.recommendations);

  if (data.notes) {
    nextPage();
    heading('Teachers Notes');
    if (!data.notes.length) text('No notes provided.', margin + 3, y + 2, 9, false, palette.muted);
    for (const note of data.notes) {
      const meta = [note.className, note.date].filter(Boolean).join(' | ');
      let lines = wrap(note.text || 'No notes provided.', width - 8);
      let continued = false;
      while (lines.length) {
        const metaLines = wrap([meta, continued ? 'continued' : ''].filter(Boolean).join(' | '), width - 8, 8, true);
        const metaHeight = metaLines.length * lineHeight;
        const desiredHeight = 8 + metaHeight + lines.length * lineHeight;
        if (y + desiredHeight > bottom && y > margin + 12) {
          nextPage();
          heading('Teachers Notes', undefined, true);
        }
        const capacity = Math.max(1, Math.floor((bottom - y - 8 - metaHeight) / lineHeight));
        const chunk = lines.slice(0, capacity);
        const blockHeight = 7 + metaHeight + chunk.length * lineHeight;
        box(margin, y, width, blockHeight, palette.surface, palette.border, 2);
        if (metaLines.length) text(metaLines, margin + 4, y + 2.5, 8, true, palette.muted);
        text(chunk, margin + 4, y + 3 + metaHeight, 9, false, palette.muted);
        lines = lines.slice(capacity);
        y += blockHeight + 3;
        continued = true;
      }
    }
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    text('EarlyFlag - Admin Student Report', margin, pageHeight - 8, 7, false, palette.muted);
    text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, 7, false, palette.muted, { align: 'right' });
  }

  return pdf;
}
