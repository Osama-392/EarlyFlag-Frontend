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
    const match = find(child, predicate); if (match) return match;
  }
}
function content(tree) {
  if (typeof tree === 'string') return tree;
  if (!React.isValidElement(tree)) return '';
  return React.Children.toArray(tree.props.children).map(content).join(' ');
}
function harness(initialData, flagType = 'absent') {
  const states = [], submissions = [];
  let index = 0, closed = false;
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../components/FlagModal.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === 'react') return { ...React, useState(value) {
      const i = index++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    } };
    if (name === 'lucide-react') return { X: 'X', AlertTriangle: 'AlertTriangle' };
    if (name === '@/lib/logger') return { logger: { formSubmit() {}, formChange() {} } };
    if (name === '@/lib/absenceReasons') return { ABSENCE_REASONS: { illness: 'Illness', appointment: 'Appointment', sports_dismissal: 'Sports dismissal', school_activity: 'School activity', vacation: 'Vacation', absent_other: 'Other' } };
    return require(name);
  } });
  return { submissions, render() { index = 0; return exports.default({ flagType, initialData,
    student: { id: 'student', name: 'Asher Holloway', grade: 6, initial: 'AH', period: 1 },
    className: 'Math 6A', signalDate: '2026-09-28', onClose: () => { closed = true; }, onSubmit: value => submissions.push(value),
  }); } };
}
for (const reason of [false, true]) for (const note of [false, true]) {
  test(`absence can save with reason=${reason}, note=${note}`, () => {
    const h = harness(); let tree = h.render();
    assert.ok(content(tree).includes('Math 6A'));
    if (reason) find(tree, el => el.type === 'button' && content(el) === 'Sports dismissal').props.onClick();
    if (note) find(tree, el => el.type === 'textarea').props.onChange({ target: { value: 'Leaving early for an away game.' } });
    tree = h.render();
    const save = find(tree, el => el.type === 'button' && content(el) === 'Save absence');
    assert.equal(save.props.disabled, false); save.props.onClick();
    assert.equal(h.submissions[0].reasons.length, reason ? 1 : 0);
    assert.equal(h.submissions[0].note, note ? 'Leaving early for an away game.' : undefined);
  });
}
test('saved absence reason and note can be restored and cleared', () => {
  const h = harness({ reasons: ['Illness'], note: 'Existing note' }); let tree = h.render();
  assert.equal(find(tree, el => el.type === 'textarea').props.value, 'Existing note');
  find(tree, el => el.type === 'button' && content(el) === 'Illness').props.onClick();
  find(tree, el => el.type === 'textarea').props.onChange({ target: { value: '  ' } });
  tree = h.render(); find(tree, el => el.type === 'button' && content(el) === 'Save absence').props.onClick();
  assert.equal(h.submissions[0].reasons.length, 0); assert.equal(h.submissions[0].note, undefined);
});
test('yellow still requires a reason', () => {
  const tree = harness(undefined, 'yellow').render();
  assert.equal(find(tree, el => el.type === 'button' && content(el) === 'Submit Flag').props.disabled, true);
});
