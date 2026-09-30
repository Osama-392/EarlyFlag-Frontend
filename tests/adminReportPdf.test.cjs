const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/adminReportPdf.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require });
const { createAdminReportPdf } = exportsObject;

const base = {
  name: 'Arthur O’Connor', initials: 'AO', grade: '8th Grade', studentId: 'S-2042',
  iep: true, ell: false, period: 'Last 30 Days',
  dateRange: 'Aug 9, 2026 - Sep 7, 2026', subject: 'All Subjects',
  counts: { superGreen: 2, present: 15, yellow: 3, red: 4, absent: 1 },
  canonicalRed: {
    total: 4, academic: 2, behavioral: 1, crossClass: 1,
    range: 'Aug 9, 2026 - Sep 7, 2026',
  },
  history: [],
};
const pdfText = (pdf) => pdf.internal.pages.slice(1).map((page) => page.join('\n')).join('\n');

test('admin PDF keeps every admin-preview summary metric as native text', () => {
  const pdf = createAdminReportPdf(base);
  const output = pdfText(pdf);
  for (const value of [
    'Arthur O', '8th Grade', 'S-2042', 'Last 30 Days', 'All Subjects',
    'Super Green', 'Present', 'Yellow', 'Red', 'Absent',
    'Red Summary', 'Total Red', 'Academic', 'Behavioral', 'Cross-Class',
  ]) assert.ok(output.includes(value), `PDF contains ${value}`);
  assert.doesNotMatch(output, /Student History|Recommended Next Steps|Teachers Notes/);
  assert.doesNotMatch(pdf.output(), /\/Subtype \/Image/);
});

test('admin PDF puts date, issue, description, class and teacher on one row', () => {
  const pdf = createAdminReportPdf({
    ...base,
    history: [{
      date: 'Sep 23', dayOfWeek: 'Wed', title: 'Bullying',
      description: 'Said something mean', className: 'Math 6A', teacherName: 'Chris Mark',
      typeLabel: 'Red - Behavioral', signalType: 'red',
    }],
  });
  const commands = pdf.internal.pages.slice(1).flat();
  const textPosition = (value) => {
    const command = commands.find((entry) => entry.includes(`(${value}) Tj`));
    assert.ok(command, `PDF contains ${value}`);
    const match = command.match(/([\d.]+) ([\d.]+) Td/);
    assert.ok(match, `PDF positions ${value}`);
    return { x: Number(match[1]), y: Number(match[2]) };
  };
  const date = textPosition('Sep 23');
  const day = textPosition('Wed');
  const title = textPosition('Bullying');
  const context = textPosition('Math 6A \u0095 Chris Mark');
  const description = textPosition('Said something mean');
  assert.ok(date.x < title.x && title.x < description.x && description.x < context.x, 'history fields follow the requested order');
  assert.ok(Math.abs(date.y - title.y) < 0.01, 'date and issue share a baseline');
  assert.ok(day.y < date.y, 'day of week appears below the date');
  assert.ok(Math.abs(description.y - title.y) < 0.01, 'description shares the issue baseline');
  assert.ok(Math.abs(context.y - title.y) < 0.01, 'class and teacher share the issue baseline');
});

test('admin PDF preserves long preview sections across native pages', () => {
  const history = Array.from({ length: 55 }, (_, index) => ({
    date: 'Sep 4', dayOfWeek: 'Fri', title: `HistoryTitle${String(index).padStart(2, '0')}`,
    description: `HistoryDescription${String(index).padStart(2, '0')} ${'details '.repeat(8)}`,
    className: 'Religion 8A', teacherName: 'Mark Twain',
    typeLabel: 'Yellow - Academic', signalType: 'yellow',
  }));
  const recommendations = ['RecommendationMarker ' + 'follow up '.repeat(300) + 'END-RECOMMENDATION'];
  const notes = [{
    date: 'Sep 3, 2026', className: 'Religion 8A',
    text: 'NoteMarker ' + 'support plan '.repeat(350) + 'END-NOTE',
  }];
  const pdf = createAdminReportPdf({ ...base, history, recommendations, notes });
  const output = pdfText(pdf);

  assert.ok(pdf.getNumberOfPages() > 4);
  assert.deepEqual(output.match(/HistoryTitle\d{2}/g), history.map((row) => row.title));
  assert.equal((output.match(/END-RECOMMENDATION/g) || []).length, 1);
  assert.equal((output.match(/END-NOTE/g) || []).length, 1);
  assert.ok(output.includes('Student History \\(continued\\)'));
  assert.ok(output.includes('Recommended Next Steps'));
  assert.ok(output.includes('Teachers Notes'));
});


test('class snapshot preserves every row and repeats table headings across PDF pages', () => {
  const rows = Array.from({ length: 45 }, (_, index) => ({
    className: `SnapshotRow${String(index).padStart(2, '0')}`, teacherName: 'SnapshotTeacher',
    present: 11, absent: 0, yellow: 2, red: 1, superGreen: 3,
    latestNote: 'Sep 4, 2026 - ' + 'Class participation improved. '.repeat(5),
  }));
  const pdf = createAdminReportPdf({ ...base, classSnapshot: { range: base.dateRange, rows } });
  const output = pdfText(pdf);
  assert.ok(pdf.getNumberOfPages() >= 3);
  assert.deepEqual(output.match(/SnapshotRow\d{2}/g), rows.map((row) => row.className));
  assert.ok((output.match(/Class-by-Class Snapshot/g) || []).length >= 3);
  assert.ok((output.match(/Subject \/ Teacher/g) || []).length >= 3);
  assert.ok(output.includes('SnapshotTeacher'));
  assert.ok(output.includes('Latest Note'));
  assert.ok(output.includes('(0) Tj'));
  assert.doesNotMatch(pdf.output(), /\/Subtype \/Image/);
});

test('empty class snapshot has an explicit empty state in PDF', () => {
  const output = pdfText(createAdminReportPdf({ ...base, classSnapshot: { range: base.dateRange, rows: [] } }));
  assert.ok(output.includes('Class-by-Class Snapshot'));
  assert.ok(output.includes('No active classes match this report.'));
});
