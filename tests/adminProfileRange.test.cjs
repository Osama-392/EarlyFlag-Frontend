const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function find(tree, predicate) {
  if (!React.isValidElement(tree)) return;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}
function content(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!React.isValidElement(tree)) return '';
  return React.Children.toArray(tree.props.children).map(content).join(' ');
}
const counts = { present: 0, absent: 0, yellow: 0, red: 0, super_green: 0 };
function profile(start, yellow, title) {
  return {
    student: { student_id: 'student', first_name: 'Test', last_name: 'Student', grade_level: 8 },
    range_start: start, range_end: '2026-09-30',
    counts_selected_range: { ...counts, yellow }, category_selected_range: { yellow_academic: yellow },
    counts_30d: { ...counts, yellow: 99 }, category_7d: { yellow_academic: 99 },
    flag_log: [{ signal_date: start, signal_type: 'yellow', title }],
    class_snapshot: { range_start: start, range_end: '2026-09-30', local_today: '2026-09-30', academic_year_start: '2026-08-01', classes: [] },
  };
}
function harness() {
  const initial = profile('2026-08-01', 8, 'Original history');
  const selected = profile('2026-09-24', 2, 'Selected history');
  let fail = false;
  let reportFail = false;
  const reportCalls = [];
  const calls = [], states = [], dependencies = [], effects = [];
  let index = 0;
  function useState(value) {
    const i = index++;
    if (!(i in states)) states[i] = typeof value === 'function' ? value() : value;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  }
  const api = { generateAdminStudentReport: async (...args) => {
    reportCalls.push(args);
    if (reportFail) throw Error('offline');
    return { report: { recent_notes: [{ excerpt: 'Teacher note' }] } };
  }, getAdminStudentProfile: async (...args) => {
    calls.push(args);
    if (fail) throw Error('offline');
    return args[1] ? selected : initial;
  } };
  const compiled = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../components/AdminStudentProfile.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, console, Date, require(name) {
    if (name === 'react') return { ...React, useState, useRef: value => useState({ current: value })[0], useEffect(fn, deps) {
      const i = index++;
      if (!dependencies[i] || deps.some((v, j) => v !== dependencies[i][j])) { dependencies[i] = deps; effects.push(fn); }
    } };
    if (name === 'next/navigation') return { useRouter: () => ({}), useSearchParams: () => ({ get: () => null }) };
    if (name === 'lucide-react') return new Proxy({}, { get: (_, name) => name });
    if (name === '@/lib/adminDashboardService') return api;
    if (name === '@/components/Toast') return { useToast: () => ({ showToast() {} }) };
    if (name === '@/app/providers') return { useAuth: () => ({ user: null }) };
    if (name === '@/lib/teacherTitle') return { formatTeacherDisplayName: () => '' };
    if (name === '@/lib/logger') return { logger: { buttonClick() {} } };
    if (name === '@/lib/reportPresentation') return require('./loadTypeScript.cjs')('../lib/reportPresentation.ts');
    if (name === '@/components/AdminLoadingSkeletons') return { AdminStudentProfileSkeleton: 'Skeleton' };
    if (name.startsWith('@/components/')) return { __esModule: true, default: name.split('/').pop() };
    return require(name);
  } });
  return { calls, reportCalls, selected, setReportFail: () => { reportFail = true; }, setFail: () => { fail = true; }, render() {
    index = 0;
    const tree = exports.default({ studentId: 'student' });
    effects.splice(0).forEach(fn => fn());
    return tree;
  } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('header filter refreshes all sections and sets Create Report dates', async () => {
  const h = harness(); h.render(); await settle();
  let tree = h.render();
  find(tree, el => el.type === 'AdminProfileDateFilter').props.onApply('2026-09-24', '2026-09-30');
  await settle(); tree = h.render();
  assert.equal(h.calls[1][1].start_date, '2026-09-24');
  const history = find(tree, el => el.type === 'StudentReportHistory').props.rows;
  assert.equal(history[0].title, 'Selected history');
  assert.ok(!content(tree).includes('Category Breakdown'));
  assert.equal(find(tree, el => typeof el.type === 'function' && el.type.name === 'CountsCard'), undefined);
  assert.equal(find(tree, el => el.type === 'AdminClassSnapshot').props.snapshot, h.selected.class_snapshot);
  assert.equal(find(tree, el => el.type === 'CreateReportModal'), undefined);
  find(tree, el => el.type === 'button' && content(el).includes('Create Report')).props.onClick();
  const pending = h.render();
  assert.equal(find(pending, el => el.type === 'button' && content(el).includes('Creating Report')).props.disabled, true);
  await settle();
  assert.equal(h.reportCalls[0][1].start_date, '2026-09-24');
  assert.equal(h.reportCalls[0][1].end_date, '2026-09-30');
  assert.equal(h.reportCalls[0][1].include_teachers_notes, true);
  assert.equal(find(h.render(), el => el.type === 'ReportView').props.reportData.result.report.recent_notes[0].excerpt, 'Teacher note');
});
test('failed profile refresh keeps the applied range and exposes a retry message', async () => {
  const h = harness(); h.render(); await settle(); h.setFail();
  find(h.render(), el => el.type === 'AdminProfileDateFilter').props.onApply('2026-09-24', '2026-09-30');
  await settle(); const tree = h.render();
  assert.ok(content(tree).includes('previous range is still shown'));
  assert.equal(find(tree, el => el.type === 'StudentReportHistory').props.rows[0].title, 'Original history');
  find(tree, el => el.type === 'button' && content(el).includes('Create Report')).props.onClick();
  await settle();
  assert.equal(h.reportCalls[0][1].start_date, '2026-08-01');
});

test('direct admin report failures keep the profile visible with retry available', async () => {
  const h = harness(); h.render(); await settle(); h.setReportFail();
  find(h.render(), el => el.type === 'button' && content(el).includes('Create Report')).props.onClick();
  await settle(); const tree = h.render();
  assert.ok(content(tree).includes('Unable to create the report'));
  assert.equal(find(tree, el => el.type === 'StudentReportHistory').props.rows[0].title, 'Original history');
  assert.equal(find(tree, el => el.type === 'button' && content(el).includes('Create Report')).props.disabled, false);
});
