const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAdminDashboardService(api) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/adminDashboardService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    console,
    Blob,
    require: (name) => name === './api' ? { __esModule: true, default: api } : require(name),
  });
  return exports;
}

test('full ranking clients use the dedicated backend-ranked endpoints', async () => {
  const calls = [];
  const api = {
    get: async (url, options) => {
      calls.push({ url, options });
      return { data: { total: 0, limit: options.params.limit, offset: options.params.offset, students: [] } };
    },
  };
  const service = loadAdminDashboardService(api);

  await service.getAdminAtRisk(20, 0);
  await service.getAdminImproving(20, 20);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { url: '/api/v1/admin/students/at-risk', options: { params: { limit: 20, offset: 0 } } },
    { url: '/api/v1/admin/students/improving', options: { params: { limit: 20, offset: 20 } } },
  ]);
});

test('dashboard renders server ranking blocks and installs all refresh triggers', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/PrincipalDashboard.tsx'), 'utf8');

  for (const token of [
    'dashboard.most_at_risk.students.map',
    'dashboard.most_at_risk.total',
    'student.academic_active_flags',
    'student.behavioral_active_flags',
    'student.red_count_7d',
    'student.active_flag_change_7d',
    'dashboard.students_improving.students.map',
    'dashboard.students_improving.total',
    'student.previous_active_flag_count',
    'student.current_active_flag_count',
    'student.net_decrease',
    "window.addEventListener('dashboard-refresh'",
    "window.addEventListener('focus'",
    'window.setInterval(refresh, 60_000)',
    '<AdminReferralsListSkeleton />',
    '<SchoolHeatmapSkeleton />',
    '<DepartmentOverviewSkeleton />',
    '<AdminTeacherMonitoringCards loading />',
  ]) assert.ok(source.includes(token), `dashboard contains ${token}`);

  assert.ok(!source.includes('getAdminMostFlagged'));
  assert.ok(!source.includes('most_at_risk.students.sort'));
  assert.ok(!source.includes('students_improving.students.sort'));
  assert.ok(!source.includes('h-28 bg-gray-200 rounded-xl'));
  assert.ok(!source.includes('h-44 bg-gray-200 rounded-xl'));
});

test('inactive-teacher full list client uses the backend activity endpoint', async () => {
  const calls = [];
  const api = {
    get: async (url, options) => {
      calls.push({ url, options });
      return { data: { threshold_days: 7, total: 0, total_teachers: 0, limit: 50, offset: 0, teachers: [] } };
    },
  };
  const service = loadAdminDashboardService(api);

  await service.getAdminInactiveTeachers(7, 50, 0);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    {
      url: '/api/v1/admin/teachers/inactive',
      options: { params: { threshold_days: 7, limit: 50, offset: 0 } },
    },
  ]);
});

test('dashboard teacher monitoring uses composite blocks without frontend ranking', () => {
  const dashboard = fs.readFileSync(path.join(__dirname, '../components/PrincipalDashboard.tsx'), 'utf8');
  const cards = fs.readFileSync(path.join(__dirname, '../components/AdminTeacherMonitoringCards.tsx'), 'utf8');

  for (const token of [
    "const range = '7d' as const",
    'dashboard?.teacher_escalations',
    'dashboard?.teachers_not_logging_in',
  ]) assert.ok(dashboard.includes(token), `dashboard contains ${token}`);

  for (const token of [
    'Math.round(escalation.threshold_percentage)',
    'escalation.yellow_count} / {escalation.total_student_count',
    "escalation.severity === 'high'",
    'formatEscalationDate(escalation.escalation_date)',
    'flag.threshold_percentage >= 37.5',
    'teacher.days_since_recording} days',
    'formatRecordedDate(teacher.last_data_recorded_at)',
    'teacher.class_name}{teacher.class_period != null',
    '/principal-classes/${escalation.class_id}',
    '/principal-classes/${teacher.class_id}',
    'No active teacher escalations',
    'All teachers have been active recently',
  ]) assert.ok(cards.includes(token), `teacher monitoring cards contain ${token}`);

  assert.ok(!cards.includes('.sort('));
  assert.ok(!cards.includes('Date.now()'));
});

test('teacher escalations preserve event identity, dates, and individual acknowledgements', () => {
  const service = fs.readFileSync(path.join(__dirname, '../lib/adminDashboardService.ts'), 'utf8');
  const dashboardCards = fs.readFileSync(path.join(__dirname, '../components/AdminTeacherMonitoringCards.tsx'), 'utf8');
  const fullList = fs.readFileSync(path.join(__dirname, '../components/PrincipalTeachersPage.tsx'), 'utf8');

  assert.ok(service.includes('escalation_date: string'));
  assert.ok(dashboardCards.includes('key={escalation.flag_id}'));
  assert.ok(fullList.includes('key={flag.flag_id}'));
  assert.ok(fullList.includes('formatEscalationDate(flag.escalation_date)'));
  assert.ok(fullList.includes('getAdminTeacherFlags(obsFlagStatus)'));
  assert.ok(fullList.includes('setObsFlags(f => f.filter(fl => fl.flag_id !== flagId))'));
  assert.ok(fullList.includes("if (obsFlagStatus === 'open')"));
  assert.ok(fullList.includes("window.dispatchEvent(new Event('dashboard-refresh'))"));
  assert.ok(!fullList.includes('new Date(flag.triggered_at)'));
});

test('teacher escalation clients request open/history records and acknowledge by flag id', async () => {
  const calls = [];
  const api = {
    get: async (url, options) => {
      calls.push({ method: 'get', url, options });
      return { data: { flags: [] } };
    },
    put: async (url) => {
      calls.push({ method: 'put', url });
      return { data: { flag_id: 'flag-2', is_acknowledged: true } };
    },
  };
  const service = loadAdminDashboardService(api);

  await service.getAdminTeacherFlags('open');
  await service.getAdminTeacherFlags('all');
  await service.acknowledgeTeacherFlag('flag-2');

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { method: 'get', url: '/api/v1/admin/teacher-flags', options: { params: { status: 'open' } } },
    { method: 'get', url: '/api/v1/admin/teacher-flags', options: { params: { status: 'all' } } },
    { method: 'put', url: '/api/v1/admin/teacher-flags/flag-2/acknowledge' },
  ]);
});
