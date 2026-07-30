# EarlyFlag Dashboard

EarlyFlag is a comprehensive student behavior and risk-tracking platform. It connects teachers and school administrators through a unified dashboard to monitor student performance, log behavioral flags, and streamline parent communications.

## 🚀 System Architecture

This repository contains the **Frontend** application for EarlyFlag. It is designed to work in tandem with the EarlyFlag Backend (FastAPI).

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Library:** React 18
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React

---

## 🛠 Installation & Setup

### Prerequisites
- **Node.js 18+** installed.
- **EarlyFlag Backend** running locally (usually on `http://localhost:8000`).

### Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/Osama-392/EarlyFlag-Frontend.git
   cd EarlyFlag-Frontend
   npm install
   ```

2. **Configure Environment Variables:**
   Ensure you have a `.env.local` file in the root directory pointing to your local backend API. For example:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure (App Router)

The application has been modularized and shifted from a single-page mock to a fully routed K-12 dashboard.

```text
EarlyFlag/
├── app/
│   ├── (auth)/                  # Teacher authentication pages
│   ├── (dashboard)/             # Teacher dashboard and class views
│   ├── (principal)/             # Principal/Admin dashboard views
│   ├── (principal-auth)/        # Principal authentication pages
│   ├── globals.css              # Global Tailwind styles
│   ├── layout.tsx               # Root layout providers
│   └── page.tsx                 # Landing redirect
├── components/
│   ├── AdminStudentProfile.tsx  # Detailed admin student view
│   ├── Dashboard.tsx            # Teacher dashboard
│   ├── ParentEmailTemplateModal.tsx # Dynamic email generator
│   ├── PrincipalReportsPage.tsx # Admin reporting hub
│   ├── SchoolOverviewPage.tsx   # Admin top-level analytics
│   ├── Sidebar.tsx              # Teacher navigation
│   ├── PrincipalSidebar.tsx     # Admin navigation
│   └── ...                      # Various modals and UI components
├── lib/
│   ├── adminDashboardService.ts # API calls for admin dashboard
│   ├── dashboardService.ts      # API calls for teacher dashboard
│   ├── emailTemplates.ts        # Parent email generation logic
│   └── ...                      # Data fetching and utilities
├── tailwind.config.ts           # Tailwind configuration
└── next.config.js               # Next.js configuration
```

---

## ✨ Core Features

### For Teachers
- **Class Rosters & Profiles:** View assigned classes and drill down into individual student histories.
- **Quick Logging:** Instantly log Super Green (positive), Yellow (concern), Red (urgent), or Absent flags via intuitive modals.
- **Activity Feed:** Track recent behavioral logs within the classroom.

### For Principals & Admins
- **School Overview:** Get a bird's-eye view of the entire school's behavioral health, sortable by risk level (High Risk, Medium Risk, Super Green).
- **Admin Referrals:** Manage and acknowledge active referrals triggered by teacher flags.
- **Parent Communication:** Generate dynamic, data-backed email templates (Concern Notices & Commendations) populated instantly with a student's recent flag history.
- **Reporting Hub:** Export data on teacher logging activity and student recognition directly to CSV.

---

## 🎨 Theme & Styling

The application uses a custom Tailwind theme designed to highlight critical alerts while remaining easy to read.
- **Primary:** Teal (`#0D9488`)
- **Alerts:** 
  - Red (`#EF4444`) for urgent behavioral/academic issues.
  - Amber/Yellow (`#F59E0B`) for warnings and watch lists.
  - Emerald/Green (`#10B981`) for positive recognition.

Colors and utility classes are centrally managed in `tailwind.config.ts` and `lib/categoryColors.ts`.

---

## 📝 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```
