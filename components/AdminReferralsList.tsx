'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Mail,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  acknowledgeReferral,
  AdminRedEvent,
  AdminRedFlagsResponse,
  AdminRedFlagTab,
  getAdminRedFlags,
} from '@/lib/adminService';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';

type RedFlagTotals = Pick<
  AdminRedFlagsResponse,
  'all_total' | 'academic_total' | 'behavioral_total' | 'cross_class_total' | 'resolved_total'
>;

interface AdminReferralsListProps {
  refreshKey?: number;
  onTotalsChange?: (totals: RedFlagTotals) => void;
}

const EMPTY_TOTALS: RedFlagTotals = {
  all_total: 0,
  academic_total: 0,
  behavioral_total: 0,
  cross_class_total: 0,
  resolved_total: 0,
};

const PAGE_SIZE = 10;
const ROLLING_SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const RED_TYPE_LABELS: Record<AdminRedEvent['red_type'], string> = {
  escalated: 'Escalated',
  direct_red: 'Direct Red',
  manual_send: 'Manual Send',
  cross_class: 'Cross-Class',
};

const TAB_CONFIG: Array<{
  id: AdminRedFlagTab;
  label: string;
  totalKey: keyof RedFlagTotals;
}> = [
  { id: 'all', label: 'All Reds', totalKey: 'all_total' },
  { id: 'academic', label: 'Academic', totalKey: 'academic_total' },
  { id: 'behavioral', label: 'Behavioral', totalKey: 'behavioral_total' },
  { id: 'cross_class', label: 'Cross-Class', totalKey: 'cross_class_total' },
  { id: 'resolved', label: 'Resolved', totalKey: 'resolved_total' },
];

function gradeLabel(grade: number): string {
  const mod100 = grade % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? 'th'
    : grade % 10 === 1
      ? 'st'
      : grade % 10 === 2
        ? 'nd'
        : grade % 10 === 3
          ? 'rd'
          : 'th';
  return `${grade}${suffix} Grade`;
}

