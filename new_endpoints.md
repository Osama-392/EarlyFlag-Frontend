1. Student-Wise Report
Endpoint: GET /api/v1/admin/reports/students
Query Parameters
Param	Type	Default	Description
range	"7d" \| "30d"	"7d"	Fixed window ending on school-local today
from	YYYY-MM-DD	—	Inclusive start date (overrides range when both from and to provided)
to	YYYY-MM-DD	—	Inclusive end date (overrides range)
grade_level	6..12	—	Optional single-grade filter
limit	1..200	50	Page size
offset	>=0	0	Pagination offset
Response Schema (StudentReportBlock)
json
{
  "range_days": 7,
  "range_start": "2026-05-05",
  "range_end": "2026-05-11",
  "limit": 50,
  "offset": 0,
  "total": 120,
  "grade_level": null,
  "students": [
    {
      "student_id": "5a7e8c10-1234-4abc-9def-0123456789ab",
      "external_student_id": "S-2024-0451",
      "first_name": "Maya",
      "last_name": "Khan",
      "grade_level": 9,
      "iep_status": false,
      "ell_status": true,
      "signal_counts": {
        "super_green": 2,
        "present": 18,
        "yellow": 3,
        "red": 1,
        "absent": 1
      },
      "category_breakdown": {
        "yellow_academic": 1,
        "yellow_behavioral": 2,
        "red_academic": 0,
        "red_behavioral": 1
      },
      "weighted_score": 6,
      "unresolved_alert_count": 1,
      "open_referral_count": 0,
      "last_flag_date": "2026-05-10",
      "enrolled_class_count": 5
    }
  ]
}
Frontend Integration Notes
Use total for pagination UI (e.g. "Showing 1-50 of 120").
weighted_score is pre-computed as red * 3 + yellow * 1 — use for ranking badges or color-coded severity indicators.
last_flag_date is null when the student has no red/yellow signals in the window.
signal_counts and category_breakdown can be rendered as stacked mini-bars or tooltip detail tables.
2. Teacher-Wise Report
Endpoint: GET /api/v1/admin/reports/teachers
Query Parameters
Same as student report, except no grade_level filter.
Response Schema (TeacherReportBlock)
json
{
  "range_days": 7,
  "range_start": "2026-05-05",
  "range_end": "2026-05-11",
  "limit": 50,
  "offset": 0,
  "total": 12,
  "teachers": [
    {
      "teacher_id": "a1b2c3d4-5678-49ab-91cd-0e1f2a3b4c5d",
      "first_name": "Maria",
      "last_name": "Diaz",
      "email": "maria.diaz@school.edu",
      "class_count": 3,
      "total_enrollments": 72,
      "signal_counts": {
        "super_green": 5,
        "present": 60,
        "yellow": 8,
        "red": 2,
        "absent": 3
      },
      "category_breakdown": {
        "yellow_academic": 3,
        "yellow_behavioral": 5,
        "red_academic": 0,
        "red_behavioral": 2
      },
      "unresolved_alert_count": 2,
      "open_referral_count": 1,
      "pending_observation_flag_count": 0,
      "most_recent_signal_date": "2026-05-11"
    }
  ]
}
Frontend Integration Notes
class_count + total_enrollments give quick teacher workload context.
pending_observation_flag_count highlights teachers whose classes triggered the 30% yellow threshold (Rule-5) — good for a warning badge.
most_recent_signal_date is null if no signals were logged in the window.
3. Grade-Wise Report
Endpoint: GET /api/v1/admin/reports/grades
Query Parameters
Same as student report, including optional grade_level filter.
Response Schema (GradeReportBlock)
json
{
  "range_days": 7,
  "range_start": "2026-05-05",
  "range_end": "2026-05-11",
  "limit": 50,
  "offset": 0,
  "total": 7,
  "grade_level": null,
  "grades": [
    {
      "grade_level": 9,
      "student_count": 145,
      "class_count": 8,
      "teacher_count": 6,
      "signal_counts": {
        "super_green": 12,
        "present": 120,
        "yellow": 18,
        "red": 4,
        "absent": 9
      },
      "category_breakdown": {
        "yellow_academic": 8,
        "yellow_behavioral": 10,
        "red_academic": 1,
        "red_behavioral": 3
      },
      "unresolved_alert_count": 5,
      "open_referral_count": 2,
      "pending_observation_flag_count": 1,
      "avg_flag_percentage": 0.077
    }
  ]
}
Frontend Integration Notes
avg_flag_percentage is the average heatmap flag % across all classes in that grade — use for grade-level color banding (green/yellow/orange/red).
student_count, class_count, teacher_count give population context for the grade.
Rows are sorted by grade_level ascending (6 through 12).
Reusable Sub-Schemas
Both SignalCountsByType and ReportCategoryBreakdown are reused across all three reports:
SignalCountsByType
ts
interface SignalCountsByType {
  super_green: number;
  present: number;
  yellow: number;
  red: number;
  absent: number;
}
ReportCategoryBreakdown
ts
interface ReportCategoryBreakdown {
  yellow_academic: number;
  yellow_behavioral: number;
  red_academic: number;
  red_behavioral: number;
}
Common Patterns
Date Range Handling
ts
// Fixed range (default)
const params = new URLSearchParams({ range: "7d" });

// Custom date override
const params = new URLSearchParams({
  from: "2026-05-01",
  to: "2026-05-14"
});
// `range` is ignored when both `from` and `to` are present
Pagination
ts
const fetchPage = async (offset: number, limit: number = 50) => {
  const res = await fetch(
    `/api/v1/admin/reports/students?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data: StudentReportBlock = await res.json();
  return data;
};
Error Handling
All three endpoints share the standard auth/limiter responses:
401 — Missing or invalid token
403 — Admin or principal role required
429 — Rate limit exceeded
