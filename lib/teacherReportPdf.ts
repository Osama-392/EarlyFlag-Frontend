import jsPDF from 'jspdf';

export interface TeacherReportPdfData {
  name: string;
  initials: string;
  grade: string;
  status: string;
  period: string;
  countPeriodLabel: string;
  subject: string;
  counts: { red: number; yellow: number; superGreen: number };
  history: Array<{
    date: string;
    level: string;
    signalType: string;
    description: string;
    className: string;
  }>;
  // undefined means that notes were excluded in the report configuration.
  notes?: Array<{ date: string; className: string; text: string }>;
}

const colors = {
  ink: '#0b1f41', muted: '#64748b', border: '#e2e8f0', white: '#ffffff',
  red: { text: '#e83445', background: '#fff5f6', border: '#fecdd3', icon: '#ffe4e8' },
  yellow: { text: '#d99000', background: '#fffbef', border: '#fde6a5', icon: '#fff2c4' },
  green: { text: '#00a97a', background: '#effcf7', border: '#a7f3d0', icon: '#d1fae5' },
  neutral: { text: '#64748b', background: '#f8fafc', border: '#e2e8f0', icon: '#f1f5f9' },
};

/** Render the official report snapshot as text and shapes, without DOM screenshots. */
export function createTeacherReportPdf(data: TeacherReportPdfData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `${data.name} - Student Report`, creator: 'EarlyFlag' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const width = pageWidth - 2 * margin;
  const bottom = pageHeight - 15;
  const fontSize = 9;
  const lineHeight = 4.2;
  let y = margin;

  const setText = (size = fontSize, bold = false, color = colors.ink) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  };
  const wrap = (text: string, maxWidth: number, size = fontSize, bold = false): string[] => {
    setText(size, bold);
    return pdf.splitTextToSize(String(text || ''), maxWidth);
  };
  const text = (value: string | string[], x: number, top: number, size = fontSize, bold = false, color = colors.ink) => {
    setText(size, bold, color);
    // Explicit alphabetic baseline: jsPDF's 'top' option also depends on line
    // spacing, which can shift differently-sized labels into adjacent content.
    pdf.text(value, x, top + size * 25.4 / 72 * 1.075, {
      baseline: 'alphabetic', lineHeightFactor: lineHeight / (size * 25.4 / 72),
    });
  };
  const box = (x: number, top: number, w: number, h: number, fill: string, border = colors.border, radius = 3) => {
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(border);
    pdf.setFillColor(fill);
    pdf.roundedRect(x, top, w, h, radius, radius, 'FD');
  };
  const themeFor = (signalType: string) => signalType === 'red' ? colors.red
    : signalType === 'yellow' ? colors.yellow
      : ['green', 'super_green', 'present'].includes(signalType) ? colors.green : colors.neutral;
  const capitalize = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());

  // Explicit baselines and a real circular shape keep the initials centered.
  // Names wrap when necessary; their complete text is never truncated.
  const statusTheme = themeFor(data.status.toLowerCase().replace(/ /g, '_'));
  const nameLines = wrap(data.name, width - 82, 18, true);
  const nameLineHeight = 8.6;
  const identityHeight = Math.max(27, 16 + nameLines.length * nameLineHeight);
  box(margin, y, width, identityHeight, colors.white);
  const avatarX = margin + 13;
  const avatarY = y + identityHeight / 2;
  pdf.setFillColor('#f1f5f9');
  pdf.circle(avatarX, avatarY, 8, 'F');
  setText(13, true, colors.muted);
  pdf.text(data.initials, avatarX, avatarY, { align: 'center', baseline: 'middle' });
  const nameX = margin + 26;
  if (data.status !== 'Normal') {
    setText(7, true);
    const badgeWidth = pdf.getTextWidth(data.status.toUpperCase()) + 5;
    box(nameX, y + 3, badgeWidth, 4.5, statusTheme.text, statusTheme.text, 2);
    text(data.status.toUpperCase(), nameX + 2.5, y + 3.5, 7, true, colors.white);
  }
  setText(18, true);
  pdf.text(nameLines, nameX, y + 8 + 18 * 25.4 / 72 * 1.075, { baseline: 'alphabetic', lineHeightFactor: nameLineHeight / (18 * 25.4 / 72) });
  text(data.grade, nameX, y + 10 + nameLines.length * nameLineHeight, 9, true, colors.muted);
  const statusLabel = `Status: ${data.status} Active`;
  setText(8, true);
  const statusWidth = pdf.getTextWidth(statusLabel) + 8;
  const statusX = pageWidth - margin - statusWidth - 4;
  box(statusX, avatarY - 4, statusWidth, 8, statusTheme.background, statusTheme.border, 2.5);
  text(statusLabel, statusX + 4, avatarY - 1.7, 8, true, statusTheme.text);
  y += identityHeight + 4;

  const cards = [
    { value: data.counts.red, title: 'Red Incidents', subtitle: 'Urgent interventions', theme: colors.red, symbol: '!' },
    { value: data.counts.yellow, title: 'Yellow Incidents', subtitle: 'Moderate concerns', theme: colors.yellow, symbol: '!' },
    { value: data.counts.superGreen, title: 'Super Green', subtitle: 'Positive recognitions', theme: colors.green, symbol: '' },
  ];
  const cardWidth = (width - 6) / 3;
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3);
    box(x, y, cardWidth, 23, card.theme.background, card.theme.border);
    pdf.setFillColor(card.theme.icon);
    pdf.circle(x + 9, y + 11.5, 5.5, 'F');
    if (card.symbol) {
      setText(14, true, card.theme.text);
      pdf.text(card.symbol, x + 9, y + 11.5, { align: 'center', baseline: 'middle' });
    } else {
      pdf.setDrawColor(card.theme.text);
      pdf.setLineWidth(0.6);
      pdf.line(x + 6.5, y + 11.5, x + 8.3, y + 13.3);
      pdf.line(x + 8.3, y + 13.3, x + 11.5, y + 9.4);
    }
    text(String(card.value), x + 17, y + 1.5, 16, true, card.theme.text);
    text(`${card.title} (${data.countPeriodLabel})`, x + 17, y + 10.5, 7.5, true);
    text(card.subtitle, x + 17, y + 15.5, 7.5, false, card.theme.text);
  });
  y += 28;

  const nextPage = () => {
    pdf.addPage();
    y = margin;
  };
  const sectionHeading = (title: string) => {
    text(title, margin + 3, y, 11, true);
    y += 6;
    const labelLines = wrap(`${data.period}  |  ${data.subject}`, width - 6, 8);
    text(labelLines, margin + 3, y, 8, false, colors.muted);
    y += labelLines.length * lineHeight + 3;
  };
  const columnWidths = [width * 0.11, width * 0.21, width * 0.41, width * 0.27];
  const columnStarts = [margin];
  columnWidths.slice(0, -1).forEach((w) => columnStarts.push(columnStarts[columnStarts.length - 1] + w));
  const historyHeader = (continued: boolean) => {
    sectionHeading(continued ? 'Student History (continued)' : 'Student History');
    box(margin, y, width, 8, '#f8fafc', '#f8fafc', 1.5);
    ['Date', 'Incident Level', 'Description', 'Category/Class'].forEach((label, index) => {
      text(label, columnStarts[index] + 3, y + 2.2, 8, true, colors.muted);
    });
    y += 8;
  };
  historyHeader(false);
  const freshHistoryY = y - identityHeight - 4 - 28;

  for (const row of data.history) {
    const theme = themeFor(row.signalType);
    let cells = [
      wrap(row.date, columnWidths[0] - 6),
      wrap(capitalize(row.level), columnWidths[1] - 11, 8, true),
      wrap(row.description, columnWidths[2] - 6),
      wrap(row.className, columnWidths[3] - 6),
    ];
    let continued = false;
    while (cells.some((cell) => cell.length)) {
      let lineCount = Math.max(...cells.map((cell) => cell.length));
      const rowHeight = Math.max(8, lineCount * lineHeight + 4);
      // Move normal rows intact; split unusually long entries only at text lines.
      if (y + rowHeight > bottom && y > freshHistoryY + 0.1) {
        nextPage();
        historyHeader(true);
      }
      lineCount = Math.min(lineCount, Math.max(1, Math.floor((bottom - y - 4) / lineHeight)));
      const height = Math.max(8, lineCount * lineHeight + 4);
      const levelLines = cells[1].slice(0, lineCount);
      if (levelLines.length) {
        box(columnStarts[1] + 6, y + 1.5, columnWidths[1] - 9, Math.max(5, levelLines.length * lineHeight + 1), theme.background, theme.border, 1.8);
        pdf.setFillColor(theme.text);
        pdf.roundedRect(columnStarts[1] + 2, y + 3.5, 2, 0.8, 0.4, 0.4, 'F');
      }
      cells.forEach((cell, index) => {
        const lines = cell.slice(0, lineCount);
        if (lines.length) text(lines, columnStarts[index] + (index === 1 ? 8 : 3), y + 2, index === 1 ? 8 : fontSize, index === 1, index === 1 ? theme.text : colors.muted);
      });
      if (continued && !cells[0].length) text('(cont.)', margin + 3, y + 2, 7, false, colors.muted);
      pdf.setDrawColor(colors.border);
      pdf.setLineWidth(0.15);
      pdf.line(margin, y + height, margin + width, y + height);
      y += height;
      cells = cells.map((cell) => cell.slice(lineCount));
      continued = true;
    }
  }
  if (!data.history.length) text('No flags in the selected period', margin + 3, y + 4, 9, false, colors.muted);

  if (data.notes) {
    nextPage();
    sectionHeading('Teachers Notes');
    const notesStartY = y;
    if (!data.notes.length) text('No notes recorded for this student.', margin + 3, y + 2, 9, false, colors.muted);
    for (const note of data.notes) {
      let lines = wrap(note.text, width - 8);
      let continued = false;
      while (lines.length) {
        const meta = wrap([note.date, note.className, continued ? 'continued' : ''].filter(Boolean).join('  |  '), width - 8, 8);
        const metaHeight = meta.length * lineHeight;
        const height = 6 + metaHeight + lines.length * lineHeight;
        if (y + height > bottom && y > notesStartY + 0.1) {
          nextPage();
          sectionHeading('Teachers Notes (continued)');
        }
        const count = Math.min(lines.length, Math.max(1, Math.floor((bottom - y - 6 - metaHeight) / lineHeight)));
        const blockHeight = 6 + metaHeight + count * lineHeight;
        box(margin, y, width, blockHeight, '#f8fafc', colors.border, 2);
        text(meta, margin + 4, y + 2.5, 8, false, colors.muted);
        text(lines.slice(0, count), margin + 4, y + 3 + metaHeight);
        lines = lines.slice(count);
        y += blockHeight + 3;
        continued = true;
      }
    }
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    text('EarlyFlag - Student Report', margin, pageHeight - 8, 7, false, colors.muted);
    setText(7, false, colors.muted);
    pdf.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, { align: 'right', baseline: 'top' });
  }
  return pdf;
}
