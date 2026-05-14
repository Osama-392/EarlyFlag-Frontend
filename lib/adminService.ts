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
