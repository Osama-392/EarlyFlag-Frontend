const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./loadTypeScript.cjs');
const { sortFlagHistory } = load('../lib/flagHistory.ts');
const { reportHistory, groupReportHistory } = load('../lib/reportPresentation.ts');

test('history sorts by incident day then recorded time without prioritizing severity or mutating input', () => {
  const flags = [
    { title: 'OlderRed', signal_type: 'red', signal_date: '2026-10-01', created_at: '2026-10-01T08:00:00Z' },
    { title: 'Backdated', signal_date: '2026-09-30', created_at: '2026-10-02T12:00:00Z' },
    { title: 'NewerGreen', signal_type: 'super_green', signal_date: '2026-10-01', created_at: '2026-10-01T14:00:00Z' },
    { title: 'Referral', created_at: '2026-10-01T12:00:00Z' },
    { title: 'Missing' },
    { title: 'Invalid', signal_date: 'invalid', created_at: 'invalid' },
  ];
  const original = JSON.stringify(flags);
  assert.deepEqual(Array.from(sortFlagHistory(flags), flag => flag.title),
    ['NewerGreen', 'Referral', 'OlderRed', 'Backdated', 'Missing', 'Invalid']);
  assert.equal(JSON.stringify(flags), original);
});

test('date-only ties are stable and year boundaries and timezone offsets sort correctly', () => {
  const flags = [
    { title: 'LastYear', signal_date: '2025-12-31' },
    { title: 'FirstTie', signal_date: '2026-01-01' },
    { title: 'SecondTie', signal_date: '2026-01-01' },
    { title: 'EarlierTime', signal_date: '2026-01-01', created_at: '2026-01-01T12:00:00+05:00' },
    { title: 'LaterTime', signal_date: '2026-01-01', created_at: '2026-01-01T08:00:00Z' },
  ];
  assert.deepEqual(Array.from(sortFlagHistory(flags), flag => flag.title),
    ['LaterTime', 'EarlierTime', 'FirstTie', 'SecondTie', 'LastYear']);
});

test('report history filters dates and keeps each class newest first', () => {
  const flags = [
    { title: 'MathOld', class_id: 'math', signal_date: '2026-09-27' },
    { title: 'ScienceOld', class_id: 'science', signal_date: '2026-09-26' },
    { title: 'MathNew', class_id: 'math', signal_date: '2026-09-29' },
    { title: 'ScienceNew', class_id: 'science', signal_date: '2026-09-30' },
    { title: 'OutsideRange', signal_date: '2026-10-01' },
  ];
  const rows = reportHistory(flags, true, '2026-09-26', '2026-09-30');
  assert.deepEqual(Array.from(rows, row => row.title), ['ScienceNew', 'MathNew', 'MathOld', 'ScienceOld']);
  assert.deepEqual(Array.from(groupReportHistory(rows), group => Array.from(group.rows, row => row.title)),
    [['ScienceNew', 'ScienceOld'], ['MathNew', 'MathOld']]);
});
