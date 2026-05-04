# EarlyFlag Dashboard - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 18+** must be installed
  - Download: https://nodejs.org/
  - Verify: Run `node --version` and `npm --version`

### Option 1: Quick Setup (Windows)
1. Double-click `setup.bat`
2. Follow the prompts
3. Manually copy code from `CODE_FILES_PART1.md`, `PART2.md`, `PART3.md`
4. Run `npm run dev`

### Option 2: Manual Setup

#### Step 1: Create Directories
```bash
cd "F:\Bave Office\Projects\Earlyflag"
mkdir app components lib types
```

#### Step 2: Copy Files
Copy code from the CODE_FILES markdown files:

**From CODE_FILES_PART1.md:**
- `types/index.ts`
- `lib/mockData.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`

**From CODE_FILES_PART2.md:**
- `components/Sidebar.tsx`
- `components/Header.tsx`
- `components/StatsCards.tsx`
- `components/YellowWatchList.tsx`

**From CODE_FILES_PART3.md:**
- `components/RedUrgent.tsx`
- `components/SevenDayBreakdown.tsx`
- `components/RecentActivity.tsx`
- `components/SuperGreenRecognition.tsx`

#### Step 3: Install Dependencies
```bash
npm install
```

#### Step 4: Run Development Server
```bash
npm run dev
```

#### Step 5: Open in Browser
Navigate to: http://localhost:3000

---

## 📁 Project Structure

```
Earlyflag/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with sidebar
│   └── page.tsx            # Home page
├── components/
│   ├── Header.tsx          # Top navigation bar
│   ├── Sidebar.tsx         # Left sidebar navigation
│   ├── StatsCards.tsx      # 3 metric cards
│   ├── YellowWatchList.tsx # Watch list table
│   ├── RedUrgent.tsx       # Urgent alerts
│   ├── SevenDayBreakdown.tsx # Bar chart
│   ├── RecentActivity.tsx  # Activity timeline
│   └── SuperGreenRecognition.tsx # Teacher recognition
├── lib/
│   └── mockData.ts         # Mock data for all components
├── types/
│   └── index.ts            # TypeScript interfaces
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind config
├── next.config.js         # Next.js config
└── CODE_FILES_PART*.md    # Source code reference

```

---

## 🎨 Design Features

### Color Palette
- **Primary (Teal)**: `#0D9488` (buttons, accents)
- **Yellow**: `#FBBF24` (warnings, watch list)
- **Red**: `#EF4444` (urgent alerts)
- **Blue**: `#3B82F6` (info, stats)
- **Green**: `#10B981` (recognition, positive)

### Key Components

1. **Stats Cards**
   - Students Flagged (blue)
   - Yellow Flags (yellow)
   - Red Flags (red)
   - Trend indicators with percentages

2. **Yellow Watch List**
   - Student table with avatars
   - Academic/Behavioral/Total flags
   - Streak indicators
   - Pagination footer

3. **Red Urgent**
   - Priority alert cards
   - Student info with age badges
   - Flag counts and contact times
   - Expandable details

4. **7-Day Breakdown**
   - Interactive bar chart
   - Mon-Sun weekly view
   - Color-coded categories
   - Total week summary

5. **Recent Activity**
   - Timeline feed
   - Icon-based activity types
   - Timestamps
   - Student mentions

6. **Super Green Recognition**
   - Teacher achievement cards
   - Star badges
   - Period indicators
   - Green gradient background

---

## 🔧 Customization

### Changing Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    500: '#14b8a6',  // Change this
    600: '#0d9488',  // And this
  },
}
```

### Adding Mock Data
Edit `lib/mockData.ts` to add more students, activities, etc.

### Modifying Layout
- Sidebar width: `components/Sidebar.tsx` (currently `w-64`)
- Grid columns: `app/page.tsx` (`grid-cols-3`)
- Spacing: Adjust `space-y-6` and `gap-6` values

---

## 🐛 Troubleshooting

### "Cannot find module" errors
- Ensure all directories exist: `app`, `components`, `lib`, `types`
- Run `npm install` to install dependencies
- Restart dev server

### Styles not loading
- Check `app/globals.css` exists
- Verify `tailwind.config.ts` is configured
- Clear browser cache (Ctrl + Shift + R)

### TypeScript errors
- Ensure all files have correct extensions (`.ts`, `.tsx`)
- Verify `tsconfig.json` is present
- Restart VS Code or editor

### Port 3000 already in use
- Next.js will auto-select another port
- Or manually specify: `npm run dev -- -p 3001`

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

---

## ✨ Features Implemented

- ✅ Full dashboard layout matching Figma
- ✅ Responsive sidebar navigation
- ✅ Search bar in header
- ✅ 3 statistics cards with trends
- ✅ Yellow watch list table with sorting
- ✅ Red urgent alerts panel
- ✅ Interactive 7-day bar chart
- ✅ Recent activity timeline
- ✅ Super Green recognition cards
- ✅ Hover states and transitions
- ✅ TypeScript type safety
- ✅ Tailwind CSS styling
- ✅ Mock data matching design

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Routing**: Create pages for Students, Flags, Analytics, etc.
2. **API Integration**: Replace mock data with real API calls
3. **State Management**: Add Zustand or Redux for global state
4. **Authentication**: Implement login/logout functionality
5. **Database**: Connect to backend (MongoDB, PostgreSQL, etc.)
6. **Real-time Updates**: Add WebSocket support
7. **Filters & Search**: Enhance filtering capabilities
8. **Export Reports**: Add PDF/Excel export functionality
9. **Dark Mode**: Implement theme switching
10. **Mobile Optimization**: Further responsive improvements

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all files are in correct locations
3. Ensure Node.js version is 18 or higher
4. Review the CODE_FILES markdown files for code accuracy

---

## 📄 License

This project is created for demonstration purposes.

---

**Built with:**
- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS 3
- Lucide React (icons)
