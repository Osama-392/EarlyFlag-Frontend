import api from './api';

// ═══════════════════════════════════════════════════════════════════
// M8 Admin Dashboard — Types & API Service
// Matches backend schemas from app/schemas/admin_dashboard.py
// ═══════════════════════════════════════════════════════════════════

// ─── Shared / Reused ───────────────────────────────────────────────

export interface SignalCountsByType {
  super_green: number;
  present: number;
  yellow: number;
  red: number;
  absent: number;
}

export interface ReportCategoryBreakdown {
  yellow_academic: number;
  yellow_behavioral: number;
  red_academic: number;
  red_behavioral: number;
}

export interface DailySignalBucket {
  day: string;        // ISO date
  counts: SignalCountsByType;
}

export interface ReportStudentHeader {
  student_id: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  iep_status: boolean;
  ell_status: boolean;
  parent_email_on_file: boolean;
}

export interface ReportRecentNoteRow {
  signal_date: string;
  class_name: string;
  excerpt: string;
}

// ─── 1. Admin Dashboard (Composite) ───────────────────────────────

export interface AdminDashboardSchoolBlock {
  id: string;
  name: string;
  timezone: string;
}

export interface AdminDashboardRangeBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  force_monday_brief: boolean;
}

export interface AdminKpiBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  yellow_total: number;
  red_total: number;
  super_green_total: number;
  absent_total: number;
  present_total: number;
  yellow_academic: number;
  yellow_behavioral: number;
  red_academic: number;
  red_behavioral: number;
  unresolved_alerts_total: number;
  unresolved_high_critical_total: number;
  open_referrals_total: number;
  pending_teacher_flags_total: number;
}

export interface MondayRedFlagTopStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  critical_alert_count: number;
  high_alert_count: number;
  primary_rule_description?: string | null;
}

export interface MondayRedFlagBlock {
  active: boolean;
  week_start: string;
  week_end: string;
  unresolved_critical_count: number;
  unresolved_high_count: number;
  top_students: MondayRedFlagTopStudent[];
}

export interface AdminUrgentAlertStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
}

export interface AdminUrgentAlertRow {
  alert_id: string;
  rule_description: string;
  severity: string;
  alert_type: string;
  triggered_at: string;
  student: AdminUrgentAlertStudent;
}

export interface TeacherObservationFlagRow {
  flag_id: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  teacher_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  triggered_at: string;
  threshold_percentage: number;
  yellow_count: number;
  red_count: number;
  is_acknowledged: boolean;
  acknowledged_by_id?: string | null;
  acknowledged_by_first_name?: string | null;
  acknowledged_by_last_name?: string | null;
}

export interface SubjectPerformance {
  subject_name: string;
  yellow_count: number;
  red_count: number;
  super_green_count: number;
  flag_percentage: number | null;
  trend_value: number | null;
  band: HeatmapBand;
}

export interface DepartmentOverviewBlock {
  department_name: string;
  yellow_count: number;
  red_count: number;
  super_green_count: number;
  trend_value: number | null;
  subjects: SubjectPerformance[];
}

export interface TeacherLeaderboardRow {
  teacher_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  department: string | null;
  super_green_count: number;
}

export interface AdminDashboardResponse {
  school: AdminDashboardSchoolBlock;
  range: AdminDashboardRangeBlock;
  kpis: AdminKpiBlock;
  monday_red_flag: MondayRedFlagBlock;
  urgent_alerts: AdminUrgentAlertRow[];
  pending_teacher_flags: TeacherObservationFlagRow[];
  departments: DepartmentOverviewBlock[];
  recommendations: string[];
  teacher_leaderboard: TeacherLeaderboardRow[];
  generated_at: string;
  school_timezone: string;
}

// ─── 2. Heatmap ───────────────────────────────────────────────────

export type HeatmapBand = 'green' | 'yellow' | 'orange' | 'red' | 'no_data';

export interface HeatmapTile {
  class_id: string;
  class_name: string;
  grade_level: number;
  teacher_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  active_enrollments: number;
  yellow_count: number;
  red_count: number;
  flag_percentage: number | null;
  band: HeatmapBand;
  has_unresolved_high_critical: boolean;
  has_observation_flag: boolean;
  subject?: string;
}

