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
