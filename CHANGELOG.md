# Changelog

All notable changes to the Frontend project are documented in this file.

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
