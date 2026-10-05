const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./loadTypeScript.cjs');
const { createAdminReportPdf } = load('../lib/adminReportPdf.ts');
const base = { name: 'Xavier Kensington', initials: 'XK', grade: 'Grade 6', iep: false, ell: false,
  period: 'Sep 25, 2026 - Oct 1, 2026', dateRange: 'Sep 25, 2026 - Oct 1, 2026', subject: 'Math 6A',
  kind: 'class', teacherName: 'Mr. Criss Mark', counts: { superGreen: 0, yellow: 2, red: 2, present: 2, absent: 0 }, history: [],
};
const pdfText = pdf => pdf.internal.pages.flat().join('\n');

test('class PDF matches the reference sections and exports native text', () => {
  const pdf = createAdminReportPdf(base); const text = pdfText(pdf);
  for (const label of ['CLASS REPORT', 'Xavier Kensington', 'Mr. Criss Mark', 'Super Green', 'Yellow Incidents', 'Red Incidents', 'Math 6A Attendance', 'Present', 'Absent', 'Student History']) assert.ok(text.includes(label), label);
  assert.ok(!text.includes('Red Summary')); assert.ok(!text.includes('Category Breakdown'));
  assert.doesNotMatch(pdf.output(), /\/Subtype \/Image/);
});

test('overview PDF groups class history and keeps cross-class alerts separate', () => {
  const pdf = createAdminReportPdf({ ...base, kind: 'overview',
    crossClassAlerts: [{ date: 'Sep 30, 2026', description: 'Three classes in seven days', contributions: 'Math Sep 28 + Spanish Sep 29 + PE Sep 30' }],
    classSnapshot: { range: base.dateRange, rows: [{ className: 'Math 6A', teacherName: 'Criss Mark', superGreen: 0, yellow: 2, red: 2, present: 2, absent: 0, latestNote: 'Obsolete note' }] },
    history: [{ classId: 'math', className: 'Math 6A', teacherName: 'Criss Mark', date: 'Sep 28, 2026', dayOfWeek: '', signalType: 'red', typeLabel: 'Red · Academic', title: 'Cheating', description: 'Specific teacher note' }],
  });
  const text = pdfText(pdf);
  for (const label of ['1 Cross-Class Alert', 'Class-by-Class Snapshot', 'Student History - Math 6A', 'Cheating', 'Specific teacher note']) assert.ok(text.includes(label), label);
  assert.ok(!text.includes('Latest Note')); assert.ok(!text.includes('Obsolete note'));
});

test('long history and notes retain final text across repeated page headings', () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({ classId: 'math', className: 'Math 6A', teacherName: 'Criss Mark', date: 'Sep 28, 2026', dayOfWeek: '', signalType: 'yellow', typeLabel: 'Yellow - Behavioral', title: `Incident-${i}`, description: `Note-${i}` }));
  rows.push({ ...rows[0], title: 'Long incident', description: `${'Long teacher note. '.repeat(1200)}FINAL-NOTE-TEXT` });
  const pdf = createAdminReportPdf({ ...base, history: rows }); const text = pdfText(pdf);
  assert.ok(pdf.getNumberOfPages() > 2);
  for (const value of ['Incident-119', 'Note-119', 'FINAL-NOTE-TEXT', 'continued']) assert.ok(text.includes(value), value);
  assert.equal((text.match(/FINAL-NOTE-TEXT/g) || []).length, 1);
});
