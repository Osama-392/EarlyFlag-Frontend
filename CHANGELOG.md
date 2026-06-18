# Changelog

All notable changes to the Frontend project are documented in this file.

## [2026-06-18]

### Added
- **Admin Student Reports**: Admins can now generate and view complete, school-wide student reports via the "Student Reports" tab.
- **"Today" Date Filter**: Added a new "Today" (1d) range option to the Admin Student, Teacher, and Grade Reports, allowing easy single-day filtering.

### Changed
- **Admin Class Roster UI**: Completely redesigned the `PrincipalClassRoster` UI into a polished, responsive 3-column card grid with status-colored top borders, color-coded avatar rings, inline badges, and signal dots.
- **Dynamic Status Badges**: Fixed an issue where the report "Status Active" badge was hardcoded to red; it now adapts dynamically to Red, Yellow, or Super Green based on the student's actual flag data.
- **Signal Count Colors**: Updated the color logic across the platform for better clarity:
  - "Present" signals now display as light green (`bg-emerald-400`).
  - "Super Green" signals now display as dark green (`bg-emerald-600`).
- **Principal Reports Page**: Removed the "Counselor Escalation Log" and set "Super Green Export" as the default tab. Removed the "Orange" text from the classroom heatmap legend. Fixed TypeScript compilation errors by cleaning up all dead code, unused imports, and state variables related to the removed referrals log.

## [2026-06-12]

### Added
- **End-of-Day QuickLog Reminder**: After 2 PM (school timezone), unlogged classes float to the top of the dashboard with an urgent sunset-gradient banner. Each class card is clickable and opens the QuickLog flow pre-selected to that class.
- **Deep-link QuickLog to Specific Class**: `QuickLogPage` and `QuickLogModal` now accept an `initialClassId` prop to launch directly into logging for a specific class.

### Changed
- **Class Logging Status Sort**: Unlogged classes now sort to the top of the "Today's Class Logging Status" list at all times, with orange highlighting during end-of-day hours.
- **Class Logging Clickable**: Unlogged class rows are now clickable, launching the QuickLog modal for that class.

## [2026-06-11]

### Added
- **3-Day Window & Signal Backlogging**: Added support to choose past dates (up to 3 days) to backfill, view, or correct classroom quick logs.
- **Multiple Concurrent Flags**: Integrated support for multiple flags per student per day (e.g., both Academic and Behavioral flags simultaneously).
- **Edit Quick Log Mode**: Updated the Quick Log interface (`components/QuickLogPage.tsx`) to retrieve, display, and edit previously saved/submitted signals.

### Changed
- **Flag and Edit Modals**: Refactored `components/FlagModal.tsx` and `components/EditSignalModal.tsx` to handle multi-flag selections and editing states.
- **API Client Mapping**: Updated frontend API clients (`lib/studentService.ts` and `lib/dashboardService.ts`) to expect flat arrays rather than nested wrapper objects for incomplete quick logs (`getIncompleteQuickLogs`) and unfinished morning brief alerts (`getUnfinishedAlerts`), matching the backend response structures.
