# Phase 4 Frontend Changelog

**Date:** September 7, 2026  
**Last updated:** September 9, 2026<br>
**Project:** EarlyFlag Frontend  
**Phase:** Phase 4  
**Status:** Implemented in the local frontend working tree

## Overview

Phase 4 focused on bringing the teacher and principal dashboards in line with the canonical escalation data returned by the backend, improving the post-Red monitoring workflow, making dashboard student rows navigable, and delivering a configurable Student Profile report flow with a reliable portrait PDF export.

The work also separates the Next.js development and production build caches to prevent recurring missing-chunk and stale-cache errors when the development server and production build run near the same time.

No backend migration or new report endpoint was required for this frontend phase. The report flow continues to use the existing teacher report service.

## 1. Teacher Dashboard Escalation Workflow

### Canonical Red Urgent data

The teacher dashboard now consumes the backend's canonical Red Urgent fields:

- `escalation_id`
- `category`
- `origin`
- `active_flag_count`
- `same_category_red_count_7d`
- `is_repeat_escalation`
- `can_acknowledge`
- `acknowledged_at`
- Student class context through `class_id` and optional `class_name`

The deprecated teacher-side `alert_id` is no longer used to identify Red escalation events.

### Red acknowledgement

- Added an **Acknowledge** action to eligible Red Urgent rows.
- Acknowledgements use the canonical endpoint:
  - `POST /api/v1/teacher/red-escalations/{escalation_id}/acknowledge`
- Added in-progress state per escalation to prevent duplicate acknowledgement requests.
- Added success feedback based on the backend-provided `display_status`:
  - Another Red is still pending.
  - The student moved to Yellow Watch.
  - The student has no active flags remaining.
- Added error feedback for failed acknowledgement requests.
- The teacher dashboard is refetched after a successful acknowledgement so the Red Urgent and Yellow Watch sections immediately reflect the new state.

### Repeat Red presentation

- Repeat escalation styling is controlled only by the backend-provided `is_repeat_escalation` value.
- Repeat rows receive a stronger red background and border.
- Added a repeat badge showing the category and backend-provided seven-day repeat count.
- A repeat count of `1` does not independently trigger repeat styling; normal Red styling remains in use unless `is_repeat_escalation` is `true`.
- Added category, origin, severity, and active-flag context to each Red Urgent card.

### Dashboard refresh after signal changes

- Added a shared `dashboard-refresh` browser event.
- The event is dispatched after:
  - Logging a signal, including a direct Red or a Yellow that may trigger escalation.
  - Correcting or retracting a signal.
  - Sending a manual referral to Admin.
- The teacher dashboard listens for this event and performs a silent refetch without replacing the current UI with a full loading state.

## 2. Yellow Watch List Updates

- Updated Yellow Watch rows to use canonical active-state fields:
  - `active_flag_count`
  - `academic_flag_count`
  - `behavioral_flag_count`
  - `monitoring_after_red`
  - `monitoring_started_at`
  - `last_acknowledged_escalation_id`
  - `next_red_threshold`
- Renamed the table headings to clarify that the values represent active flags.
- Applied a persistent amber/yellow background to students being monitored after a Red acknowledgement; visibility no longer depends on hover.
- Removed the visible **Monitoring after Red** label to keep the row compact.
- Removed the old Red escalation count badge and unresolved-severity presentation from Yellow Watch rows.
- Retained the **Email** button on Yellow Watch rows.
- Email button clicks stop row navigation, allowing the email modal to open without redirecting the teacher.

## 3. Student Navigation from the Dashboard

- Yellow Watch rows on the teacher dashboard now open the student's profile.
- Red Urgent cards on the teacher dashboard now open the student's profile.
- Added keyboard navigation support using **Enter** or **Space** on focused rows.
- Added a protected direct student route:
  - `/students/{studentId}`
- Direct-profile navigation returns to the teacher dashboard through the existing back behavior.
- Red acknowledgement and email controls stop event propagation so their actions do not accidentally open the Student Profile.

## 4. Student Profile Report Entry Point

- Added an **Export Report** button to the Student Profile action bar beside the existing profile actions.
- The button opens the existing report configuration modal rather than exporting the visible Student Profile DOM.
- The official report continues to be generated through the existing `generateStudentReport` service and teacher report endpoint.
- The teacher can configure:
  - Last 30 Days.
  - Last 90 Days.
  - A custom date range.
  - Current subject or All Subjects.
  - Inclusion of teacher notes.
