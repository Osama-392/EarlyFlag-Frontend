const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('teacher dashboard loading state mirrors the real dashboard sections', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/Dashboard.tsx'), 'utf8');

  for (const token of [
    'return <TeacherDashboardSkeleton />',
    'aria-label="Loading teacher dashboard"',
    '<TeacherListSkeleton title="Yellow Watch List" />',
    '<TeacherListSkeleton title="Red Urgent" />',
    '<TeacherListSkeleton title="Super Green" />',
    'Absent Students This Week',
    "['Total Signals', 'Yellow Flags', 'Red Flags', 'Super Greens'].map",
    '<TeacherChartSkeleton title="Signal Distribution" />',
    '<TeacherChartSkeleton title="Category Breakdown" />',
    'Trend Comparison',
    'Recent Recognition Highlights',
  ]) assert.ok(source.includes(token), `teacher dashboard contains ${token}`);

  for (const removed of [
    '@keyframes shimmer',
    'className="skeleton h-4 w-2/3 mb-3"',
    '--skel-color-1',
  ]) assert.ok(!source.includes(removed), `teacher dashboard omits ${removed}`);
});
