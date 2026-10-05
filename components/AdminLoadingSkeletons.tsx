import type { ReactNode } from 'react';

export const AdminSkeletonLine = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-[#2e3240] ${className}`} />
);

const SkeletonCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722] ${className}`}>
    {children}
  </div>
);

const LoadingLabel = () => <span className="sr-only">Loading</span>;

const BackButtonSkeleton = () => <AdminSkeletonLine className="h-9 w-40 rounded-full" />;

const PageHeadingSkeleton = ({ action = false }: { action?: boolean }) => (
  <div className="flex items-end justify-between gap-4">
    <div className="min-w-0">
      <AdminSkeletonLine className="h-8 w-48 max-w-full" />
      <AdminSkeletonLine className="mt-3 h-3 w-72 max-w-full" />
    </div>
    {action && <AdminSkeletonLine className="h-10 w-32 shrink-0 rounded-lg" />}
  </div>
);

const MetricCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${count > 3 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <AdminSkeletonLine className="h-3 w-24" />
            <AdminSkeletonLine className="mt-4 h-8 w-16" />
            <AdminSkeletonLine className="mt-3 h-2.5 w-32 max-w-full" />
          </div>
          <AdminSkeletonLine className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </SkeletonCard>
    ))}
  </div>
);

export function AdminTableSkeleton({
  rows = 5,
  columns = 6,
  footer = false,
  className = '',
}: {
  rows?: number;
  columns?: number;
  footer?: boolean;
  className?: string;
}) {
  return (
    <SkeletonCard className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-[#262a3d] dark:bg-[#1b1e2c]">
            <tr>
              {Array.from({ length: columns }, (_, column) => (
                <th key={column} className="px-4 py-4 text-left">
                  <AdminSkeletonLine className={`h-2.5 ${column === 0 ? 'w-16' : 'w-20'}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }, (_, column) => (
                  <td key={column} className="px-4 py-4">
                    {column === 0 ? (
                      <div className="flex items-center gap-3">
                        <AdminSkeletonLine className="h-9 w-9 shrink-0 rounded-full" />
                        <div className="w-full">
                          <AdminSkeletonLine className="h-3 w-3/4" />
                          <AdminSkeletonLine className="mt-2 h-2.5 w-1/2" />
                        </div>
                      </div>
                    ) : (
                      <AdminSkeletonLine className={`h-3 ${column === columns - 1 ? 'ml-auto w-16 rounded-full' : 'w-2/3'}`} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-[#262a3d]">
          <AdminSkeletonLine className="h-3 w-36" />
          <div className="flex gap-2">
            <AdminSkeletonLine className="h-8 w-20 rounded-lg" />
            <AdminSkeletonLine className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      )}
    </SkeletonCard>
  );
}

export function AdminWorkspaceSkeleton({ label = 'Loading admin workspace' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <PageHeadingSkeleton action />
      <MetricCardsSkeleton count={4} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><AdminTableSkeleton rows={5} columns={5} /></div>
        <SkeletonCard className="p-5">
          <AdminSkeletonLine className="h-5 w-40" />
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="mt-5 flex items-center gap-3">
              <AdminSkeletonLine className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1"><AdminSkeletonLine className="h-3 w-3/4" /><AdminSkeletonLine className="mt-2 h-2.5 w-1/2" /></div>
            </div>
          ))}
        </SkeletonCard>
      </div>
      <LoadingLabel />
    </div>
  );
}

export function AdminClassesSkeleton({ label = 'Loading classes' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-12" aria-label={label} role="status">
      <BackButtonSkeleton />
      <PageHeadingSkeleton />
      {[1, 2, 3].map(group => (
        <section key={group}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <AdminSkeletonLine className="h-7 w-28" />
            <AdminSkeletonLine className="h-7 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(card => (
              <SkeletonCard key={card} className="flex items-center gap-4 p-5">
                <AdminSkeletonLine className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1"><AdminSkeletonLine className="h-3.5 w-2/3" /><AdminSkeletonLine className="mt-2 h-3 w-1/3" /></div>
              </SkeletonCard>
            ))}
          </div>
        </section>
      ))}
      <LoadingLabel />
    </div>
  );
}