- A class-based Student Profile defaults to the current class subject.
- A direct `/students/{studentId}` profile defaults to **All Subjects**.
- Added loading/disabled behavior while the report request is being generated.
- The generated report opens in the existing Report View.
- Returning from the report preview returns to the same Student Profile instead of the reports list.

### Report modal date and subject corrections

- Corrected preset ranges to be inclusive:
  - Last 30 Days uses today plus the previous 29 days.
  - Last 90 Days uses today plus the previous 89 days.
- Deduplicated subject options.
- Reset the selected subject to the entry point's default whenever the modal opens.

## 5. Shared Report Filtering

- Moved global/cross-class automatic escalation detection into `lib/reportUtils.ts`.
- Both the class Reports entry point and Student Profile entry point now use the same immutable filtering utility.
- The shared filter handles reports returned as either:
  - `result.report`
  - A direct `result` report object
- Global escalation entries are consistently excluded from both `flag_log` and `recent_flags` collections.
- This prevents the two report entry points from producing different report histories for the same student and date range.

## 6. Teacher Report Preview Redesign

- Reworked the teacher preview to match the approved Student Report design.
- Added a clear student identity header with:
  - Initials.
  - Complete student name.
  - Correct ordinal grade formatting.
  - Current report status.
- Added compact KPI cards for:
  - Red incidents.
  - Yellow incidents.
  - Super Green recognitions.
- Added a structured Student History table with:
  - Date.
  - Incident level/category.
  - Description.
  - Category/Class context.
- Removed the **Action** column and **View Details** controls from both preview and PDF output.
- Added a report-period selector-style label to the history header.
- Added a dedicated Teacher Notes section when notes are enabled.
- Improved empty states for periods with no matching history or notes.

### Complete history and date-range handling

- The preview now uses the official report response rather than the visible Student Profile history DOM.
- History is filtered to the selected report start and end dates and sorted newest first.
- Date-only signal values are handled through the end of the selected day so boundary records are not lost.
- `flag_log`, `signals`, and legacy `recent_flags` responses are supported.
- The report period label supports 30-day, 90-day, and custom ranges.

### KPI count correction

- Removed the previous fixed seven-day KPI override from teacher reports.
- Teacher preview and PDF KPIs now use `counts_selected_range` supplied by the backend.
- A backend count of zero is preserved and is not replaced by another reporting window.
- KPI labels now match the actual report period, such as:
  - `30 Days`
  - `90 Days`
  - The inclusive number of days in a custom range
- Legacy responses without `counts_selected_range` fall back to counting only the history entries inside the selected report range.

## 7. Portrait PDF Export

- Replaced the teacher report's screenshot-based PDF composition with a native jsPDF renderer in `lib/teacherReportPdf.ts`.
- Teacher PDFs are generated as compressed A4 portrait documents.
- The admin report export remains on its existing export path.

### PDF layout and readability

- Student names are rendered as real PDF text and wrap when necessary instead of being clipped.
- Student initials are centered in a native circular avatar.
- Reduced the height of the identity header, KPI cards, and history rows for a more compact portrait layout.
- Preserved the report's color-coded Red, Yellow, Super Green, and neutral styles.
- Removed the Action column from exported history.
- Added consistent page margins, page numbers, and an EarlyFlag report footer.

### Pagination and data completeness

- History rows flow across pages without losing records.
- Normal rows are kept intact where possible.
- Exceptionally long history rows split safely at text lines.
- Table headings are repeated on continuation pages.
- Teacher Notes begin in their own section and continue across pages when required.
- Long notes are split safely while preserving their complete contents.
- Notes are omitted when disabled and show an appropriate empty state when enabled but empty.
- The PDF exporter reads the already-filtered preview rows so the preview and exported history use the same data, descriptions, and ordering.
- Added visible export failure feedback and retained disabled/loading feedback during PDF generation.

## 8. Admin and Principal Dashboard Alignment

### Principal Yellow Watch

- Updated the principal dashboard Yellow Watch table to use active academic, behavioral, and total flag counts.
- Applied the persistent amber monitoring background for `monitoring_after_red` students.
- Removed the obsolete Red escalation-count badge and unresolved-severity status from the Yellow Watch presentation.

### Principal Red Urgent

- Added escalation category and origin badges to principal Red Urgent entries.
- Added a separate `AdminRedUrgentRow` type so the principal dashboard can support its response shape without weakening the teacher's canonical Red Urgent contract.