export interface HeatmapGradeBucket {
  grade_level: number;
  tiles: HeatmapTile[];
}

export interface HeatmapBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  grade_buckets: HeatmapGradeBucket[];
}

// ─── 3. Class Drill-Down ──────────────────────────────────────────

export interface AdminClassRosterRow {
  student_id: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  iep_status: boolean;
  ell_status: boolean;
  weighted_score: number;
  red_count: number;
  yellow_count: number;
  yellow_academic: number;
  yellow_behavioral: number;
  absent_count: number;
  last_flag_date?: string | null;
}

export interface AdminClassObservationFlag {
  flag_id: string;
  triggered_at: string;
  threshold_percentage: number;
  yellow_count: number;
  red_count: number;
}

export interface AdminClassDrilldownBlock {
  class_id: string;
  class_name: string;
  grade_level: number;
  period: number | null;
  subject: string | null;
  academic_year: string;
  teacher_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  active_enrollment_count: number;
  range_days: number;
  range_start: string;
  range_end: string;
  students: AdminClassRosterRow[];
  observation_flag?: AdminClassObservationFlag | null;
}

// ─── 4. Most Flagged Students ─────────────────────────────────────

export interface MostFlaggedStudentRow {
  student_id: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  iep_status: boolean;
  ell_status: boolean;
  weighted_score: number;
  red_count: number;
  yellow_count: number;
  yellow_academic: number;
  yellow_behavioral: number;
  absent_count: number;
  open_referrals: number;
  last_flag_date?: string | null;
}

export interface MostFlaggedBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  limit: number;
  grade_level?: number | null;
  students: MostFlaggedStudentRow[];
}

// ─── 5. Admin Student Profile ─────────────────────────────────────

export interface AdminStudentAlertRow {
  alert_id: string;
  class_id: string;
  class_name: string;
  alert_type: string;
  severity: string;
  triggered_at: string;
  rule_description: string;
}

export interface AdminStudentReferralRow {
  referral_id: string;
  referral_type: string;
  priority: string;
  email_status: string;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  referred_by_id: string;
  referred_by_first_name: string;
  referred_by_last_name: string;
  created_at: string;
}

export interface AdminStudentProfileBlock {
  student: ReportStudentHeader;
  counts_7d: SignalCountsByType;
  counts_30d: SignalCountsByType;
  counts_semester: SignalCountsByType;
  category_7d: ReportCategoryBreakdown;
  timeline_30d: DailySignalBucket[];
  semester_start: string;
  semester_end: string;
  semester_absent_count: number;
  unresolved_alerts: AdminStudentAlertRow[];
  recent_referrals: AdminStudentReferralRow[];
  recent_notes: ReportRecentNoteRow[];
}

// ─── 6. Counselor Escalation Log ──────────────────────────────────

export interface EscalationLogRow {
  referral_id: string;
  referral_type: string;
  priority: string;
  email_status: string;
  email_error?: string | null;
  sent_at: string | null;
  opened_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by?: string | null;
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

export interface EscalationLogBlock {
  total: number;
  limit: number;
  offset: number;
  range_start: string;
  range_end: string;
  referrals: EscalationLogRow[];
}

// ─── 7. Teacher Observation Flags List ────────────────────────────

export interface TeacherObservationFlagListBlock {
  status_filter: 'open' | 'all';
  flags: TeacherObservationFlagRow[];
}

// ─── 8. Trends ────────────────────────────────────────────────────

export interface TrendsDailyBucket {
  date: string;
  super_green: number;
  present: number;
  yellow: number;
  red: number;
  absent: number;
}

export interface TrendsWeeklyFlagBucket {
  week_start: string;
  yellow_academic: number;
  yellow_behavioral: number;
  red_academic: number;
  red_behavioral: number;
}

export interface TrendsAttendancePoint {
  date: string;
  absent_count: number;
}

export interface AdminTrendsBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  daily: TrendsDailyBucket[];
  weekly_flag_accumulation: TrendsWeeklyFlagBucket[];
  attendance_trend: TrendsAttendancePoint[];
}

// ─── 9. Mutations ─────────────────────────────────────────────────

export interface AlertResolveRequest {
  resolution_note: string;
}

