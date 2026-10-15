'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { StudentClassSnapshot } from '@/lib/adminDashboardService';

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function AdminProfileDateFilter({ snapshot, busy, onApply }: {
  snapshot: StudentClassSnapshot;
  busy: boolean;
  onApply: (start: string, end: string) => void;
}) {
  const yearStart = snapshot.academic_year_start;
  const [preset, setPreset] = useState(() => {
    if (snapshot.range_end !== snapshot.local_today) return 'custom';
    if (snapshot.range_start === yearStart) return 'academic';
    if (snapshot.range_start === shiftDate(snapshot.local_today, -6)) return '7d';
    if (snapshot.range_start === shiftDate(snapshot.local_today, -29)) return '30d';
    return 'custom';
  });
  const [start, setStart] = useState(snapshot.range_start);
  const [end, setEnd] = useState(snapshot.range_end);
  function applyValidRange(nextStart: string, nextEnd: string) {
    if (!busy && nextStart && nextEnd && nextStart <= nextEnd) {
      onApply(nextStart, nextEnd);
    }
  }

  return <div aria-label="Profile date filter" aria-busy={busy}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Date Range
            <select value={preset} disabled={busy} onChange={(event) => {
              const value = event.target.value;
              setPreset(value);
              if (value === 'custom') return;
              const nextStart = value === 'academic' ? yearStart : shiftDate(snapshot.local_today, value === '7d' ? -6 : -29);
              setEnd(snapshot.local_today);
              setStart(nextStart);
              applyValidRange(nextStart, snapshot.local_today);
            }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]">
              <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
              <option value="academic">Academic year to date</option><option value="custom">Custom range</option>
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">From
            <input type="date" required value={start} disabled={busy} onChange={(event) => {
              const nextStart = event.target.value;
              setStart(nextStart);
              setPreset('custom');
              applyValidRange(nextStart, end);
            }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]" />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">To
            <input type="date" required value={end} min={start} disabled={busy} onChange={(event) => {
              const nextEnd = event.target.value;
              setEnd(nextEnd);
              setPreset('custom');
              applyValidRange(start, nextEnd);
            }} className="mt-1 block rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-[#262a3d]" />
          </label>
          {busy && <span role="status" className="inline-flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw size={14} className="animate-spin" /> Updating...
          </span>}
        </div>
        {start && end && start > end && <p role="alert" className="text-sm text-red-600">From must be on or before To.</p>}
  </div>;
}
