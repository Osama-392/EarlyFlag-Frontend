# Whats Done So Far

## Completed UI Work
- Created a role-based landing page with Teacher and Principal options.
- Built separate teacher and principal authentication flows.
- Added a dedicated principal dashboard with its own layout, sidebar, and header.
- Created the School Heat Map dashboard for principal overview.
- Created the School Overview analytics page for weekly flag accumulation.
- Added principal-facing pages for Students, Teachers, Reports, and Settings.

## Role and Routing Updates
- Updated principal access to use the backend `admin` role.
- Updated principal login and layout guards to redirect admin users into the principal dashboard.
- Kept teacher login and teacher dashboard flow separate.
- Removed student login from the main landing page.

## Frontend API Endpoints Used So Far
- `POST /api/v1/auth/login` - teacher and principal/admin sign in.
- `POST /api/v1/auth/signup` - teacher signup and principal request flow.
- `POST /api/v1/auth/refresh` - refresh expired access tokens.
- `GET /api/v1/teacher/classes` - load the teacher class list.
- `POST /api/v1/teacher/classes` - create a new class.
- `GET /api/v1/teacher/classes/{classId}` - load one class by ID.
- `GET /api/v1/teacher/classes/{classId}/students` - load students for a class roster.
- `GET /api/v1/teacher/students/{studentId}/history` - load a student’s signal history.
- `POST /api/v1/teacher/signals` - batch log green, yellow, and red signals.
- `PUT /api/v1/teacher/signals/{signalId}` - update an existing signal.
- `POST /api/v1/teacher/students` - create a student record.
- `POST /api/v1/teacher/students/upload` - bulk upload students with a file.
- `POST /api/v1/teacher/enrollments` - enroll a student in a class.
- Most other dashboard screens are still using mock data and do not call the backend yet.

## Design Updates
- Aligned the principal area to a cleaner blue/teal visual style to match the teacher experience.
- Kept the School Heat Map status colors for risk indicators.
- Updated the School Overview page to use consistent theme colors.
- Reworked the Students page into a more polished card-based layout.

## Documentation Created
- Principal dashboard implementation notes.
- Testing guide for teacher and principal flows.
- Debugging notes for login redirect issues.

## Current Status
- Principal and teacher flows are separated.
- Principal access now relies on `admin` accounts.
- Principal UI is in a usable state and the Students page has been redesigned.
- Remaining work is mainly refinement, validation, and any follow-up polish requested by the user.
