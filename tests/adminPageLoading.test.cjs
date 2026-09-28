const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('admin pages use complete structural loading skeletons', () => {
  const skeletons = read('components/AdminLoadingSkeletons.tsx');

  for (const token of [
    'AdminWorkspaceSkeleton',
    'AdminClassesSkeleton',
    'AdminClassRosterSkeleton',
    'AdminStudentProfileSkeleton',
    'AdminRankingSkeleton',
    'AdminInactiveTeachersSkeleton',
    'AdminLeaderboardSkeleton',
    'AdminSchoolOverviewSkeleton',
    'AdminSettingsSkeleton',
    'AdminTeachersSkeleton',
    'AdminTeacherCardsSkeleton',
    'AdminReportTableSkeleton',
    'AdminTableSkeleton',
  ]) assert.ok(skeletons.includes(token), `shared admin loading skeletons contain ${token}`);

  const expectations = [
    ['app/(principal)/layout.tsx', '<AdminWorkspaceSkeleton label="Loading admin workspace content" />'],
    ['app/(principal)/principal-settings/page.tsx', '<AdminSettingsSkeleton />'],
    ['components/PrincipalStudentsPage.tsx', '<AdminClassesSkeleton />'],
    ['components/PrincipalClassRoster.tsx', '<AdminClassRosterSkeleton />'],
    ['components/AdminStudentProfile.tsx', '<AdminStudentProfileSkeleton />'],
    ['components/PrincipalStudentRankingPage.tsx', '<AdminRankingSkeleton mode={mode} />'],
    ['components/PrincipalInactiveTeachersPage.tsx', '<AdminInactiveTeachersSkeleton />'],
    ['components/TeacherLeaderboardPage.tsx', '<AdminLeaderboardSkeleton />'],
    ['components/SchoolOverviewPage.tsx', '<AdminSchoolOverviewSkeleton />'],
    ['components/PrincipalTeachersPage.tsx', '<AdminTeachersSkeleton />'],
    ['components/PrincipalTeachersPage.tsx', '<AdminTeacherCardsSkeleton />'],
    ['components/PrincipalReportsPage.tsx', '<AdminReportTableSkeleton'],
  ];

  for (const [file, token] of expectations) {
    assert.ok(read(file).includes(token), `${file} renders ${token}`);
  }
});

test('admin route-level loaders no longer use centered spinners or generic loading slabs', () => {
  for (const file of [
    'app/(principal)/layout.tsx',
    'app/(principal)/principal-settings/page.tsx',
    'components/PrincipalStudentsPage.tsx',
    'components/PrincipalClassRoster.tsx',
    'components/AdminStudentProfile.tsx',
    'components/PrincipalStudentRankingPage.tsx',
    'components/PrincipalInactiveTeachersPage.tsx',
    'components/TeacherLeaderboardPage.tsx',
    'components/SchoolOverviewPage.tsx',
  ]) {
    const source = read(file);
    assert.ok(!source.includes('h-80 animate-pulse rounded-xl'), `${file} has no generic loading slab`);
    assert.ok(!source.includes('animate-spin rounded-full h-8 w-8'), `${file} has no route spinner`);
    assert.ok(!source.includes('animate-spin rounded-full h-12 w-12'), `${file} has no route spinner`);
  }
});