export interface AlertResolveResponse {
  alert_id: string;
  is_resolved: boolean;
  resolved_at: string;
  resolved_by_id: string;
  resolved_by_first_name: string;
  resolved_by_last_name: string;
  resolution_note: string;
}

export interface TeacherFlagAcknowledgeResponse {
  flag_id: string;
  is_acknowledged: boolean;
  acknowledged_at: string;
  acknowledged_by_id: string;
  acknowledged_by_first_name: string;
  acknowledged_by_last_name: string;
}

// ─── 10. Super Green Export ───────────────────────────────────────

export interface SuperGreenExportRow {
  student_id: string;
  student_id_external: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  super_green_count: number;
  top_reasons: string[];
  last_super_green_date: string;
  iep_status: boolean;
  ell_status: boolean;
}

export interface SuperGreenExportPayload {
  academic_year_label: string;
  window_start: string;
  window_end: string;
  threshold: number;
  row_count: number;
  students: SuperGreenExportRow[];
}

// ─── Referral Filter Params ───────────────────────────────────────

export interface ReferralFilterParams {
  status?: string[];
  priority?: string[];
  follow_up?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ─── Report Filter Params (shared across student/teacher/grade reports) ───

export interface ReportFilterParams {
  range?: '1d' | '7d' | '30d';
  from?: string;
  to?: string;
  grade_level?: number;
  limit?: number;
  offset?: number;
}

// ─── 11. Student-Wise Report ──────────────────────────────────────

export interface StudentReportItem {
  student_id: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  iep_status: boolean;
  ell_status: boolean;
  signal_counts: SignalCountsByType;
  category_breakdown: ReportCategoryBreakdown;
  weighted_score: number;
  unresolved_alert_count: number;
  open_referral_count: number;
  last_flag_date: string | null;
  enrolled_class_count: number;
}

export interface StudentReportBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  limit: number;
  offset: number;
  total: number;
  grade_level: number | null;
  students: StudentReportItem[];
}

// ─── 12. Teacher-Wise Report ──────────────────────────────────────

export interface TeacherReportItem {
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_count: number;
  total_enrollments: number;
  signal_counts: SignalCountsByType;
  category_breakdown: ReportCategoryBreakdown;
  unresolved_alert_count: number;
  open_referral_count: number;
  pending_observation_flag_count: number;
  most_recent_signal_date: string | null;
}

export interface TeacherReportBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  limit: number;
  offset: number;
  total: number;
  teachers: TeacherReportItem[];
}

// ─── 13. Grade-Wise Report ────────────────────────────────────────

export interface GradeReportItem {
  grade_level: number;
  student_count: number;
  class_count: number;
  teacher_count: number;
  signal_counts: SignalCountsByType;
  category_breakdown: ReportCategoryBreakdown;
  unresolved_alert_count: number;
  open_referral_count: number;
  pending_observation_flag_count: number;
  avg_flag_percentage: number;
}

export interface GradeReportBlock {
  range_days: number;
  range_start: string;
  range_end: string;
  limit: number;
  offset: number;
  total: number;
  grade_level: number | null;
  grades: GradeReportItem[];
}

// ─── 14. Teacher-Specific Report (Admin) ─────────────────────────

export interface AdminTeacherClassFlagRow {
  class_id: string;
  class_name: string;
  grade_level: number;
  active_enrollments: number;
  counts: SignalCountsByType;
}

export interface AdminTeacherTopStudentRow {
  student_id: string;
  external_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  iep_status: boolean;
  ell_status: boolean;
  weighted_score: number;
  signal_counts: SignalCountsByType;
}

export interface AdminTeacherSpecificReportBlock {
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  range_days: number;
  range_start: string;
  range_end: string;
  classes: AdminTeacherClassFlagRow[];
  top_students: AdminTeacherTopStudentRow[];
}


// ═══════════════════════════════════════════════════════════════════
//  API Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/dashboard
 * Composite admin dashboard payload: KPIs, Monday brief, urgent alerts,
 * pending teacher flags, and heuristic recommendations.
 */
export const getAdminDashboard = async (
  range: '1d' | '7d' | '30d' = '7d',
  forceMondayBrief = false,
): Promise<AdminDashboardResponse> => {
  const params: Record<string, string | boolean> = { range };
  if (forceMondayBrief) params.force_monday_brief = true;
  const res = await api.get('/api/v1/admin/dashboard', { params });
  return res.data;
};

