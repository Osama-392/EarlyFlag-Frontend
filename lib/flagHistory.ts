interface DatedFlag {
  signal_date?: string | null;
  created_at?: string | null;
}

function timestamp(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function incidentDay(flag: DatedFlag): number {
  // Signal dates represent the school's calendar day, independent of timezone.
  for (const value of [flag.signal_date, flag.created_at]) {
    const day = value && timestamp(`${value.slice(0, 10)}T00:00:00Z`);
    if (typeof day === 'number') return day;
  }
  return Number.NEGATIVE_INFINITY;
}

export function sortFlagHistory<T extends DatedFlag>(flags: readonly T[]): T[] {
  return [...flags].sort((a, b) => {
    const dayA = incidentDay(a), dayB = incidentDay(b);
    if (dayA !== dayB) return dayA > dayB ? -1 : 1;
    const timeA = timestamp(a.created_at) ?? timestamp(a.signal_date) ?? Number.NEGATIVE_INFINITY;
    const timeB = timestamp(b.created_at) ?? timestamp(b.signal_date) ?? Number.NEGATIVE_INFINITY;
    return timeA === timeB ? 0 : timeA > timeB ? -1 : 1;
  });
}