export function AdminClassRosterSkeleton({ label = 'Loading class roster' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-12" aria-label={label} role="status">
      <BackButtonSkeleton />
      <PageHeadingSkeleton />
      <MetricCardsSkeleton count={4} />
      <AdminSkeletonLine className="h-11 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, card) => (
          <SkeletonCard key={card} className="border-l-4 p-5">
            <div className="flex items-center gap-4">
              <AdminSkeletonLine className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1"><AdminSkeletonLine className="h-4 w-2/3" /><AdminSkeletonLine className="mt-2 h-3 w-1/3" /></div>
              <AdminSkeletonLine className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-5 flex gap-2"><AdminSkeletonLine className="h-7 w-20 rounded-lg" /><AdminSkeletonLine className="h-7 w-20 rounded-lg" /></div>
          </SkeletonCard>
        ))}
      </div>
      <LoadingLabel />
    </div>
  );
}

export function AdminStudentProfileSkeleton({ label = 'Loading student profile' }: { label?: string }) {
  return (
    <div className="space-y-6" aria-label={label} role="status" aria-busy="true">
      <div aria-hidden="true" className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <AdminSkeletonLine className="mt-1 h-10 w-10 shrink-0 rounded-lg" />
          <div>
            <AdminSkeletonLine className="h-9 w-56 max-w-full" />
            <div className="mt-1 flex items-center gap-3">
              <AdminSkeletonLine className="h-5 w-16" />
              <AdminSkeletonLine className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 pt-1 md:pt-0">
          <div className="flex flex-wrap items-end gap-3">
            {['w-52', 'w-36', 'w-36'].map((width, index) => (
              <div key={index}>
                <AdminSkeletonLine className="h-4 w-10" />
                <AdminSkeletonLine className={`mt-1 h-10 rounded-lg ${width}`} />
              </div>
            ))}
            <AdminSkeletonLine className="h-10 w-20 rounded-lg" />
          </div>
          <AdminSkeletonLine className="h-10 w-36 rounded-lg" />
          <AdminSkeletonLine className="h-10 w-44 rounded-lg" />
        </div>
      </div>

      <div aria-hidden="true" className="space-y-6">
        <SkeletonCard>
          <div className="p-5">
            <AdminSkeletonLine className="h-7 w-56 max-w-full" />
            <AdminSkeletonLine className="mt-1 h-4 w-96 max-w-full" />
            <AdminSkeletonLine className="mt-1 h-4 w-64 max-w-full" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="border-y border-gray-100 bg-gray-50/50 dark:border-[#262a3d] dark:bg-[#1b1e2c]">
                <tr>
                  <th className="px-5 py-3"><AdminSkeletonLine className="h-4 w-28" /></th>
                  {[1, 2, 3, 4, 5].map(column => <th key={column} className="px-3 py-3"><AdminSkeletonLine className="mx-auto h-4 w-12" /></th>)}

                  <th className="px-5 py-3"><AdminSkeletonLine className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
                {[1, 2, 3, 4].map(row => (
                  <tr key={row}>
                    <td className="px-5 py-3"><AdminSkeletonLine className="h-5 w-28" /><AdminSkeletonLine className="mt-1 h-4 w-20" /></td>
                    {[1, 2, 3, 4, 5].map(column => <td key={column} className="px-3 py-3"><AdminSkeletonLine className="mx-auto h-6 w-9 rounded-md" /></td>)}

                    <td className="px-5 py-3"><AdminSkeletonLine className="ml-auto h-4 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 p-5 dark:border-[#262a3d]"><AdminSkeletonLine className="h-4 w-full max-w-3xl" /></div>
        </SkeletonCard>

        <SkeletonCard className="overflow-hidden mb-6">
          <div className="flex items-center gap-2 border-b border-gray-200 p-4 dark:border-[#262a3d]">
            <AdminSkeletonLine className="h-4 w-4" />
            <AdminSkeletonLine className="h-5 w-28" />
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-[#262a3d]">
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="grid grid-cols-1 gap-2 p-4 lg:grid-cols-[5rem_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_10rem] lg:items-center lg:gap-4">
                <div><AdminSkeletonLine className="h-5 w-12" /><AdminSkeletonLine className="mt-1 h-4 w-8" /></div>
                <AdminSkeletonLine className="h-4 w-28 max-w-full" />
                <AdminSkeletonLine className="h-4 w-48 max-w-full" />
                <AdminSkeletonLine className="h-4 w-36 max-w-full" />
                <AdminSkeletonLine className="h-7 w-32 rounded-full lg:justify-self-end" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
      <LoadingLabel />
    </div>
  );
}

export function AdminRankingSkeleton({ mode, label }: { mode: 'at-risk' | 'improving'; label?: string }) {
  const columns = mode === 'at-risk' ? 7 : 4;
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label || `Loading ${mode} students`} role="status">
      <div className="flex items-center justify-between gap-4"><BackButtonSkeleton /><AdminSkeletonLine className="h-10 w-28 rounded-lg" /></div>
      <PageHeadingSkeleton />
      <AdminTableSkeleton rows={7} columns={columns} footer />
      <LoadingLabel />
    </div>
  );
}

export function AdminInactiveTeachersSkeleton({ label = 'Loading inactive teachers' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <BackButtonSkeleton />
      <PageHeadingSkeleton action />
      <MetricCardsSkeleton count={3} />
      <AdminTableSkeleton rows={6} columns={5} />
      <LoadingLabel />
    </div>
  );
}

export function AdminLeaderboardSkeleton({ label = 'Loading teacher leaderboard' }: { label?: string }) {
  return (
    <div className="space-y-6 pb-12" aria-label={label} role="status">
      <SkeletonCard className="p-6">
        <BackButtonSkeleton />
        <div className="mt-3"><AdminSkeletonLine className="h-7 w-72 max-w-full" /><AdminSkeletonLine className="mt-3 h-3 w-96 max-w-full" /></div>
      </SkeletonCard>
      <AdminTableSkeleton rows={6} columns={4} />
      <LoadingLabel />
    </div>
  );
}

export function AdminSchoolOverviewSkeleton({ label = 'Loading school overview' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <PageHeadingSkeleton action />
      <MetricCardsSkeleton count={4} />
      <div className="flex gap-2"><AdminSkeletonLine className="h-10 w-36 rounded-lg" /><AdminSkeletonLine className="h-10 w-36 rounded-lg" /></div>
      <AdminTableSkeleton rows={7} columns={9} />
      <LoadingLabel />
    </div>
  );
}

export function AdminSettingsSkeleton({ label = 'Loading settings' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-8" aria-label={label} role="status">
      <PageHeadingSkeleton />
      {[1, 2].map(section => (
        <SkeletonCard key={section} className="overflow-hidden">
          <div className="border-b border-gray-200 p-5 dark:border-[#262a3d]"><AdminSkeletonLine className="h-5 w-32" /></div>
          <div className="space-y-4 p-6"><AdminSkeletonLine className="h-3 w-32" /><AdminSkeletonLine className="h-11 w-full rounded-xl" /></div>
        </SkeletonCard>
      ))}
      <AdminSkeletonLine className="ml-auto h-10 w-32 rounded-xl" />
      <LoadingLabel />
    </div>
  );
}

export function AdminTeacherCardsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading teachers">
      {Array.from({ length: rows }, (_, card) => (
        <SkeletonCard key={card} className="p-5">
          <div className="flex items-start gap-4">
            <AdminSkeletonLine className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1"><AdminSkeletonLine className="h-4 w-2/3" /><AdminSkeletonLine className="mt-2 h-3 w-1/2" /></div>
            <AdminSkeletonLine className="h-6 w-16 rounded-full" />
          </div>
          <AdminSkeletonLine className="mt-5 h-3 w-full" />
          <AdminSkeletonLine className="mt-2 h-3 w-4/5" />
          <div className="mt-5 flex justify-end gap-2"><AdminSkeletonLine className="h-9 w-20 rounded-lg" /><AdminSkeletonLine className="h-9 w-20 rounded-lg" /></div>
        </SkeletonCard>
      ))}
      <LoadingLabel />
    </div>
  );
}