### Admin referrals

- Updated referral typing to include canonical `category` and `origin` fields.
- Replaced the old Auto Red/Manual tabs with Academic/Behavioral filtering.
- Added origin labels for:
  - Automatic threshold.
  - Direct Red.
  - Manual referral.
- Updated referral card colors and badges to distinguish manual referrals from Red-origin referrals.

### Manual Admin referral validation

- Removed the implicit default category from the Send to Admin modal.
- Teachers must explicitly select **Academic** or **Behavioral**.
- Added inline category validation and support for backend category validation errors.
- Prevented modal closure while submission is in progress.
- Reset category, reason, and errors when the modal closes or completes successfully.
- Disabled submission until both a category and reason are provided.

## 9. Next.js Cache and Build Reliability

- Separated build output directories by runtime phase:
  - Development server: `.next-dev`
  - Production build/start: `.next`
- This prevents development and production processes from overwriting each other's webpack runtime and vendor chunks.
- Added `.next-dev` to `.gitignore`.
- Added `.next-dev/types/**/*.ts` to the TypeScript project include list.
- Added `npm run clean` to remove both cache directories when a clean rebuild is needed.

## 10. Validation Completed

- TypeScript validation completed successfully with `tsc --noEmit`.
- Added nine focused regression tests covering:
  - A4 portrait orientation.
  - Complete student names and centered initials as native PDF text.
  - Removal of the Action column.
  - Selected-range KPI values and labels.
  - Preservation of backend zero counts.
  - 30-day, 90-day, one-day, and custom report windows.
  - Legacy report fallback behavior.
  - Multi-page history and note ordering.
  - Very long history entries and teacher notes.
  - Included, excluded, and empty notes states.
- The focused report test suite completed with all nine tests passing.
- Browser-level PDF export validation confirmed a portrait report containing the complete preview history and notes in the same order.

## 11. Main Files Changed

| Area | Files |
| --- | --- |
| Teacher dashboard and escalation workflow | `components/Dashboard.tsx`, `lib/dashboardService.ts` |
| Signal/referral-driven refresh | `components/StudentRoster.tsx`, `components/SendAdminModal.tsx` |
| Direct Student Profile route | `app/(dashboard)/students/[studentId]/page.tsx` |
| Student Profile report entry | `components/StudentProfile.tsx`, `components/CreateReportModal.tsx` |
| Report preview and export | `components/ReportView.tsx`, `lib/teacherReportPdf.ts` |
| Shared report filtering | `lib/reportUtils.ts`, `components/StudentReportsView.tsx` |
| Principal/Admin alignment | `components/PrincipalDashboard.tsx`, `components/AdminReferralsList.tsx`, `lib/adminDashboardService.ts`, `lib/adminService.ts` |
| Cache isolation | `next.config.js`, `tsconfig.json`, `.gitignore`, `package.json` |
| Regression coverage | `tests/reportView.test.cjs`, `tests/teacherReportPdf.test.cjs` |

## 12. Acceptance Flow Delivered

```text
Teacher Dashboard
  -> Select a Yellow Watch or Red Urgent student
  -> Student Profile
  -> Export Report
  -> Select dates, subject, and notes option
  -> Generate Report
  -> Review the report preview
  -> Export the portrait PDF
  -> Return to the same Student Profile
```

---

## September 8, 2026

### Admin referral category rendering

- Removed the implicit fallback that displayed every non-`academic` referral category as **Behavioral**.
- The category badge now renders **Academic** only when the API explicitly returns `academic` and **Behavioral** only when it explicitly returns `behavioral`.
- Missing or unexpected category values no longer receive an incorrect Behavioral label.
- Updated `components/AdminReferralsList.tsx`.

### Admin Student Profile seven-day category breakdown

- Expanded the **7-Day Category Breakdown** from four cards to five cards using the response from `GET /api/v1/admin/students/{student_id}`.
- Added **Red Cross-Class** after **Red Behavioral**, using the same red styling as the other Red cards.
- The Cross-Class count is read directly from `category_7d.red_cross_class`; it is not calculated from or included in the Academic and Behavioral Red counts.
- Retained `cross_class_red_count_7d` only as a backward-compatible fallback. The value resolution order is:
  1. `category_7d.red_cross_class`
  2. `cross_class_red_count_7d`
  3. `0`
