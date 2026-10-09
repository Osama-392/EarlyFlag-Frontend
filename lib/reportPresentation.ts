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
  category?: string;
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
      typeLabel: category ? `${type} · ${category}` : type, signalType, category: flag.category,
    };
  });
}

export function reportCategoryCounts(rows: HistoryRow[]) {
  const counts = { yellowBehavioral: 0, yellowAcademic: 0, redBehavioral: 0, redAcademic: 0 };
  for (const row of rows) {
    const category = row.category || row.typeLabel.toLowerCase().match(/academic|behavioral/)?.[0];
    if (row.signalType === 'yellow' && category === 'behavioral') counts.yellowBehavioral++;
    if (row.signalType === 'yellow' && category === 'academic') counts.yellowAcademic++;
    if (row.signalType === 'red' && category === 'behavioral') counts.redBehavioral++;
    if (row.signalType === 'red' && category === 'academic') counts.redAcademic++;
  }
  return counts;
}

interface ReportConcernSource {
  signal_id?: string; class_id?: string; class_name?: string; signal_date?: string;
  signal_type?: string; reason_description?: string; title?: string; reason?: string;
  is_inferred?: boolean;
}

export function reportCrossClassAlerts(alerts: Array<{
  occurred_on?: string; contributions?: ReportConcernSource[];
}>, history: ReportConcernSource[]) {
  const concern = (row: ReportConcernSource) => [row.reason_description, row.title, row.reason]
    .find(value => typeof value === 'string' && value.trim() && !/^yellow incident$/i.test(value.trim()))?.trim() || '';
  return alerts.map(alert => {
    const contributions = alert.contributions || [];
    const classCount = new Set(contributions.map(item => item.class_id || item.class_name).filter(Boolean)).size;
    return {
      date: reportDate(alert.occurred_on),
      description: `Yellow incidents occurred ${classCount > 1 ? `in ${classCount} different classes` : 'across different classes'} within a 7-day period.`,
      items: contributions.map(item => {
        // Older report responses omit concern text. Only use history when it
        // identifies one concern; the combined escalation description is sorted
        // alphabetically and cannot safely be paired with classes by position.
        const matches = history.filter(row => row.signal_type === 'yellow' && (item.signal_id
          ? row.signal_id === item.signal_id
          : Boolean(item.signal_date && (item.class_id || item.class_name))
            && (item.class_id ? row.class_id === item.class_id : row.class_name === item.class_name)
            && row.signal_date?.slice(0, 10) === item.signal_date?.slice(0, 10)));
        const matchingConcerns = [...new Set(matches.map(concern).filter(Boolean))];
        return {
          title: concern(item) || (matchingConcerns.length === 1 ? matchingConcerns[0] : ''),
          className: item.class_name || 'Class', date: reportDate(item.signal_date), inferred: Boolean(item.is_inferred),
        };
      }),
      contributions: contributions.map(item => `${item.class_name || 'Class'} ${reportDate(item.signal_date)}${item.is_inferred ? ' (inferred)' : ''}`).join(' + '),
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
