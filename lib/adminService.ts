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

export interface AdminReferral {
  referral_id: string;
  referral_type: string;
  priority: string;
  email_status: string;
  sent_at: string | null;
  opened_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  note: string;
  created_at: string;
  student_id: string;
  external_student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_grade_level: number;
  referred_by_id: string;
  referred_by_first_name: string;
  referred_by_last_name: string;
}

export interface EscalationLogResponse {
  total: number;
  limit: number;
  offset: number;
  range_start: string;
  range_end: string;
  referrals: AdminReferral[];
}

export const getAdminReferrals = async (
  params?: {
    status?: string[];
    priority?: string[];
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
  }
): Promise<EscalationLogResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params) {
    if (params.status) {
      params.status.forEach(s => searchParams.append('status', s));
    }
    if (params.priority) {
      params.priority.forEach(p => searchParams.append('priority', p));
    }
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.from) searchParams.append('from', params.from);
    if (params.to) searchParams.append('to', params.to);
  }

  const res = await api.get(`/api/v1/admin/referrals?${searchParams.toString()}`);
  return res.data;
};

export const acknowledgeReferral = async (referralId: string) => {
  const res = await api.put(`/api/v1/admin/referrals/${referralId}/acknowledge`);
  return res.data;
};
