const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the same TypeScript renderer used by the Export PDF button without
// a Next.js server, browser session, or a second build writing to its cache.
const source = fs.readFileSync(path.join(__dirname, '../lib/teacherReportPdf.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require });
const { createTeacherReportPdf } = exportsObject;
const base = {
  name: 'Mateo Elijah', initials: 'ME', grade: '7th Grade', status: 'Red',
  period: 'Last 30 Days', countPeriodLabel: '30 Days', subject: 'Science 7B', counts: { red: 4, yellow: 6, superGreen: 0 },
  history: [],
};
const pages = (pdf) => pdf.internal.pages.slice(1).map((commands) => commands.join('\n'));

test('portrait A4 has complete name and initials as real PDF text, without the Action column', () => {
  const pdf = createTeacherReportPdf(base);
  assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 210) < 0.1);
  assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - 297) < 0.1);
  const output = pages(pdf).join('\n');
  assert.match(output, /\(Mateo Elijah\) Tj/);
  assert.match(output, /\(ME\) Tj/);
  assert.doesNotMatch(output, /View Details|\(Action\)/);
  assert.doesNotMatch(pdf.output(), /\/Subtype \/Image/);
});

test('PDF KPI labels follow the report range instead of a fixed seven-day window', () => {
  for (const countPeriodLabel of ['30 Days', '90 Days', '12 Days', '1 Day', 'Report Period']) {
    const output = pages(createTeacherReportPdf({ ...base, countPeriodLabel })).join('\n');
    for (const title of ['Red Incidents', 'Yellow Incidents', 'Super Green']) {
      assert.ok(output.includes(`${title} \\(${countPeriodLabel}\\)`));
    }
    assert.doesNotMatch(output, /7 Days/);
  }
});

test('all history rows and notes appear once, in order, with continuation headings', () => {
  const history = Array.from({ length: 70 }, (_, i) => ({
    date: 'Sep 7', level: 'academic', signalType: 'yellow',
    description: `HistoryMarker${String(i).padStart(3, '0')}`, className: 'Class Science 7B',
  }));
  const notes = Array.from({ length: 25 }, (_, i) => ({
    date: 'Sep 7, 2026', className: 'Science 7B', text: `NoteMarker${String(i).padStart(3, '0')}`,
  }));
  const pdf = createTeacherReportPdf({ ...base, history, notes });
  const output = pages(pdf).join('\n');
  assert.deepEqual(output.match(/HistoryMarker\d{3}/g), history.map((row) => row.description));
  assert.deepEqual(output.match(/NoteMarker\d{3}/g), notes.map((note) => note.text));
  for (const page of pages(pdf)) {
    if (page.includes('HistoryMarker')) {
      for (const label of ['Date', 'Incident Level', 'Description', 'Category/Class']) assert.ok(page.includes(label));
    }
  }
  assert.ok(output.includes('Student History \\(continued\\)'));
  assert.ok(output.includes('Teachers Notes \\(continued\\)'));
});

test('entries taller than one page preserve their final text', () => {
  const pdf = createTeacherReportPdf({
    ...base,
    history: [{ date: 'Sep 7', level: 'behavioral', signalType: 'red', description: 'Long history content. '.repeat(600) + 'END-HISTORY', className: 'Science 7B' }],
    notes: [{ date: 'Sep 7', className: 'Science 7B', text: 'Long note content. '.repeat(700) + 'END-NOTE' }],
  });
  const output = pages(pdf).join('\n');
  assert.ok(pdf.getNumberOfPages() > 3);
  assert.equal((output.match(/END-HISTORY/g) || []).length, 1);
  assert.equal((output.match(/END-NOTE/g) || []).length, 1);
});

test('excluded notes produce no notes page; empty included notes show the empty state', () => {
  const excluded = createTeacherReportPdf(base);
  assert.equal(excluded.getNumberOfPages(), 1);
  assert.doesNotMatch(pages(excluded).join('\n'), /Teachers Notes/);
  const included = createTeacherReportPdf({ ...base, notes: [] });
  assert.equal(included.getNumberOfPages(), 2);
  assert.match(pages(included).join('\n'), /No notes recorded/);
});
