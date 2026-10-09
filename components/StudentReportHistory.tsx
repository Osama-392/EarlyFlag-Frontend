import { groupReportHistory, HistoryRow } from '@/lib/reportPresentation';

export default function StudentReportHistory({ rows, grouped = true, includeNotes = true, reportStyle = false, dateRange }: {
  rows: HistoryRow[]; grouped?: boolean; includeNotes?: boolean; reportStyle?: boolean; dateRange?: string;
}) {
  const groups = grouped ? groupReportHistory(rows) : [{ key: 'class', className: '', teacherName: '', rows }];
  if (!rows.length) return <p className="py-6 text-sm text-gray-500">No student history in this period.</p>;
  return <div className={reportStyle ? 'space-y-7' : 'space-y-4'}>
    {groups.map(group => <section key={group.key}>
      {grouped && (reportStyle ? <div className="mb-2">
        <h3 className="text-xl font-bold">{group.className}</h3>
        <p className="mt-1 text-sm text-[#496b9e]">{[dateRange, group.teacherName].filter(Boolean).join(' | ')}</p>
      </div> : <div className="flex flex-wrap items-center gap-3 rounded bg-slate-50 px-3 py-2 dark:bg-slate-800">
        <h3 className="text-sm font-semibold">{group.className}</h3>
        <span className="text-xs text-gray-500">{group.teacherName}</span>
      </div>)}
      <div className={reportStyle ? 'overflow-x-auto rounded-md border border-[#dce5ef]' : 'overflow-x-auto'}>
        <table className={`w-full min-w-[550px] text-left text-sm ${reportStyle ? 'table-fixed break-words' : ''}`}>
          {reportStyle && <colgroup><col style={{ width: '16%' }} /><col style={{ width: '23%' }} /><col style={{ width: includeNotes ? '34%' : '61%' }} />{includeNotes && <col style={{ width: '27%' }} />}</colgroup>}
          <thead className={reportStyle ? 'bg-[#f4f8fc] text-xs text-[#496b9e]' : 'text-xs text-gray-500'}><tr>
            <th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Incident Level</th>
            <th className="p-3 font-medium">Description</th>{includeNotes && <th className="p-3 font-medium">Teacher Note</th>}
          </tr></thead>
          <tbody className={reportStyle ? 'divide-y divide-[#e5ebf3]' : 'divide-y divide-gray-100 dark:divide-slate-800'}>
            {group.rows.map((row, index) => <tr key={index} data-signal-type={row.signalType}>
              <td className="whitespace-nowrap p-3 align-top text-xs">{row.date}</td>
              <td className="p-3 align-top">{reportStyle ? <span className="inline-flex items-center gap-3 text-xs"><span className={`h-3 w-3 shrink-0 rounded-full ${row.signalType === 'red' ? 'bg-red-600' : row.signalType === 'yellow' ? 'bg-amber-500' : row.signalType === 'absent' ? 'bg-slate-400' : 'bg-emerald-500'}`} />{row.typeLabel.replace('·', '-')}</span> : <span className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs ${row.signalType === 'red' ? 'bg-red-50 text-red-700' : row.signalType === 'yellow' ? 'bg-amber-50 text-amber-700' : row.signalType === 'absent' ? 'bg-slate-50 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{row.typeLabel}</span>}</td>
              <td className={`p-3 align-top ${reportStyle ? 'font-normal' : 'font-medium'}`}>{row.title}</td>
              {includeNotes && <td className={`p-3 align-top ${reportStyle ? 'text-[#496b9e]' : 'text-gray-500'}`}>{row.description || (reportStyle ? '—' : '')}</td>}
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>)}
  </div>;
}
