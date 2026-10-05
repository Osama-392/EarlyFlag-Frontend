export interface HistoryRow {
  classId?: string;
  date: string;
  dayOfWeek: string;
  title: string;
  description: string;
  className: string;
  teacherName: string;
  typeLabel: string;
  signalType: string;
}

export function reportDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export function reportHistory(flags: any[], includeNotes = true, start?: string, end?: string): HistoryRow[] {
  return flags.filter(flag => {
    const day = String(flag.signal_date || flag.created_at || '').slice(0, 10);
    return (!start || day >= start) && (!end || day <= end);
  }).map(flag => {
    const signalType = String(flag.signal_type || '').toLowerCase();
    const type = signalType === 'super_green' || signalType === 'green' ? 'Super Green'
      : signalType.charAt(0).toUpperCase() + signalType.slice(1);
    const category = ['red', 'yellow'].includes(signalType) && ['academic', 'behavioral'].includes(flag.category)
      ? flag.category.charAt(0).toUpperCase() + flag.category.slice(1) : '';
    return {
      classId: flag.class_id, date: reportDate(flag.signal_date || flag.created_at), dayOfWeek: '',
      title: String(flag.title || flag.reason_description || 'Observation recorded'),
      description: includeNotes ? String(flag.description || flag.note || '') : '',
      className: String(flag.class_name || 'Unassigned'), teacherName: String(flag.teacher_name || ''),
      typeLabel: category ? `${type} · ${category}` : type, signalType,
    };
  });
}

export function groupReportHistory(rows: HistoryRow[]) {
  const groups = new Map<string, { key: string; className: string; teacherName: string; rows: HistoryRow[] }>();
  for (const row of rows) {
    const key = row.classId || `${row.className}:${row.teacherName}`;
    if (!groups.has(key)) groups.set(key, { key, className: row.className, teacherName: row.teacherName, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()];
}

export function scrollReportToTop(element: HTMLElement | null) {
  // Both dashboard layouts scroll their main element, rather than the window.
  for (let parent = element?.parentElement; parent; parent = parent.parentElement) {
    if (parent.scrollTop) parent.scrollTop = 0;
  }
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}
