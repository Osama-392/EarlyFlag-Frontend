const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('teacher pages use the shared dashboard-style loading skeletons', () => {
  const skeletons = read('components/TeacherLoadingSkeletons.tsx');

  for (const token of [
    'animate-pulse rounded bg-gray-200 dark:bg-[#2e3240]',
    'TeacherClassesSkeleton',
    'TeacherStudentListSkeleton',
    'TeacherStudentProfileSkeleton',
    'TeacherSettingsSkeleton',
    'TeacherTableRowsSkeleton',
  ]) assert.ok(skeletons.includes(token), `shared loading skeletons contain ${token}`);

  const expectations = [
    ['components/ClassesPage.tsx', '<TeacherClassesSkeleton />'],
    ['components/ReportsPage.tsx', '<TeacherClassesSkeleton label="Loading report classes" />'],
    ['components/StudentRoster.tsx', '<TeacherStudentListSkeleton />'],
    ['components/StudentProfile.tsx', '<TeacherStudentProfileSkeleton />'],
    ['app/(dashboard)/settings/page.tsx', '<TeacherSettingsSkeleton />'],
    ['components/StudentReportsView.tsx', '<TeacherStudentListSkeleton compact />'],
    ['components/QuickLogPage.tsx', '<TeacherTableRowsSkeleton />'],
  ];

  for (const [file, token] of expectations) {
    assert.ok(read(file).includes(token), `${file} renders ${token}`);
  }
});