- Added null-safe `0` defaults for all five category-breakdown values.
- Updated the responsive layout to show four columns on desktop and two columns on smaller screens. The Cross-Class card spans the centered two columns on desktop and returns to a normal grid cell on smaller screens.
- Extended the frontend API response types with optional nullable definitions for `red_cross_class` and the legacy `cross_class_red_count_7d` field.
- Updated `components/AdminStudentProfile.tsx` and `lib/adminDashboardService.ts`.

### Validation

- TypeScript validation completed successfully with `npx tsc --noEmit`.
- Targeted ESLint validation completed successfully for `components/AdminStudentProfile.tsx` and `lib/adminDashboardService.ts`.

---

## September 9, 2026

### Unified Admin Referrals & Follow-Ups

- Replaced the principal dashboard's separate **Yellow Watch List** and **Red Urgent** sections with one unified **Admin Referrals & Follow-Ups** table.
- Removed frontend admin-dashboard response usage and typings for:
  - `yellow_watch_list`
  - `red_urgent`
  - `urgent_alerts`
- Updated the principal dashboard greeting banner to display the server-provided active-referral total instead of the removed urgent-alert count.
- Retained the separate **Absent This Week** supporting widget.

### Canonical Red Flags data source

- Replaced client-side referral filtering with the canonical endpoint:
  - `GET /api/v1/admin/red-flags?tab={tab}&range=all&limit=10&offset={offset}`
- Added strongly typed frontend models for Red rows, students, tabs, Red types, and the paginated response.
- Added the supported server-filtered tabs:
  - **All Reds**
  - **Academic**
  - **Behavioral**
  - **Cross-Class**
  - **Resolved**
- Reset pagination to page 1 whenever the selected tab changes.
- Used the response's server totals directly for every tab and for the active-referrals badge:
  - `all_total`
  - `academic_total`
  - `behavioral_total`
  - `cross_class_total`
  - `resolved_total`
  - `active_referrals_total`
- No frontend totals are added together, preserving the overlapping Cross-Class classification.

### Red row rendering

- Updated each row to use the canonical nested `student` object and Red event fields.
- Displayed `category` independently as **Academic** or **Behavioral**.
- Added the required `red_type` labels:
  - `escalated` → **Escalated**
  - `direct_red` → **Direct Red**
  - `manual_send` → **Manual Send**
  - `cross_class` → **Cross-Class**
- Added class, subject, primary concern, occurrence date, latest activity, follow-up status, and follow-up date presentation.
- Added student-profile navigation using the server-provided student slug with the student ID as a fallback.
- Showed the **Repeat Offender** banner only when `repeat_offender === true`.
- Used `red_events_7d` only as display data and removed any frontend repeat-window calculation.

### Acknowledge workflow

- Acknowledgements use:
  - `PUT /api/v1/admin/referrals/{referral_id}/acknowledge`
- The **Acknowledge** action is hidden when a row has no `referral_id`.
- Added a row-level in-progress state to prevent duplicate acknowledgement requests.
- After success, only the acknowledged row is removed immediately from the current active page.
- The current tab, rows, and all server totals are then refreshed in the background so the event appears under **Resolved** without a full table reset.
- When the acknowledged row was the final entry on a later page, pagination moves back to the previous valid page.
- Added inline error feedback when an acknowledgement or data refresh fails.

### Server-side pagination and interaction improvements

- Changed the page size from 50 rows to 10 rows per request.
- Added server-side pagination using the response's `total`, `limit`, and `offset` contract.
- Added **Previous** and **Next** controls, the current page indicator, and a **Showing X–Y of Z** summary.
- Kept the table and pagination controls mounted while changing tabs or pages to avoid disruptive layout shifts and blank states.
- Added a compact **Updating…** indicator and temporarily dimmed the existing rows while replacement data loads.
- Disabled stale row and pagination interactions during an in-flight page or tab request.
- Added request sequencing protection so a slower earlier response cannot overwrite a newer tab or page selection.

### Files changed

- `components/AdminReferralsList.tsx`
- `components/PrincipalDashboard.tsx`
- `lib/adminService.ts`
- `lib/adminDashboardService.ts`

### Validation

- Production build completed successfully with `npm run build`.
- TypeScript validation completed successfully with `npx tsc --noEmit`.
- Targeted ESLint validation completed successfully for the changed referral and dashboard files.
- `git diff --check` completed successfully.
- The repository-wide lint command continues to report pre-existing lint errors in unrelated screens; no new lint errors were introduced by this work.
