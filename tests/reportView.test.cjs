const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadTypeScript(relativePath, overrides = {}) {
  const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, console, require: (name) => overrides[name] || require(name),
  });
  return exports;
}

const { createTeacherReportPdf } = loadTypeScript('../lib/teacherReportPdf.ts');
const { createAdminReportPdf } = loadTypeScript('../lib/adminReportPdf.ts');

function findElement(tree, predicate) {
  if (!React.isValidElement(tree)) return undefined;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
}

async function previewAndExport(report, settings = {}) {
  let exported;
  const ReportView = loadTypeScript('../components/ReportView.tsx', {
    // Supply only the hook state and empty DOM snapshot needed by the export
    // handler. The preview markup and PDF renderer are the production code.
    react: {
      ...React, useState: (initial) => [initial, () => {}],
      useRef: () => ({ current: { querySelectorAll: () => [], querySelector: () => null } }),
    },
    '@/app/providers': { useAuth: () => ({ user: { role: 'teacher' } }) },
    '@/lib/logger': { logger: { buttonClick: () => {} } },
    '@/lib/teacherReportPdf': {
      createTeacherReportPdf: (data) => {
        exported = { data, pdf: createTeacherReportPdf(data) };
        return { save: () => {} };
      },
    },
    '@/lib/adminReportPdf': { createAdminReportPdf },
  }).default;
  const tree = ReportView({
    student: { id: 'test-student', name: 'Mateo Elijah', initial: 'ME', gradeLevel: 7, bgColor: '' },
    reportData: { start_date: '2026-08-09', end_date: '2026-09-07', subject: 'Science 7B', ...settings, result: { report } },
    variant: 'teacher', onBack: () => {},
  });
  const html = renderToStaticMarkup(tree);
  const button = findElement(tree, (element) => element.props.title === 'Export Student Report as PDF');
  assert.ok(button, 'Export PDF action is available');
  await button.props.onClick();
  assert.ok(exported, 'Export action generates a PDF');
  return { html, ...exported };
}

async function assertSummary(report, expected, label, settings) {
  const { html, data, pdf } = await previewAndExport(report, settings);
  const counts = [expected.red, expected.yellow, expected.superGreen];
  const titles = ['Red Incidents', 'Yellow Incidents', 'Super Green'];
  titles.forEach((title, index) => {
    assert.ok(html.includes(`>${counts[index]}</p><h3 class="mt-1 text-sm font-extrabold text-[#0b1f41]">${title} (${label})</h3>`));
  });
  assert.equal(JSON.stringify(data.counts), JSON.stringify(expected));
  assert.equal(data.countPeriodLabel, label);
  const pdfText = pdf.internal.pages.slice(1).map((page) => page.join('\n')).join('\n');
  for (const title of titles) assert.ok(pdfText.includes(`${title} \\(${label}\\)`));
  assert.doesNotMatch(html, /Incidents \(7 Days\)|Super Green \(7 Days\)/);
}

const windows = {
  counts_7d: { red: 1, yellow: 2, super_green: 3 },
  counts_30d: { red: 4, yellow: 5, super_green: 6 },
  summary_counts: { window_7d: { red: 7, yellow: 8, super_green: 9 } },
};

test('30-day preview and PDF use backend selected-range totals, not seven-day counts or history length', async () => {
  await assertSummary({ ...windows, counts_selected_range: { red: 31, yellow: 42, super_green: 53 }, flag_log: [] },
    { red: 31, yellow: 42, superGreen: 53 }, '30 Days');
});

test('zero selected-range counts remain zero despite nonzero dashboard windows', async () => {
  await assertSummary({ ...windows, counts_selected_range: { red: 0, yellow: 0, super_green: 0 } },
    { red: 0, yellow: 0, superGreen: 0 }, '30 Days');
});

test('backend dates and totals determine labels for 90-day and custom reports', async () => {
  for (const [start, end, label] of [
    ['2026-06-10', '2026-09-07', '90 Days'],
    ['2026-08-27', '2026-09-07', '12 Days'],
    ['2026-09-07', '2026-09-07', '1 Day'],
  ]) {
    await assertSummary({ ...windows, selected_range_start: start, selected_range_end: end,
      counts_selected_range: { red: 10, yellow: 20, super_green: 30 } },
    { red: 10, yellow: 20, superGreen: 30 }, label);
  }
});

test('legacy responses without selected totals count only history in the requested range', async () => {
  await assertSummary({ ...windows, flag_log: [
    { signal_type: 'red', signal_date: '2026-08-09' },
    { signal_type: 'yellow', signal_date: '2026-09-07' },
    { signal_type: 'super_green', signal_date: '2026-08-15' },
    { signal_type: 'red', signal_date: '2026-08-08' },
    { signal_type: 'yellow', signal_date: '2026-09-08' },
  ] }, { red: 1, yellow: 1, superGreen: 1 }, '30 Days');
});

