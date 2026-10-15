const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./loadTypeScript.cjs');

const classes = [
  { id: 'math-a', slug: 'math-class', name: 'Math' },
  { id: 'math-b', slug: 'other-math-class', name: 'Math' },
];

function service(fail = false) {
  const calls = [];
  const { getStudentReportClasses } = load('../lib/studentService.ts', {
    './classService': { getTeacherClasses: async () => classes },
    './api': { __esModule: true, default: { get: async url => {
      calls.push(url);
      if (fail) throw new Error('offline');
      return { data: { students: url.includes('/math-a/') ? [{ id: 'student-id', slug: 'student-slug' }] : [] } };
    } } },
  });
  return { getStudentReportClasses, calls };
}

test('dashboard report choices include only teacher classes containing the student', async () => {
  const { getStudentReportClasses } = service();
  for (const id of ['student-id', 'student-slug']) {
    const result = await getStudentReportClasses(id);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'math-a');
  }
  assert.equal((await getStudentReportClasses('unrelated-student')).length, 0);
});

test('class routes resolve the exact class ID or slug without fetching every roster', async () => {
  const { getStudentReportClasses, calls } = service();
  for (const id of ['math-a', 'math-class']) {
    const result = await getStudentReportClasses('student-id', id);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'math-a');
  }
  assert.equal(calls.length, 0);
  await assert.rejects(getStudentReportClasses('student-id', 'missing'), /Unable to find/);
});

test('failed class loading does not fall back to an all-subjects report', async () => {
  await assert.rejects(service(true).getStudentReportClasses('student-id'), /offline/);
});