export function AdminTeachersSkeleton({ label = 'Loading teacher management' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <PageHeadingSkeleton action />
      <MetricCardsSkeleton count={3} />
      <div className="flex gap-3 border-b border-gray-200 pb-3 dark:border-[#262a3d]">
        {[1, 2, 3].map(tab => <AdminSkeletonLine key={tab} className="h-8 w-32 rounded-lg" />)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row"><AdminSkeletonLine className="h-11 flex-1 rounded-xl" /><AdminSkeletonLine className="h-11 w-40 rounded-xl" /></div>
      <AdminTeacherCardsSkeleton rows={6} />
      <LoadingLabel />
    </div>
  );
}

export function AdminReportTableSkeleton({
  rows = 5,
  columns = 6,
  summary = false,
}: {
  rows?: number;
  columns?: number;
  summary?: boolean;
}) {
  return (
    <div className="space-y-5" role="status" aria-label="Loading report data">
      {summary && (
        <SkeletonCard className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div><AdminSkeletonLine className="h-5 w-44" /><AdminSkeletonLine className="mt-3 h-3 w-72 max-w-full" /></div>
          <AdminSkeletonLine className="h-11 w-36 rounded-lg" />
        </SkeletonCard>
      )}
      <AdminTableSkeleton rows={rows} columns={columns} />
      <LoadingLabel />
    </div>
  );
}