test('admin preview and export use the native PDF renderer with canonical Red data', async () => {
  let exported;
  const ReportView = loadTypeScript('../components/ReportView.tsx', {
    react: {
      ...React, useState: (initial) => [initial, () => {}], useRef: () => ({ current: {} }),
    },
    '@/app/providers': { useAuth: () => ({ user: { role: 'admin' } }) },
    '@/lib/logger': { logger: { buttonClick: () => {} } },
    '@/lib/teacherReportPdf': {
      createTeacherReportPdf,
    },
    '@/lib/adminReportPdf': {
      createAdminReportPdf: (data) => {
        exported = { data, pdf: createAdminReportPdf(data) };
        return { save: () => {} };
      },
    },
  }).default;
  const tree = ReportView({
    student: { id: 'student-1', name: 'Arthur O’Connor', initial: 'AO', gradeLevel: 8, bgColor: '' },
    reportData: {
      start_date: '2026-08-09', end_date: '2026-09-07', subject: 'All Subjects',
      includeTeachersNotes: true, includeAIRecommendations: true,
      result: {
        report: {
          student: { external_student_id: 'S-2042', iep_status: true, ell_status: false },
          counts_selected_range: { red: 3, yellow: 3, super_green: 2, present: 15, absent: 1 },
          counts_7d: { red: 1, yellow: 1, super_green: 0, present: 4, absent: 0 },
          counts_30d: { red: 4, yellow: 3, super_green: 2, present: 15, absent: 1 },
          counts_semester: { red: 5, yellow: 4, super_green: 3, present: 20, absent: 2 },
          category_7d: { yellow_academic: 1, yellow_behavioral: 0, red_academic: 1, red_behavioral: 0 },
          selected_range_start: '2026-08-09', selected_range_end: '2026-09-07',
          flag_log: [{
            signal_date: '2026-09-04', signal_type: 'yellow', category: 'academic',
            title: 'Needs support', description: 'Missing assignments',
            class_name: 'Religion 8A', teacher_name: 'Mark Twain',
          }],
          unresolved_alerts: [], recent_referrals: [],
          talking_points: ['Schedule a family check-in.'],
          recent_notes: [{ signal_date: '2026-09-03', class_name: 'Religion 8A', note: 'Reviewed the support plan.' }],
        },
        red_summary: {
          range_start: '2026-08-09', range_end: '2026-09-07', red_count: 4,
          academic_red_count: 2, behavioral_red_count: 1, cross_class_red_count: 1,
        },
      },
    },
    variant: 'admin', onBack: () => {}, backLabel: 'Back to Student Profile',
  });
  const html = renderToStaticMarkup(tree);

  for (const expected of [
    'Arthur O’Connor', 'S-2042', 'Last 30 Days', 'All Subjects',
    'Canonical Red Summary', 'Cross-Class', 'Student History',
    'Recommended Next Steps', 'Schedule a family check-in.',
    'Teachers Notes', 'Reviewed the support plan.', 'Back to Student Profile',
  ]) assert.ok(html.includes(expected), `admin preview includes ${expected}`);
  assert.match(html, /text-lg font-bold text-red-600">4<\/p><p[^>]*>Red<\/p>/);
  assert.ok(!html.includes('Last 7 Days'));
  assert.ok(!html.includes('Semester ('));
  assert.ok(!html.includes('Unresolved Alerts'));
  assert.ok(!html.includes('Counselor / Admin Referrals'));
  assert.ok(!html.includes('7-Day Category Breakdown'));
  assert.ok(!html.includes('Yellow Academic'));
  assert.ok(!html.includes('Red Behavioral'));
  assert.ok(!html.includes('max-h-96'));
  assert.doesNotMatch(html, /class="[^"]*overflow-y-auto/);
  assert.ok(!html.includes('Repeat offender'));
  assert.ok(!html.includes('Red Events (7d)'));

  const button = findElement(tree, (element) => element.props.title === 'Export Student Report as PDF');
  assert.ok(button, 'Admin Export PDF action is available');
  await button.props.onClick();
  assert.ok(exported, 'Admin export action generates a native PDF');
  assert.equal(exported.data.studentId, 'S-2042');
  assert.deepEqual(JSON.parse(JSON.stringify(exported.data.counts)), {
    superGreen: 2, present: 15, yellow: 3, red: 4, absent: 1,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(exported.data.canonicalRed)), {
    total: 4, academic: 2, behavioral: 1, crossClass: 1,
    range: 'Aug 9, 2026 - Sep 7, 2026',
  });
  assert.equal(exported.data.history.length, 1);
  const pdfText = exported.pdf.internal.pages.slice(1).map((page) => page.join('\n')).join('\n');
  assert.ok(pdfText.includes('Canonical Red Summary'));
  assert.ok(pdfText.includes('Cross-Class'));
  assert.ok(pdfText.includes('Needs support'));
  assert.ok(pdfText.includes('Missing assignments'));
  assert.ok(pdfText.includes('Religion 8A'));
  assert.ok(pdfText.includes('Mark Twain'));
  assert.ok(pdfText.includes('Recommended Next Steps'));
  assert.ok(pdfText.includes('Schedule a family check-in.'));
  assert.ok(pdfText.includes('Teachers Notes'));
  assert.ok(pdfText.includes('Reviewed the support plan.'));
  for (const label of ['Super Green', 'Present', 'Yellow', 'Red', 'Absent']) {
    assert.ok(pdfText.includes(label), `Admin PDF includes ${label} report-period metric`);
  }
  assert.doesNotMatch(exported.pdf.output(), /\/Subtype \/Image/);
});
