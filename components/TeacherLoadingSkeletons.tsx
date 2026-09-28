import type { ReactNode } from 'react';

export const TeacherSkeletonLine = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-[#2e3240] ${className}`} />
);

const SkeletonCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#2e3240] dark:bg-[#1a1d27] ${className}`}>
    {children}
  </div>
);

const BackButtonSkeleton = () => <TeacherSkeletonLine className="h-9 w-36 rounded-full" />;

const PageHeadingSkeleton = ({ action = false }: { action?: boolean }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <TeacherSkeletonLine className="h-8 w-44" />
      <TeacherSkeletonLine className="mt-3 h-3 w-72 max-w-full" />
    </div>
    {action && <TeacherSkeletonLine className="h-10 w-32 rounded-lg" />}
  </div>
);

export function TeacherPageSkeleton({ label = 'Loading teacher page' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <BackButtonSkeleton />
      <PageHeadingSkeleton action />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(card => (
          <SkeletonCard key={card} className="p-5">
            <TeacherSkeletonLine className="h-12 w-12 rounded-full" />
            <TeacherSkeletonLine className="mt-4 h-4 w-2/3" />
            <TeacherSkeletonLine className="mt-2 h-3 w-1/3" />
          </SkeletonCard>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TeacherClassesSkeleton({ label = 'Loading classes' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12" aria-label={label} role="status">
      <BackButtonSkeleton />
      <PageHeadingSkeleton action />
      {[1, 2].map(group => (
        <section key={group}>
          <div className="mb-4 flex items-center justify-between">
            <TeacherSkeletonLine className="h-6 w-24" />
            <TeacherSkeletonLine className="h-3 w-16" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(card => (
              <SkeletonCard key={card} className="p-4">
                <TeacherSkeletonLine className="h-12 w-12 rounded-full" />
                <TeacherSkeletonLine className="mt-4 h-4 w-2/3" />
                <TeacherSkeletonLine className="mt-2 h-3 w-1/3" />
              </SkeletonCard>
            ))}
          </div>
        </section>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TeacherStudentListSkeleton({
  compact = false,
  label = 'Loading students',
}: {
  compact?: boolean;
  label?: string;
}) {
  const rows = compact ? 4 : 6;

  return (
    <div className={compact ? 'space-y-3' : 'mx-auto max-w-6xl space-y-6 pb-12'} aria-label={label} role="status">
      {!compact && (
        <>
          <BackButtonSkeleton />
          <PageHeadingSkeleton action />
          <TeacherSkeletonLine className="h-11 w-full max-w-2xl rounded-full" />
        </>
      )}
      <SkeletonCard className={compact ? 'overflow-hidden' : 'overflow-hidden p-8'}>
        {!compact && (
          <div className="mb-6">
            <TeacherSkeletonLine className="h-6 w-48" />
            <TeacherSkeletonLine className="mt-2 h-3 w-20" />
          </div>
        )}
        <div className={compact ? 'divide-y divide-gray-100 dark:divide-[#2e3240]' : 'space-y-3'}>
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className={`flex items-center justify-between gap-4 ${compact ? 'px-4 py-3' : 'rounded-xl border border-gray-100 p-3 dark:border-[#2e3240]'}`}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <TeacherSkeletonLine className="h-11 w-11 shrink-0 rounded-full" />
                <div className="w-full max-w-xs">
                  <TeacherSkeletonLine className="h-3.5 w-2/3" />
                  <TeacherSkeletonLine className="mt-2 h-2.5 w-1/3" />
                </div>
              </div>
              <div className="flex gap-2">
                <TeacherSkeletonLine className="h-8 w-16 rounded-lg" />
                <TeacherSkeletonLine className="hidden h-8 w-20 rounded-lg sm:block" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TeacherStudentProfileSkeleton({ label = 'Loading student profile' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12" aria-label={label} role="status">
      <div className="flex items-center justify-between gap-4">
        <BackButtonSkeleton />
        <div className="hidden gap-3 md:flex">
          {[1, 2, 3].map(button => <TeacherSkeletonLine key={button} className="h-9 w-28 rounded-lg" />)}
        </div>
      </div>
      <SkeletonCard className="flex items-center justify-between p-8">
        <div className="flex items-center gap-6">
          <TeacherSkeletonLine className="h-24 w-24 rounded-full" />
          <div>
            <TeacherSkeletonLine className="h-7 w-48" />
            <TeacherSkeletonLine className="mt-3 h-3 w-24" />
          </div>
        </div>
        <TeacherSkeletonLine className="hidden h-9 w-28 rounded-xl sm:block" />
      </SkeletonCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <TeacherSkeletonLine className="h-5 w-40" />
          {[1, 2, 3].map(card => (
            <SkeletonCard key={card} className="p-6">
              <TeacherSkeletonLine className="h-8 w-8 rounded-full" />
              <TeacherSkeletonLine className="mt-5 h-9 w-14" />
              <TeacherSkeletonLine className="mt-3 h-3.5 w-40" />
              <TeacherSkeletonLine className="mt-2 h-2.5 w-28" />
            </SkeletonCard>
          ))}
        </div>
        <div className="space-y-4 lg:col-span-7">
          <TeacherSkeletonLine className="h-5 w-36" />
          <SkeletonCard className="h-[460px] p-6">
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="mb-6 flex gap-4 last:mb-0">
                <TeacherSkeletonLine className="h-3 w-16 shrink-0" />
                <div className="flex-1"><TeacherSkeletonLine className="h-3.5 w-2/3" /><TeacherSkeletonLine className="mt-2 h-3 w-full" /></div>
              </div>
            ))}
          </SkeletonCard>
        </div>
      </div>
      <SkeletonCard className="p-6">
        <TeacherSkeletonLine className="h-5 w-32" />
        <TeacherSkeletonLine className="mt-5 h-3 w-full" />
        <TeacherSkeletonLine className="mt-3 h-3 w-4/5" />
      </SkeletonCard>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TeacherSettingsSkeleton({ label = 'Loading settings' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-8" aria-label={label} role="status">
      <div><TeacherSkeletonLine className="h-8 w-36" /><TeacherSkeletonLine className="mt-3 h-3 w-72 max-w-full" /></div>
      {[1, 2].map(section => (
        <SkeletonCard key={section} className="overflow-hidden">
          <div className="border-b border-gray-200 p-5 dark:border-[#2e3240]"><TeacherSkeletonLine className="h-5 w-32" /></div>
          <div className="space-y-4 p-6"><TeacherSkeletonLine className="h-3 w-28" /><TeacherSkeletonLine className="h-11 w-full rounded-xl" /></div>
        </SkeletonCard>
      ))}
      <TeacherSkeletonLine className="ml-auto h-10 w-32 rounded-xl" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function TeacherTableRowsSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true" className="border-b border-gray-100 last:border-b-0 dark:border-[#2e3240]">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column} className="px-4 py-4">
              <TeacherSkeletonLine className={`h-3 ${column === 0 ? 'w-28' : 'mx-auto w-8'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
