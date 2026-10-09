import { Bell } from 'lucide-react';
import type { AdminReportPdfData } from '@/lib/studentReportPdf';
import { reportCategoryCounts } from '@/lib/reportPresentation';
import StudentReportHistory from '@/components/StudentReportHistory';

/** The printable report body shared by teacher and admin previews. */
export default function StudentReportDocument({ data }: { data: AdminReportPdfData }) {
  const classReport = data.kind === 'class';
  const categories = data.categories || reportCategoryCounts(data.history);
  const cards = [
    { label: 'Super Green', value: data.counts.superGreen, style: 'border-emerald-100 bg-emerald-50/70', color: 'text-emerald-600' },
    { label: 'Yellow Incidents', value: data.counts.yellow, style: 'border-amber-100 bg-amber-50/70', color: 'text-amber-500', behavioral: categories.yellowBehavioral, academic: categories.yellowAcademic },
    { label: 'Red Incidents', value: data.counts.red, style: 'border-rose-100 bg-rose-50/80', color: 'text-red-600', behavioral: categories.redBehavioral, academic: categories.redAcademic },
  ];
  return <article className="report-print-area mx-auto w-full max-w-[1100px] space-y-6 rounded-xl bg-white p-4 font-[Arial,sans-serif] text-[#10133d] sm:p-7 print:p-0">
    <header className="relative flex items-center gap-4 rounded-lg border border-[#dce5ef] px-4 py-5 sm:gap-6 sm:px-6">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-[#52617c] sm:h-20 sm:w-20">{data.initials}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <p className="text-xs font-medium text-[#496b9e]">{classReport ? 'CLASS REPORT' : 'STUDENT REPORT'}</p>
          <p className="text-xs font-semibold sm:text-sm">{data.dateRange}</p>
        </div>
        <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-4xl">{data.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#496b9e]">
          {classReport && <><strong className="text-base text-[#10133d] sm:text-lg">{data.subject}</strong><span aria-hidden="true" className="text-slate-300">|</span></>}
          <span>{data.grade}</span>
          {classReport ? data.teacherName && <><span aria-hidden="true" className="text-slate-300">|</span><span>{data.teacherName}</span></> : <>
            {data.studentId && <><span aria-hidden="true" className="text-slate-300">|</span><span className="break-all">{data.studentId}</span></>}
            <span aria-hidden="true" className="text-slate-300">|</span><strong className="text-base text-[#10133d]">{data.subject}</strong>
          </>}
        </div>
      </div>
    </header>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {cards.map(card => <section key={card.label} className={`rounded-lg border px-4 py-4 ${card.style}`}>
        <div className="flex items-center gap-4">
          <strong className={`border-r border-slate-200 pr-4 text-4xl leading-none sm:text-5xl ${card.color}`}>{card.value}</strong>
          <h2 className="text-base font-bold leading-tight">{card.label}</h2>
        </div>
        <div className="mt-3 border-t border-slate-200/70 pt-3">
          {card.behavioral === undefined ? <p className="text-sm text-[#496b9e]">Positive recognitions</p> : <div className="grid grid-cols-2 divide-x divide-slate-200 text-center">
            <div><strong className={`block text-2xl leading-tight ${card.color}`}>{card.behavioral}</strong><span className="text-sm text-[#496b9e]">Behavioral</span></div>
            <div><strong className={`block text-2xl leading-tight ${card.color}`}>{card.academic}</strong><span className="text-sm text-[#496b9e]">Academic</span></div>
          </div>}
        </div>
      </section>)}
    </div>

    {!classReport && !!data.crossClassAlerts?.length && <aside className="space-y-4 rounded-lg border border-violet-100 bg-violet-50/80 p-4">
      {data.crossClassAlerts.map((alert, index) => <div key={index} className="flex flex-col gap-4 lg:flex-row">
        <div className="flex gap-3 lg:w-[42%] lg:shrink-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600"><Bell size={25} fill="currentColor" /></span>
          <div><h2 className="text-xl font-bold">{index === 0 ? `${data.crossClassAlerts!.length} Cross-Class ${data.crossClassAlerts!.length === 1 ? 'Alert' : 'Alerts'}` : `Cross-Class Alert · ${alert.date}`}</h2>
            <p className="mt-1 text-sm leading-snug text-[#496b9e]">{alert.description}</p>
          </div>
        </div>
        {alert.items?.length ? <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {alert.items.map((item, i) => <div key={i} className="border-l border-violet-200 pl-3 text-xs leading-relaxed">
            <p className="flex items-start gap-2 font-semibold"><span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-400" />{item.title || 'Yellow incident'}</p>
            <p className="mt-1 pl-5">{item.className}</p><p className="pl-5 text-[#496b9e]">{item.date}{item.inferred ? ' (inferred)' : ''}</p>
          </div>)}
        </div> : alert.contributions && <p className="text-sm text-[#496b9e]">{alert.contributions}</p>}
      </div>)}
    </aside>}

    {classReport && <section>
      <h2 className="text-xl font-bold sm:text-2xl">{data.subject} Attendance</h2>
      <p className="mt-1 text-sm text-[#496b9e]">Recorded class signals for {data.dateRange}; not a school-wide attendance total.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[{ label: 'Present', value: data.counts.present, detail: 'Days in class', style: 'border-emerald-100 bg-emerald-50/70', color: 'text-emerald-600' }, { label: 'Absent', value: data.counts.absent, detail: 'Days absent', style: 'border-[#dce5ef] bg-[#f4f8fc]', color: 'text-[#52617c]' }].map(card => <div key={card.label} className={`flex items-center gap-6 rounded-lg border px-6 py-5 ${card.style}`}>
          <strong className={`border-r border-slate-200 pr-6 text-5xl ${card.color}`}>{card.value}</strong>
          <div><h3 className="text-lg font-bold">{card.label}</h3><p className="mt-1 text-sm text-[#496b9e]">{card.detail}</p></div>
        </div>)}
      </div>
    </section>}

    {!classReport && data.classSnapshot && <section>
      <h2 className="text-2xl font-bold sm:text-3xl">Class Snapshot</h2><p className="mb-2 mt-1 text-sm text-[#496b9e]">{data.classSnapshot.range}</p>
      <div className="overflow-x-auto rounded-md border border-[#dce5ef]"><table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-[#f4f8fc] text-xs text-[#496b9e]"><tr>{['Subject / Teacher', 'Super Green', 'Present', 'Absent', 'Yellow', 'Red'].map((label, i) => <th key={label} className={`px-4 py-2 font-medium ${i ? 'text-center' : ''} ${i === 1 ? 'text-emerald-600' : i === 4 ? 'text-amber-500' : i === 5 ? 'text-red-600' : ''}`}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#e5ebf3]">{data.classSnapshot.rows.map((row, index) => <tr key={index}>
          <th className="px-4 py-2 font-semibold">{row.className}<span className="block font-normal text-[#496b9e]">{row.teacherName}</span></th>
          {[row.superGreen, row.present, row.absent, row.yellow, row.red].map((value, i) => <td key={i} className={`px-4 py-2 text-center text-base font-semibold ${['text-emerald-600', 'text-[#52617c]', 'text-blue-600', 'text-amber-500', 'text-red-600'][i]}`}>{value}</td>)}
        </tr>)}</tbody>
      </table></div>
      {!data.classSnapshot.rows.length && <p className="py-4 text-sm text-[#496b9e]">No active classes match this report.</p>}
      <p className="mt-2 text-xs text-[#496b9e]">Present and Absent are recorded class signals, not verified days attended.</p>
    </section>}

    <section className={classReport ? 'pt-2' : 'border-t border-[#dce5ef] pt-4'}>
      <h2 className={`font-bold ${classReport ? 'text-xl sm:text-2xl' : 'mb-3 text-2xl sm:text-3xl'}`}>Student History{classReport ? ` - ${data.subject}` : ''}</h2>
      {classReport && <p className="mb-3 mt-1 text-sm text-[#496b9e]">{data.dateRange}{data.teacherName ? ` | ${data.teacherName}` : ''}</p>}
      <StudentReportHistory rows={data.history} grouped={!classReport} includeNotes={data.includeNotes !== false} reportStyle dateRange={data.dateRange} />
    </section>
    <footer className="pt-4 text-xs text-[#496b9e]">EarlyFlag – {classReport ? 'Class Report' : 'Student Report'}</footer>
  </article>;
}
