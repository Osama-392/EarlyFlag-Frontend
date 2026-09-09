'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  AdminRedFlag,
  AdminRedFlagsResponse,
  AdminRedFlagTab,
  getAdminRedFlags,
} from '@/lib/adminService';
import ParentEmailTemplateModal from '@/components/ParentEmailTemplateModal';

type RedFlagTotals = Pick<
  AdminRedFlagsResponse,
  | 'all_total'
  | 'academic_total'
  | 'behavioral_total'
  | 'cross_class_total'
  | 'resolved_total'
  | 'active_referrals_total'
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
  active_referrals_total: 0,
};

const PAGE_SIZE = 10;

const RED_TYPE_LABELS: Record<AdminRedFlag['red_type'], string> = {
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

function formatActivity(dateString: string): string {
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

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function AdminReferralsList({
  refreshKey = 0,
  onTotalsChange,
}: AdminReferralsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminRedFlagTab>('all');
  const [events, setEvents] = useState<AdminRedFlag[]>([]);
  const [totals, setTotals] = useState<RedFlagTotals>(EMPTY_TOTALS);
  const [page, setPage] = useState(1);
  const [pageTotal, setPageTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailEvent, setEmailEvent] = useState<AdminRedFlag | null>(null);
  const requestIdRef = useRef(0);

  const fetchRedFlags = useCallback(async (background = false) => {
    const requestId = ++requestIdRef.current;
    if (!background) setFetching(true);
    setError(null);

    try {
      const response = await getAdminRedFlags(activeTab, PAGE_SIZE, (page - 1) * PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;

      const nextTotals: RedFlagTotals = {
        all_total: response.all_total,
        academic_total: response.academic_total,
        behavioral_total: response.behavioral_total,
        cross_class_total: response.cross_class_total,
        resolved_total: response.resolved_total,
        active_referrals_total: response.active_referrals_total,
      };

      setEvents(response.events ?? []);
      setPageTotal(response.total);
      setTotals(nextTotals);
      onTotalsChange?.(nextTotals);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to fetch admin red flags:', err);
      setError(err?.response?.data?.detail || 'Unable to load referrals.');
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

  const handleAcknowledge = async (event: AdminRedFlag) => {
    if (!event.referral_id) return;

    setAcknowledgingId(event.escalation_id);
    setError(null);
    try {
      await acknowledgeReferral(event.referral_id);
      setEvents(currentEvents => currentEvents.filter(item => item.escalation_id !== event.escalation_id));
      setPageTotal(currentTotal => Math.max(0, currentTotal - 1));

      if (events.length === 1 && page > 1) {
        setPage(currentPage => currentPage - 1);
      } else {
        await fetchRedFlags(true);
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
                Red flag students requiring your attention — teachers auto-populate, or send manually.
              </p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 dark:bg-red-950/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {totals.active_referrals_total} Active Referrals
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
        {fetching && !loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-gray-600 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-[#1b1e2c]/95 dark:text-gray-300">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating…
            </span>
          </div>
        )}
        <table className="w-full min-w-[1040px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:border-[#262a3d] dark:bg-[#1b1e2c] dark:text-gray-400">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Red Type</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Primary Concern</th>
              <th className="px-4 py-3">Last Activity</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-100 transition-opacity duration-150 dark:divide-[#262a3d] ${fetching && !loading ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm font-medium text-gray-400">
                  Loading referrals…
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm font-medium text-gray-400">
                  No Reds found in this tab.
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const studentName = `${event.student.first_name} ${event.student.last_name}`;
                const initials = `${event.student.first_name.charAt(0)}${event.student.last_name.charAt(0)}`;
                const isResolved = event.status === 'resolved';

                return (
                  <tr key={event.escalation_id} className="align-top transition-colors hover:bg-gray-50/70 dark:hover:bg-[#1b1e2c]/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{studentName}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            {gradeLabel(event.student.grade_level)} · {event.student.external_student_id}
                          </p>
                          {event.repeat_offender === true && (
                            <span className="mt-2 inline-flex rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              Repeat Offender · {event.red_events_7d} Reds in 7d
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        }`}>
                          {isResolved ? 'Resolved' : 'Red'}
                        </span>
                        {event.category === 'academic' && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Academic
                          </span>
                        )}
                        {event.category === 'behavioral' && (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            Behavioral
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                        <Flag className="h-3.5 w-3.5" /> {RED_TYPE_LABELS[event.red_type]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <p>{event.class_name || 'Cross-Class'}</p>
                      {event.subject && <p className="mt-1 text-gray-400">{event.subject}</p>}
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
                      <p className="font-semibold">{formatActivity(event.triggered_at)}</p>
                      <p className="mt-1 text-[11px] text-gray-400">Occurred {formatDate(event.occurred_on)}</p>
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
                        ) : event.referral_id ? (
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
              })
            )}
          </tbody>
        </table>
      </div>

      {pageTotal > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3 sm:flex-row dark:border-[#262a3d] dark:bg-[#1b1e2c]/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing {firstVisibleRow}–{lastVisibleRow} of {pageTotal}
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