function formatActivity(dateString?: string | null): string {
  if (!dateString) return 'Date unavailable';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function categoryLabel(event: AdminRedEvent): string {
  if (event.category === 'cross_class') return 'Cross-Class';
  return event.category === 'academic' ? 'Academic' : 'Behavioral';
}

function isInCurrentRollingSevenDays(event: AdminRedEvent): boolean {
  const timestamp = new Date(event.triggered_at || event.occurred_on).getTime();
  if (Number.isNaN(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= ROLLING_SEVEN_DAYS_MS;
}

const ReferralSkeletonRows = () => (
  <>
    {[1, 2, 3].map(row => (
      <tr key={row} className="animate-pulse">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-[#262a3d]" />
            <div className="space-y-2">
              <div className="h-3.5 w-28 rounded bg-gray-200 dark:bg-[#262a3d]" />
              <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-[#262a3d]" />
            </div>
          </div>
        </td>
        {[72, 88, 120, 176, 128].map((width, cell) => (
          <td key={cell} className="px-4 py-4">
            <div
              className="h-3.5 rounded bg-gray-200 dark:bg-[#262a3d]"
              style={{ width }}
            />
          </td>
        ))}
        <td className="px-5 py-4">
          <div className="ml-auto h-8 w-48 rounded-lg bg-gray-200 dark:bg-[#262a3d]" />
        </td>
      </tr>
    ))}
  </>
);

export function AdminReferralsListSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722]">
      <div className="border-b border-gray-200 px-5 pt-5 dark:border-[#262a3d] md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">Admin Referrals &amp; Follow-Ups</h2>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">Red alerts requiring administrative attention.</p>
            </div>
          </div>
          <div className="h-7 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-[#262a3d]" />
        </div>
        <div className="mt-5 flex gap-2 overflow-hidden">
          {[92, 92, 104, 104, 92].map((width, index) => (
            <div key={index} className="h-9 shrink-0 animate-pulse rounded-t-lg bg-gray-200 dark:bg-[#262a3d]" style={{ width }} />
          ))}
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full min-w-[1040px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:border-[#262a3d] dark:bg-[#1b1e2c] dark:text-gray-400">
            <tr>
              {['Student', 'Status', 'Red Type', 'Classes Involved', 'Primary Concern', 'Last Activity', 'Actions'].map((label, index) => (
                <th key={label} className={`${index === 0 || index === 6 ? 'px-5' : 'px-4'} py-3 ${index === 6 ? 'text-right' : ''}`}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
            <ReferralSkeletonRows />
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminReferralsList({
  refreshKey = 0,
  onTotalsChange,
}: AdminReferralsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminRedFlagTab>('all');
  const [rows, setRows] = useState<AdminRedEvent[]>([]);
  const [totals, setTotals] = useState<RedFlagTotals>(EMPTY_TOTALS);
  const [page, setPage] = useState(1);
  const [pageTotal, setPageTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailEvent, setEmailEvent] = useState<AdminRedEvent | null>(null);
  const requestIdRef = useRef(0);

  const fetchRedFlags = useCallback(async (background = false) => {
    const requestId = ++requestIdRef.current;
    if (!background) setFetching(true);
    setError(null);

    try {
      const response = await getAdminRedFlags(activeTab, PAGE_SIZE, (page - 1) * PAGE_SIZE);
      if (requestId !== requestIdRef.current) return undefined;

      const nextTotals: RedFlagTotals = {
        all_total: response.all_total,
        academic_total: response.academic_total,
        behavioral_total: response.behavioral_total,
        cross_class_total: response.cross_class_total,
        resolved_total: response.resolved_total,
      };

      setRows(response.rows ?? []);
      setPageTotal(response.total);
      setTotals(nextTotals);
      onTotalsChange?.(nextTotals);
      return response;
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return undefined;
      console.error('Failed to fetch admin Red events:', err);
      setError(err?.response?.data?.detail || 'Unable to load referrals.');
      return undefined;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setFetching(false);
      }
    }
  }, [activeTab, onTotalsChange, page]);

  useEffect(() => {
    void fetchRedFlags();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchRedFlags, refreshKey]);

  const handleAcknowledge = async (event: AdminRedEvent) => {
    const canAcknowledge = Boolean(event.referral_id);
    if (!canAcknowledge || !event.referral_id) return;

    setAcknowledgingId(event.escalation_id);
    setError(null);
    try {
      await acknowledgeReferral(event.referral_id);
      const response = await fetchRedFlags(true);
      if (response && response.rows.length === 0 && page > 1) {
        setPage(currentPage => currentPage - 1);
      }
      window.dispatchEvent(new Event('dashboard-refresh'));
    } catch (err: any) {
      console.error('Failed to acknowledge referral:', err);
      setError(err?.response?.data?.detail || 'Unable to acknowledge this referral.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pageTotal / PAGE_SIZE));
  const firstVisibleRow = pageTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, pageTotal);
  const latestRepeatOffenderIds = useMemo(() => {
    if (activeTab === 'resolved') return new Set<string>();

    const latestByStudent = new Map<string, { escalationId: string; timestamp: number }>();

    rows.forEach((event) => {
      if (!event.repeat_offender || !isInCurrentRollingSevenDays(event)) return;
      const parsedTimestamp = new Date(event.triggered_at || event.occurred_on).getTime();
      const timestamp = Number.isNaN(parsedTimestamp) ? Number.NEGATIVE_INFINITY : parsedTimestamp;
      const current = latestByStudent.get(event.student.student_id);

      // Preserve the first backend row when two events share the same timestamp.
      if (!current || timestamp > current.timestamp) {
        latestByStudent.set(event.student.student_id, {
          escalationId: event.escalation_id,
          timestamp,
        });
      }
    });

    return new Set(Array.from(latestByStudent.values(), item => item.escalationId));
  }, [activeTab, rows]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#151722]">
      <div className="border-b border-gray-200 px-5 pt-5 dark:border-[#262a3d] md:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">
                Admin Referrals &amp; Follow-Ups
              </h2>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                Red alerts requiring administrative attention.
              </p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 dark:bg-red-950/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {totals.all_total} Active Red Alerts
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-0">
          {TAB_CONFIG.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                  setPageTotal(totals[tab.totalKey]);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-xs font-bold transition-colors ${
                  selected
                    ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-[#262a3d] dark:bg-[#1b1e2c] dark:text-gray-300'
                }`}
              >
                {tab.id === 'academic' && <BookOpen className="h-3.5 w-3.5" />}
                {tab.id === 'behavioral' && <Users className="h-3.5 w-3.5" />}
                {tab.id === 'cross_class' && <Flag className="h-3.5 w-3.5" />}
                {tab.id === 'resolved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {tab.label} ({totals[tab.totalKey]})
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 border-b border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchRedFlags()} className="inline-flex items-center gap-1 font-bold">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <div className="relative overflow-x-auto" aria-busy={fetching}>
        <table className="w-full min-w-[1040px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:border-[#262a3d] dark:bg-[#1b1e2c] dark:text-gray-400">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Red Type</th>
              <th className="px-4 py-3">Classes Involved</th>
              <th className="px-4 py-3">Primary Concern</th>
              <th className="px-4 py-3">Last Activity</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#262a3d]">
            {loading || fetching ? (
              <ReferralSkeletonRows />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm font-medium text-gray-400">
                  No Reds found in this tab.
                </td>
              </tr>
            ) : rows.map((event) => {
              const studentName = `${event.student.first_name} ${event.student.last_name}`;
              const initials = `${event.student.first_name.charAt(0)}${event.student.last_name.charAt(0)}`;
              const isResolved = activeTab === 'resolved';
              const canAcknowledge = Boolean(event.referral_id) && !isResolved;
              const showRepeatOffender =
                !isResolved && event.repeat_offender && isInCurrentRollingSevenDays(event);
              const isLatestRepeatOffender = latestRepeatOffenderIds.has(event.escalation_id);
              const classContributions = event.category === 'cross_class'
                ? event.classes_involved ?? []
                : [];
              const hasPartialContributionTracking =
                event.contribution_tracking_status === 'inferred_partial';

              return (
                <tr
                  key={event.escalation_id}
                  className={`align-top transition-colors ${
                    isLatestRepeatOffender
                      ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-950/70'
                      : 'hover:bg-gray-50/70 dark:hover:bg-[#1b1e2c]/70'
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{studentName}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {gradeLabel(event.student.grade_level)}
                        </p>
                        {showRepeatOffender && (
                          <span className="mt-2 inline-flex rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            Repeat Offender · {event.red_events_7d} Reds in 7d
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    }`}>
                      {isResolved ? 'Resolved' : categoryLabel(event)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                      <Flag className="h-3.5 w-3.5" /> {RED_TYPE_LABELS[event.red_type]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {event.category === 'cross_class' ? (
                      <div className="min-w-[150px]">
                        {classContributions.length > 0 ? (
                          <div className="space-y-1">
                            {classContributions.map((item, index) => (
                              <p
                                key={`${item.class_id ?? `${item.class_name}-${item.subject}`}-${index}`}
                              >
                                {item.class_name ?? item.subject ?? 'Unknown class'}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-gray-400 dark:text-gray-500">Class details unavailable</p>
                        )}
                        {hasPartialContributionTracking && (
                          <p className="mt-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            Partial contribution history
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>{event.class_name || 'Class unavailable'}</p>
                    )}
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <p>{event.description}</p>
                    {event.follow_up_needed && (
                      <p className="mt-2 font-bold text-amber-600 dark:text-amber-400">
                        Follow-up{event.follow_up_date ? ` · ${formatDate(event.follow_up_date)}` : ' needed'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                    <p className="font-semibold">{formatActivity(event.triggered_at || event.occurred_on)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/principal-students/${event.student.slug || event.student.student_id}`)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailEvent(event)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </button>
                      {isResolved ? (
                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Resolved
                        </span>
                      ) : canAcknowledge ? (
                        <button
                          type="button"
                          onClick={() => void handleAcknowledge(event)}
                          disabled={acknowledgingId === event.escalation_id}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          {acknowledgingId === event.escalation_id ? 'Acknowledging…' : 'Acknowledge'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageTotal > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3 sm:flex-row dark:border-[#262a3d] dark:bg-[#1b1e2c]/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing {firstVisibleRow}–{lastVisibleRow} of {pageTotal} rows
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage => Math.max(1, currentPage - 1))}
              disabled={page === 1 || loading || fetching}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-[#151722] dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="min-w-[84px] text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(currentPage => Math.min(totalPages, currentPage + 1))}
              disabled={page >= totalPages || loading || fetching}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-[#151722] dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {emailEvent && (
        <ParentEmailTemplateModal
          isOpen={true}
          onClose={() => setEmailEvent(null)}
          studentName={`${emailEvent.student.first_name} ${emailEvent.student.last_name}`}
          teacherName="Administration"
          reason={emailEvent.description}
          flagCategory="admin_concern"
          studentId={emailEvent.student.student_id}
        />
      )}
    </section>
  );
}