export const getAdminLeaderboard = async (
  range: '1d' | '7d' | '30d' = '7d',
): Promise<TeacherLeaderboardRow[]> => {
  const params: Record<string, string> = { range };
  const res = await api.get('/api/v1/admin/leaderboard', { params });
  return res.data;
};

/**
 * GET /api/v1/admin/heatmap
 * Per-class flag percentage tiles grouped by grade, with color bands.
 */
export const getAdminHeatmap = async (
  range: '1d' | '7d' | '30d' = '7d',
): Promise<HeatmapBlock> => {
  const res = await api.get('/api/v1/admin/heatmap', { params: { range } });
  return res.data;
};

/**
 * GET /api/v1/admin/classes/{classId}
 * Class drill-down: roster ranked by flag severity + observation flag banner.
 */
export const getAdminClassDrilldown = async (
  classId: string,
  range: '1d' | '7d' | '30d' = '7d',
): Promise<AdminClassDrilldownBlock> => {
  const res = await api.get(`/api/v1/admin/classes/${classId}`, { params: { range } });
  return res.data;
};

/**
 * GET /api/v1/admin/students/flagged
 * Students ranked by weighted score (red×3 + yellow×1).
 */
export const getAdminMostFlagged = async (
  range: '1d' | '7d' | '30d' = '7d',
  limit?: number,
  gradeLevel?: number,
): Promise<MostFlaggedBlock> => {
  const params: Record<string, string | number> = { range };
  if (limit) params.limit = limit;
  if (gradeLevel) params.grade_level = gradeLevel;
  const res = await api.get('/api/v1/admin/students/flagged', { params });
  return res.data;
};

/**
 * GET /api/v1/admin/students/{studentId}
 * Admin-scope student profile: signal tallies, timeline, alerts, referrals, notes.
 */
export const getAdminStudentProfile = async (
  studentId: string,
): Promise<AdminStudentProfileBlock> => {
  const res = await api.get(`/api/v1/admin/students/${studentId}`);
  return res.data;
};

/**
 * GET /api/v1/admin/referrals
 * Counselor Escalation Log — paginated with filters.
 */
export const getAdminReferrals = async (
  params?: ReferralFilterParams,
): Promise<EscalationLogBlock> => {
  const queryParams: Record<string, any> = {};

  if (params?.status?.length) {
    // Repeat status param for multi-select: ?status=pending&status=sent
    queryParams.status = params.status;
  }
  if (params?.priority?.length) {
    queryParams.priority = params.priority;
  }
  if (params?.follow_up !== undefined) {
    queryParams.follow_up = params.follow_up;
  }
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get('/api/v1/admin/referrals', {
    params: queryParams,
    paramsSerializer: {
      indexes: null, // serialize arrays as ?status=a&status=b (no brackets)
    },
  });
  return res.data;
};

/**
 * GET /api/v1/admin/teacher-flags
 * Teacher Observation Flags (Rule-5 class threshold flags).
 */
export const getAdminTeacherFlags = async (
  status: 'open' | 'all' = 'open',
): Promise<TeacherObservationFlagListBlock> => {
  const res = await api.get('/api/v1/admin/teacher-flags', { params: { status } });
  return res.data;
};

/**
 * PUT /api/v1/admin/teacher-flags/{flagId}/acknowledge
 * Acknowledge a Teacher Observation Flag.
 */
export const acknowledgeTeacherFlag = async (
  flagId: string,
): Promise<TeacherFlagAcknowledgeResponse> => {
  const res = await api.put(`/api/v1/admin/teacher-flags/${flagId}/acknowledge`);
  return res.data;
};

/**
 * GET /api/v1/admin/trends
 * Daily stacked counts + weekly accumulation + attendance trend.
 */
export const getAdminTrends = async (
  range: '1d' | '7d' | '30d' = '7d',
): Promise<AdminTrendsBlock> => {
  const res = await api.get('/api/v1/admin/trends', { params: { range } });
  return res.data;
};

/**
 * PUT /api/v1/admin/alerts/{alertId}/resolve
 * Resolve a pattern alert with a resolution note.
 */
