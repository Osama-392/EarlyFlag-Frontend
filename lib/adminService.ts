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
export type AdminRedFlagCategory = 'academic' | 'behavioral';
export type AdminRedFlagType = 'escalated' | 'direct_red' | 'manual_send' | 'cross_class';

export interface AdminRedFlagStudent {
  student_id: string;
  slug: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
}

export interface AdminRedFlag {
  escalation_id: string;
  category: AdminRedFlagCategory;
  red_type: AdminRedFlagType;
  status: 'active' | 'resolved';
  description: string;
  occurred_on: string;
  triggered_at: string;
  class_id: string | null;
  class_name: string | null;
  subject: string | null;
  referral_id: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  admin_acknowledged_at: string | null;
  red_events_7d: number;
  repeat_offender: boolean;
  student: AdminRedFlagStudent;
}

export interface AdminRedFlagsResponse {
  total: number;
  all_total: number;
  academic_total: number;
  behavioral_total: number;
  cross_class_total: number;
  resolved_total: number;
  active_referrals_total: number;
  limit: number;
  offset: number;
  range_start: string | null;
  range_end: string;
  selected_tab: AdminRedFlagTab;
  events: AdminRedFlag[];
}

export const getAdminRedFlags = async (
  tab: AdminRedFlagTab,
  limit = 10,
  offset = 0,
): Promise<AdminRedFlagsResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set('tab', tab);
  searchParams.set('range', 'all');
  searchParams.set('limit', limit.toString());
  searchParams.set('offset', offset.toString());

  const res = await api.get(`/api/v1/admin/red-flags?${searchParams.toString()}`);
  return res.data;
};

export const acknowledgeReferral = async (referralId: string) => {
  const res = await api.put(`/api/v1/admin/referrals/${referralId}/acknowledge`);
  return res.data;
};
