const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = require('./loadTypeScript.cjs');
const { createAdminReportPdf } = load('../lib/adminReportPdf.ts');

function find(tree, predicate) {
  if (!React.isValidElement(tree)) return;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    const result = find(child, predicate); if (result) return result;
  }
}
async function preview(result, settings = {}, variant = 'admin') {
  let exported;
  const View = load('../components/ReportView.tsx', {
    react: { ...React, useState: value => [value, () => {}], useRef: () => ({ current: null }), useEffect: () => {} },
    '@/app/providers': { useAuth: () => ({ user: { role: variant } }) },
    '@/lib/adminReportPdf': { createAdminReportPdf: data => {
      exported = { data, pdf: createAdminReportPdf(data) }; return { save: () => {} };
    } },
  }).default;
  const tree = View({ student: { id: 'student', name: 'Xavier Kensington', initial: 'XK', gradeLevel: 6, bgColor: '' },
    reportData: { start_date: '2026-09-25', end_date: '2026-10-01', subject: 'All Subjects', ...settings, result },
    variant, onBack: () => {},
  });
  const html = renderToStaticMarkup(tree);
  find(tree, node => node.props.title === 'Export Student Report as PDF').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(exported);
  return { html, ...exported };
}
const row = { class_id: 'math', class_name: 'Math 6A', teacher_name: 'Mr. Criss Mark', signal_date: '2026-09-28', signal_type: 'red', category: 'academic', title: 'Cheating', description: 'Teacher note on this incident' };
const report = {
  selected_range_start: '2026-09-25', selected_range_end: '2026-10-01',
  report_class: { class_id: 'math', class_name: 'Math 6A', teacher_name: 'Mr. Criss Mark' },
  counts_selected_range: { super_green: 0, yellow: 2, red: 2, present: 2, absent: 0 },
  class_history: [row],
};

test('admin and teacher exact-class reports have identical previews and PDF data', async () => {
  const teacher = await preview({ report }, { class_id: 'math' }, 'teacher');
  const admin = await preview({ report, red_summary: { red_count: 99 }, class_snapshot: { classes: [] } }, { class_id: 'math' });
  assert.equal(admin.html, teacher.html);
  assert.equal(JSON.stringify(admin.data), JSON.stringify(teacher.data));
  for (const label of ['CLASS REPORT', 'Math 6A Attendance', 'Present', 'Absent', 'Red - Academic', 'Cheating', 'Teacher note on this incident', 'Sep 25, 2026']) assert.ok(admin.html.includes(label), label);
  for (const removed of ['Red Summary', 'Category Breakdown', 'Class-by-Class Snapshot', 'Cross-Class Alert']) assert.ok(!admin.html.includes(removed), removed);
  assert.equal(admin.data.counts.red, 2);
});

test('overview cards match class totals and show cross-class alerts separately', async () => {
  const result = await preview({
    report: { ...report, report_class: null, counts_selected_range: { red: 99 },
      class_history: [row, { ...row, class_id: 'spanish', class_name: 'Spanish 6A', signal_type: 'yellow', category: 'behavioral', title: 'Off task' }],
      cross_class_alerts: [{ occurred_on: '2026-09-30', description: '3 Yellows in 3 classes within 7 days', contributions: [{ class_name: 'Math 6A', signal_date: '2026-09-28' }] }],
    },
    class_snapshot: { classes: [
      { class_name: 'Math 6A', teacher: { display_name: 'Mr. Criss Mark' }, counts: { super_green: 0, yellow: 2, red: 2, present: 2, absent: 0 } },
      { class_name: 'Spanish 6A', teacher: { display_name: 'Miss Rachel Green' }, counts: { super_green: 0, yellow: 3, red: 0, present: 1, absent: 0 } },
    ] },
  });
  assert.equal(result.data.counts.red, 2); assert.equal(result.data.counts.yellow, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.categories)), { yellowBehavioral: 1, yellowAcademic: 0, redBehavioral: 0, redAcademic: 1 });
  assert.equal(result.data.crossClassAlerts[0].items[0].className, 'Math 6A');
  for (const label of ['1 Cross-Class Alert', 'Math 6A', 'Sep 28, 2026', 'Class Snapshot', 'Red - Academic', 'Yellow - Behavioral']) assert.ok(result.html.includes(label), label);
  assert.ok(!result.html.includes('Latest Note')); assert.ok(!result.html.includes('Red Summary'));
});

test('notes opt-out removes notes from history and PDF while retaining descriptions', async () => {
  const result = await preview({ report }, { class_id: 'math', include_teachers_notes: false });
  assert.ok(result.html.includes('Cheating')); assert.ok(!result.html.includes('Teacher note on this incident'));
  assert.ok(!result.html.includes('Teacher Note'));
  assert.equal(result.data.history[0].description, '');
  const pdf = result.pdf.internal.pages.flat().join('\n');
  assert.ok(!pdf.includes('Teacher note on this incident')); assert.ok(pdf.includes('Cheating'));
});

test('selected-range history is complete beyond 100 entries and excludes outside dates', async () => {
  const rows = Array.from({ length: 130 }, (_, i) => ({ ...row, title: `Incident ${i}` }));
  rows.push({ ...row, signal_date: '2026-09-24', title: 'Outside period' });
  const result = await preview({ report: { ...report, class_history: rows } }, { class_id: 'math' });
  assert.equal(result.data.history.length, 130); assert.ok(result.html.includes('Incident 129'));
  assert.equal(result.data.categories.redAcademic, 130);
  assert.ok(!result.html.includes('Outside period'));
  assert.ok(result.pdf.internal.pages.flat().join('\n').includes('Incident 129'));
});

test('empty classes and zero selected totals remain empty and zero', async () => {
  const result = await preview({ report: { ...report, class_history: [], counts_selected_range: { red: 0, yellow: 0, super_green: 0 }, flag_log: [row] } }, { class_id: 'math' });
  assert.equal(result.data.counts.red, 0); assert.equal(result.data.history.length, 0);
  assert.ok(result.html.includes('No student history in this period.'));
});

test('report navigation resets the actual scrolling ancestors', () => {
  const { scrollReportToTop } = load('../lib/reportPresentation.ts');
  const main = { scrollTop: 1800, parentElement: null };
  const wrapper = { scrollTop: 250, parentElement: main };
  scrollReportToTop({ parentElement: wrapper });
  assert.equal(main.scrollTop, 0); assert.equal(wrapper.scrollTop, 0);
});