export const resolvePatternAlert = async (
  alertId: string,
  resolutionNote: string,
): Promise<AlertResolveResponse> => {
  const res = await api.put(`/api/v1/admin/alerts/${alertId}/resolve`, {
    resolution_note: resolutionNote,
  });
  return res.data;
};

/**
 * GET /api/v1/admin/exports/super-green
 * Super Green export — JSON payload or CSV download.
 */
export const exportSuperGreenJson = async (): Promise<SuperGreenExportPayload> => {
  const res = await api.get('/api/v1/admin/exports/super-green', {
    params: { format: 'json' },
  });
  return res.data;
};

/**
 * Download Super Green export as CSV file.
 */
export const downloadSuperGreenCsv = async (): Promise<void> => {
  const res = await api.get('/api/v1/admin/exports/super-green', {
    params: { format: 'csv' },
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `super_green_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════
//  New Admin Report Endpoints
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/reports/students
 * Student-wise report with signal counts, category breakdown, and weighted scores.
 */
export const getAdminStudentReports = async (
  params?: ReportFilterParams,
): Promise<StudentReportBlock> => {
  const queryParams: Record<string, any> = {};
  if (params?.range) queryParams.range = params.range;
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;
  if (params?.grade_level !== undefined) queryParams.grade_level = params.grade_level;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get('/api/v1/admin/reports/students', { params: queryParams });
  return res.data;
};

/**
 * GET /api/v1/admin/reports/teachers
 * Teacher-wise report with workload and signal metrics.
 */
export const getAdminTeacherReports = async (
  params?: ReportFilterParams,
): Promise<TeacherReportBlock> => {
  const queryParams: Record<string, any> = {};
  if (params?.range) queryParams.range = params.range;
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get('/api/v1/admin/reports/teachers', { params: queryParams });
  return res.data;
};

/**
 * GET /api/v1/admin/reports/grades
 * Grade-wise aggregate report with population and flag metrics.
 */
export const getAdminGradeReports = async (
  params?: ReportFilterParams,
): Promise<GradeReportBlock> => {
  const queryParams: Record<string, any> = {};
  if (params?.range) queryParams.range = params.range;
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;
  if (params?.grade_level !== undefined) queryParams.grade_level = params.grade_level;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get('/api/v1/admin/reports/grades', { params: queryParams });
  return res.data;
};

// ─── 14. Teacher Specific Drill-Down Report ───────────────────────

export interface AdminTeacherClassFlagRow {
  class_id: string;
  class_name: string;
  grade_level: number;
  super_green_count: number;
  present_count: number;
  yellow_count: number;
  red_count: number;
  absent_count: number;
  total_flags: number;
}

export interface AdminTeacherTopStudentRow {
  student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  super_green_count: number;
  present_count: number;
  yellow_count: number;
  red_count: number;
  absent_count: number;
  weighted_score: number;
}

export interface AdminTeacherSpecificReportBlock {
  teacher_id: string;
  first_name: string;
  last_name: string;
  range_days: number;
  range_start: string;
  range_end: string;
  classes: AdminTeacherClassFlagRow[];
  top_students: AdminTeacherTopStudentRow[];
}

/**
 * GET /api/v1/admin/reports/teachers/{teacher_id}
 * Drill-down report for a specific teacher's classes and most flagged students.
 */
export const getAdminTeacherSpecificReport = async (
  teacherId: string,
  params?: { range?: '1d' | '7d' | '30d'; from?: string; to?: string },
): Promise<AdminTeacherSpecificReportBlock> => {
  const queryParams: Record<string, any> = {};
  if (params?.range) queryParams.range = params.range;
  if (params?.from) queryParams.from = params.from;
  if (params?.to) queryParams.to = params.to;

  const res = await api.get(`/api/v1/admin/reports/teachers/${teacherId}`, { params: queryParams });
  return res.data;
};

/**
 * POST /api/v1/admin/reports/students/{student_id}
 * Generate an admin-scoped individual student report.
 */
export const generateAdminStudentReport = async (studentId: string, payload: any): Promise<any> => {
  try {
    const response = await api.post(`/api/v1/admin/reports/students/${studentId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate admin student report:', error?.response?.data);
    throw error;
  }
};
