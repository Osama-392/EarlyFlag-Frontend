import api from './api';

// ─── Dashboard Types ───────────────────────────────────────────────

export interface DashboardStats {
  students_flagged_this_week?: number;
  yellow_flags_30d?: number;
  red_flags_30d?: number;
  green_signals_30d?: number;
  total_students?: number;
  // Percentage changes
  flagged_change?: number;
  yellow_change?: number;
  red_change?: number;
}

export interface WatchListStudent {
  student_id: string;
  student_name: string;
  first_name?: string;
  last_name?: string;
  academic_count?: number;
  behavioral_count?: number;
  total_flags: number;
  last_flag_date?: string;
  streak?: string;
}

export interface UrgentAlert {
  id?: string;
  student_id: string;
  student_name: string;
  first_name?: string;
  last_name?: string;
  issue?: string;
  alert_type?: string;
  rule_name?: string;
  severity?: string;
  created_at?: string;
  duration?: string;
}

export interface ActivityItem {
  id?: string;
  type?: string;
  description?: string;
  text?: string;
  student_name?: string;
  created_at?: string;
  time?: string;
  highlight?: boolean;
}

export interface SuperGreenStudent {
  student_id: string;
  student_name: string;
  first_name?: string;
  last_name?: string;
  grade?: string;
  class_name?: string;
  green_streak_days: number;
}

export interface DailyBreakdown {
  day: string;
  date?: string;
  academic: number;
  behavioral: number;
}

export interface DashboardData {
  stats?: DashboardStats;
  yellow_watch_list?: WatchListStudent[];
  red_urgent?: UrgentAlert[];
  recent_activity?: ActivityItem[];
  super_green?: SuperGreenStudent[];
  daily_breakdown?: DailyBreakdown[];
  // Fallback: the API may return data under different keys
  [key: string]: any;
}

// ─── API Call ──────────────────────────────────────────────────────

export const getTeacherDashboard = async (): Promise<DashboardData> => {
  try {
    const response = await api.get('/api/v1/teacher/dashboard');
    console.log('📊 Dashboard API response keys:', Object.keys(response.data || {}));
    return response.data || {};
  } catch (error: any) {
    console.error('Failed to fetch dashboard:', error?.response?.status, error?.response?.data);
    throw error;
  }
};
