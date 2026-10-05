import { groupReportHistory, HistoryRow } from '@/lib/reportPresentation';

export default function StudentReportHistory({ rows, grouped = true, includeNotes = true }: {
  rows: HistoryRow[]; grouped?: boolean; includeNotes?: boolean;
}) {
  const groups = grouped ? groupReportHistory(rows) : [{ key: 'class', className: '', teacherName: '', rows }];
  if (!rows.length) return <p className="py-6 text-sm text-gray-500">No student history in this period.</p>;
  return <div className="space-y-4">
    {groups.map(group => <section key={group.key}>
      {grouped && <div className="flex flex-wrap items-center gap-3 rounded bg-slate-50 px-3 py-2 dark:bg-slate-800">
        <h3 className="text-sm font-semibold">{group.className}</h3>
        <span className="text-xs text-gray-500">{group.teacherName}</span>
      </div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px] text-left text-sm">
          <thead className="text-xs text-gray-500"><tr>
            <th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Incident Level</th>
            <th className="p-3 font-medium">Description</th>{includeNotes && <th className="p-3 font-medium">Teacher Note</th>}
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {group.rows.map((row, index) => <tr key={index} data-signal-type={row.signalType}>
              <td className="whitespace-nowrap p-3 align-top text-xs">{row.date}</td>
              <td className="p-3 align-top"><span className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs ${row.signalType === 'red' ? 'bg-red-50 text-red-700' : row.signalType === 'yellow' ? 'bg-amber-50 text-amber-700' : row.signalType === 'absent' ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{row.typeLabel}</span></td>
              <td className="p-3 align-top font-medium">{row.title}</td>
              {includeNotes && <td className="p-3 align-top text-gray-500">{row.description}</td>}
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>)}
  </div>;
}
