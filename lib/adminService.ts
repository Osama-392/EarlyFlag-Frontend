import api from './api';

export interface PendingTeacher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string;
  created_at: string;
}

export const getPendingTeachers = async (): Promise<PendingTeacher[]> => {
  const res = await api.get('/api/v1/admin/teachers/pending');
  return res.data || [];
};

export const approveTeacher = async (teacherId: string) => {
  const res = await api.post(`/api/v1/admin/teachers/${teacherId}/approve`);
  return res.data;
};

export const rejectTeacher = async (teacherId: string) => {
  const res = await api.post(`/api/v1/admin/teachers/${teacherId}/reject`);
  return res.data;
};

export type AdminRedFlagTab = 'all' | 'academic' | 'behavioral' | 'cross_class' | 'resolved';
export type AdminRedCategory = 'academic' | 'behavioral' | 'cross_class';
export type AdminRedType = 'escalated' | 'direct_red' | 'manual_send' | 'cross_class';

export interface AdminRedFlagStudent {
  student_id: string;
  slug?: string;
  external_student_id?: string;
  first_name: string;
  last_name: string;
  grade_level: number;
}

export interface AdminRedClassContribution {
  class_id: string | null;
  class_name: string | null;
  subject: string | null;
  academic_yellows: number;
  behavioral_yellows: number;
  total_yellows: number;
}

export type AdminContributionTrackingStatus =
  | 'complete'
  | 'inferred_complete'
  | 'inferred_partial';

export interface AdminRedEvent {
  escalation_id: string;
  occurred_on: string;
  triggered_at?: string;
  category: AdminRedCategory;
  underlying_category: 'academic' | 'behavioral' | null;
  red_type: AdminRedType;
  origin: string;
  description: string;
  class_id: string | null;
  class_name: string | null;
  subject: string | null;
  referral_id: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  red_events_7d: number;
  repeat_offender: boolean;
  classes_involved: AdminRedClassContribution[];
  contributing_yellow_count: number;
  contribution_tracking_status: AdminContributionTrackingStatus | null;
  student: AdminRedFlagStudent;
}

export interface AdminRedFlagsResponse {
  total: number;
  all_total: number;
  academic_total: number;
  behavioral_total: number;
  cross_class_total: number;
  resolved_total: number;
  limit: number;
  offset: number;
  range_start: string | null;
  range_end: string;
  selected_tab: AdminRedFlagTab;
  rows: AdminRedEvent[];
}

export const getAdminRedFlags = async (
  tab: AdminRedFlagTab,
  limit = 10,
  offset = 0,
): Promise<AdminRedFlagsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set('range', 'all');
  searchParams.set('tab', tab);
  searchParams.set('limit', limit.toString());
  searchParams.set('offset', offset.toString());

  const res = await api.get(`/api/v1/admin/red-flags?${searchParams.toString()}`);
  const data = res.data || {};
  const rows = Array.isArray(data)
    ? data
    : data.events ?? data.red_flags ?? data.referrals ?? data.items ?? [];
  return { ...data, rows };
};

export interface AdminReferralsResponse {
  total: number;
  limit: number;
  offset: number;
  rows: AdminRedEvent[];
}

export interface AdminReferralsQuery {
  tab?: AdminRedFlagTab;
  status?: string;
  priority?: string;
  follow_up?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const getAdminReferrals = async (
  query: AdminReferralsQuery = {},
): Promise<AdminReferralsResponse> => {
  const searchParams = new URLSearchParams();
  if (query.tab) searchParams.set('tab', query.tab);
  if (query.status) searchParams.set('status', query.status);
  if (query.priority) searchParams.set('priority', query.priority);
  if (query.follow_up !== undefined) searchParams.set('follow_up', String(query.follow_up));
  if (query.from) searchParams.set('from', query.from);
  if (query.to) searchParams.set('to', query.to);
  searchParams.set('limit', String(query.limit ?? 50));
  searchParams.set('offset', String(query.offset ?? 0));

  const suffix = searchParams.toString();
  const res = await api.get(`/api/v1/admin/referrals${suffix ? `?${suffix}` : ''}`);
  const data = res.data || {};
  const rows = Array.isArray(data)
    ? data
    : data.referrals ?? data.events ?? data.red_flags ?? data.items ?? [];
  return { ...data, rows };
};

export const acknowledgeReferral = async (referralId: string) => {
  const res = await api.put(`/api/v1/admin/referrals/${referralId}/acknowledge`);
  return res.data;
};
