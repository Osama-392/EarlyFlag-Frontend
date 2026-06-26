import api from './api';
import { cacheGet, cacheSet, CACHE_KEYS, withCache } from './dataCache';

// ─── Dashboard Types ───────────────────────────────────────────────

export interface TeacherKpiBlock {
  week_start: string;
  week_end: string;
  yellow_total: number;
  red_total: number;
  super_green_total: number;
  absent_total: number;
  yellow_academic: number;
  yellow_behavioral: number;
  red_academic: number;
  red_behavioral: number;
}

export interface ClassLoggingStatusRow {
  class_id: string;
  class_name: string;
  logged_today: boolean;
  student_count_active: number;
}

export interface UnfinishedLogRow {
  session_id: string;
  class_id: string;
  class_name: string;
  started_at: string; // ISO date string
  elapsed_hours: number;
  student_count: number;
}

export interface StudentRecognitionRow {
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  class_name: string;
  period: string;
  signal_date: string;
  reason_code?: string;
  notes?: string;
  total_recognitions: number;
}

export interface YellowWatchListRow {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  yellow_academic_count: number;
  yellow_behavioral_count: number;
  yellow_total: number;
  unresolved_alert_max_severity?: string | null;
}

export interface RedUrgentStudentSummary {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
}

export interface RedUrgentRow {
  alert_id: string;
  rule_description: string;
  severity: string;
  triggered_at: string;
  student: RedUrgentStudentSummary;
}

export interface SuperGreenHighlightRow {
  signal_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  signal_date: string;
  reason_code?: string | null;
  reason_description?: string | null;
  parent_email_on_file: boolean;
}

export interface MondayBriefTopStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  total_signals: number;
}

export interface MondayBriefBlock {
  active: boolean;
  prior_week_start: string;
  prior_week_end: string;
  prior_week_unresolved_critical: number;
  top_students?: MondayBriefTopStudent[];
}

export interface TeacherDashboardResponse {
  kpis: TeacherKpiBlock;
  classes: ClassLoggingStatusRow[];
  yellow_watch_list: YellowWatchListRow[];
  red_urgent: RedUrgentRow[];
  super_green_highlights: SuperGreenHighlightRow[];
  monday_brief: MondayBriefBlock;
  recommendations: string[];
  generated_at: string;
  school_timezone: string;
}

// ─── API Call ──────────────────────────────────────────────────────

export const getTeacherDashboard = async (forceRefresh = false): Promise<TeacherDashboardResponse> => {
  return withCache(
    CACHE_KEYS.TEACHER_DASHBOARD,
    async () => {
      try {
        const response = await api.get('/api/v1/teacher/dashboard');
        return response.data;
      } catch (error: any) {
        console.error('Failed to fetch teacher dashboard:', error?.response?.status, error?.response?.data);
        throw error;
      }
    },
    forceRefresh
  );
};

export const getUnfinishedAlerts = async (): Promise<UnfinishedLogRow[]> => {
  try {
    const response = await api.get<UnfinishedLogRow[]>('/api/v1/teacher/morning-brief/unfinished-alerts');
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to fetch unfinished alerts:', error?.response?.data);
    return [];
  }
};

export const dismissUnfinishedAlert = async (sessionId: string): Promise<void> => {
  try {
    await api.post(`/api/v1/teacher/morning-brief/unfinished-alerts/${sessionId}/dismiss`);
  } catch (error: any) {
    console.error(`Failed to dismiss unfinished alert ${sessionId}:`, error?.response?.data);
    throw error;
  }
};

export const getTeacherRecognitions = async (limit: number = 50): Promise<StudentRecognitionRow[]> => {
  try {
    const response = await api.get<StudentRecognitionRow[]>('/api/v1/teacher/recognitions', {
      params: { limit },
    });
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to fetch teacher recognitions:', error?.response?.data);
    throw error;
  }
};
