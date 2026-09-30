const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

const row = {
  class_id: 'math-6a-id', class_name: 'Math 6A', subject: 'Math', period: 1,
  teacher: { id: 'teacher', display_name: 'Mrs. Teacher' },
  counts: { present: 5, absent: 0, yellow: 1, red: 1, super_green: 0 }, latest_note: null,
};
const snapshot = {
  range_start: '2026-09-01', range_end: '2026-09-27', local_today: '2026-09-27', academic_year_start: '2026-09-01',
  class_scope: 'current_enrollments', attendance_basis: 'recorded_signals', classes: [row],
};

function harness(overrides = {}, component = "AdminClassSnapshot") {
  const source = fs.readFileSync(path.join(__dirname, `../components/${component}.tsx`), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const states = [];
  let index = 0;
  const calls = [];
  const reports = [];
  const api = {
    getAdminStudentProfile: async (...args) => { calls.push(['profile', ...args]); return { class_snapshot: snapshot }; },
    generateAdminStudentReport: async (...args) => { calls.push(['report', ...args]); return { report: { counts_selected_range: row.counts } }; },
    ...overrides,
  };
  const exports = {};
  function useState(initial) {
    const current = index++;
    if (!(current in states)) states[current] = typeof initial === 'function' ? initial() : initial;
    return [states[current], (value) => { states[current] = typeof value === 'function' ? value(states[current]) : value; }];
  }
  vm.runInNewContext(compiled, {
    exports, console, Date,
    require: (name) => {
      if (name === 'react') return { ...React, useState, useEffect: () => {}, useRef: (initial) => useState({ current: initial })[0] };
      if (name === 'lucide-react') return { ArrowRight: () => null, RefreshCw: () => null };
      if (name === '@/lib/adminDashboardService') return api;
      return require(name);
    },
  });
  const props = {
    studentId: 'student-id', snapshot, academicStart: '2026-08-01',
    busy: false, onApply: (start, end) => calls.push(['profile', 'student-id', { start_date: start, end_date: end }]),
    onSnapshot: (next) => { props.snapshot = next; }, onReport: (result) => reports.push(result),
  };
  return {
    calls, reports, props,
    render: () => { index = 0; return exports.default(props); },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('snapshot renders the requested columns, zero badges and absent notes', () => {
  const h = harness();
  const tree = h.render();
  for (const label of ['Subject / Teacher', 'Present', 'Absent', 'Yellow', 'Red', 'Super Green', 'Latest Note']) {
    assert.ok(content(tree).includes(label));
  }
  assert.ok(content(tree).includes('Mrs. Teacher'));
  assert.ok(find(tree, (el) => el.props['aria-label'] === 'Absent: 0'));
  assert.ok(content(tree).includes('No notes in this period'));
  assert.equal(find(tree, (el) => el.type === 'select'), undefined);
  h.props.snapshot = { ...snapshot, classes: [] };
  assert.ok(content(h.render()).includes('no active classes'));
});

test('View report uses the exact class and applied profile range', async () => {
  const h = harness();
  let tree = h.render();
  find(tree, (el) => el.props['aria-label'] === 'View report for Math 6A').props.onClick();
  await settle();
  assert.equal(h.calls[0][0], 'report');
  assert.equal(h.calls[0][1], 'student-id');
  assert.equal(h.calls[0][2].class_id, 'math-6a-id');
  assert.equal(h.calls[0][2].start_date, '2026-09-01');
  assert.equal(h.calls[0][2].end_date, '2026-09-27');
  assert.equal(h.calls[0][2].subject, undefined);
  assert.equal(h.reports[0].subject, 'Math 6A');
  assert.equal(h.reports[0].result.report.counts_selected_range.red, 1);
});

test('header date presets default to academic year and use school-local today', async () => {
  const h = harness({}, 'AdminProfileDateFilter');
  assert.equal(find(h.render(), (el) => el.type === 'select').props.value, 'academic');
  let tree = h.render();
  find(tree, (el) => el.type === 'select').props.onChange({ target: { value: '30d' } });
  tree = h.render();
  find(tree, (el) => el.type === 'form').props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.calls[0][2].start_date, '2026-08-29');
  assert.equal(h.calls[0][2].end_date, '2026-09-27');
  tree = h.render();
  find(tree, (el) => el.type === 'input' && el.props.type === 'date').props.onChange({ target: { value: '2026-10-01' } });
  tree = h.render();
  assert.equal(find(tree, (el) => el.type === 'button' && el.props.type === 'submit').props.disabled, true);
  assert.ok(content(tree).includes('From must be on or before To'));
});

test('failed class reports expose errors', async () => {
  const h = harness({
    getAdminStudentProfile: async () => { throw new Error('offline'); },
    generateAdminStudentReport: async () => { throw new Error('offline'); },
  });
  let tree = h.render();
  find(tree, (el) => el.props['aria-label'] === 'View report for Math 6A').props.onClick();
  await settle();
  tree = h.render();
  assert.ok(content(tree).includes('Unable to create the class report'));
});
