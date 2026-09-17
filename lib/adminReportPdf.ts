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
    heading('Canonical Red Summary', data.canonicalRed.range);
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

  if (data.history.length) {
    const historyHeading = (continued = false) => {
      heading('Student History', `${data.period}  |  ${data.subject}`, continued);
    };
    historyHeading();
    const freshHistoryY = y;

    for (const row of data.history) {
    const theme = themeFor(row.signalType);
    const contentWidth = width - 76;
    const titleLines = wrap(row.title || 'Flag Logged', contentWidth, 9, true);
    const descriptionLines = row.description && row.description.toLowerCase() !== row.title.toLowerCase()
      ? wrap(row.description, contentWidth, 8.5)
      : [];
    const meta = [row.className, row.teacherName].filter(Boolean).join(' | ');
    const metaLines = meta ? wrap(meta, contentWidth, 7.5) : [];
    let items = [
      ...titleLines.map(value => ({ value, size: 9, bold: true, color: palette.ink })),
      ...descriptionLines.map(value => ({ value, size: 8.5, bold: false, color: palette.muted })),
      ...metaLines.map(value => ({ value, size: 7.5, bold: true, color: palette.faint })),
    ];
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

        text(continued ? '(cont.)' : row.date, margin + 4, y + 3, 8.5, true, palette.ink);
        if (!continued && row.dayOfWeek) text(row.dayOfWeek, margin + 4, y + 8, 7.5, true, palette.faint);

        let contentY = y + 2.3;
        chunk.forEach((line) => {
          text(line.value, margin + 30, contentY, line.size, line.bold, line.color);
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
