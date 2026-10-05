const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function findElement(tree, predicate) {
  if (!React.isValidElement(tree)) return undefined;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
}

test('shared teacher/admin report modal offers an inclusive Last 7 Days preset', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/CreateReportModal.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const stateUpdates = new Map();
  let stateIndex = 0;
  const exportsObject = {};
  vm.runInNewContext(compiled, {
    exports: exportsObject,
    console,
    require: (name) => {
      if (name === 'react') return {
        ...React,
        useEffect: () => {},
        useMemo: (factory) => factory(),
        useState: (initial) => {
          const index = stateIndex++;
          return [initial, (value) => stateUpdates.set(index, value)];
        },
      };
      if (name === 'lucide-react') return { X: () => null, AlertCircle: () => null };
      if (name === '@/lib/logger') return { logger: {} };
      if (name === '@/lib/studentService') return { generateStudentReport: async () => ({}) };
      return require(name);
    },
  });
  const CreateReportModal = exportsObject.default;
  const tree = CreateReportModal({
    isOpen: true,
    student: { id: 'student-1', name: 'Test Student', status: 'neutral', initial: 'TS', bgColor: '' },
    defaultSubject: 'All Subjects',
    gradeSubjects: [],
    onClose: () => {},
    onGenerate: () => {},
  });
  const preset = findElement(tree, (element) => element.type === 'button' && element.props.children === 'Last 7 Days');
  assert.ok(preset, 'Last 7 Days quick option is rendered');
  preset.props.onClick();

  const start = stateUpdates.get(0);
  const end = stateUpdates.get(1);
  assert.match(start, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(end, /^\d{4}-\d{2}-\d{2}$/);
  const rangeDays = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 + 1;
  assert.equal(rangeDays, 7);
});

test('report date inputs, helper text and generated payload keep the same calendar dates', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/CreateReportModal.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const { renderToStaticMarkup } = require('react-dom/server');
  const now = new Date(2026, 9, 1, 12).getTime();
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const states = ['2026-09-25', '2026-10-01'];
  let stateIndex = 0;
  let request;
  let generated;
  let classId;
  const response = { report: {} };
  const exportsObject = {};
  vm.runInNewContext(compiled, {
    exports: exportsObject, console, Date: FixedDate,
    require: (name) => {
      if (name === 'react') return {
        ...React,
        useEffect: () => {},
        useMemo: (factory) => factory(),
        useState: (initial) => {
          const index = stateIndex++;
          if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
          return [states[index], (value) => { states[index] = value; }];
        },
      };
      if (name === 'lucide-react') return { X: () => null, AlertCircle: () => null };
      if (name === '@/lib/logger') return { logger: { formSubmit: () => {} } };
      if (name === '@/lib/studentService') return {
        generateStudentReport: async (studentId, payload) => {
          request = { studentId, payload };
          return response;
        },
      };
      return require(name);
    },
  });
  function render() {
    stateIndex = 0;
    return exportsObject.default({
      isOpen: true,
      student: { id: 'student-1', name: 'Test Student', status: 'neutral', initial: 'TS', bgColor: '' },
      defaultSubject: 'All Subjects', gradeSubjects: [], onClose: () => {},
      classId,
      onGenerate: (data) => { generated = data; },
    });
  }
  async function checkRange(start, end, label) {
    const tree = render();
    const inputs = [];
    function visit(element) {
      if (!React.isValidElement(element)) return;
      if (element.type === 'input' && element.props.type === 'date') inputs.push(element);
      React.Children.toArray(element.props.children).forEach(visit);
    }
    visit(tree);
    assert.deepEqual(inputs.map((input) => input.props.value), [start, end]);
    const helper = findElement(tree, (element) => element.type === 'p' && element.props.className === 'text-xs text-gray-400 mt-2');
    assert.ok(renderToStaticMarkup(helper).includes(label), 'helper matches the selected dates');
    findElement(tree, (element) => element.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(request.studentId, 'student-1');
    assert.equal(request.payload.start_date, start);
    assert.equal(request.payload.end_date, end);
    assert.equal(generated.start_date, start);
    assert.equal(generated.end_date, end);
    assert.equal(generated.result, response);
    return inputs;
  }
  await checkRange('2026-09-25', '2026-10-01', 'Sep 25, 2026 — Oct 1, 2026');
  for (const [days, start, label] of [
    [7, '2026-09-25', 'Sep 25, 2026 — Oct 1, 2026'],
    [30, '2026-09-02', 'Sep 2, 2026 — Oct 1, 2026'],
    [90, '2026-07-04', 'Jul 4, 2026 — Oct 1, 2026'],
  ]) {
    findElement(render(), (element) => element.type === 'button' && element.props.children === `Last ${days} Days`).props.onClick();
    await checkRange(start, '2026-10-01', label);
  }
  // Custom dates spanning the US daylight-saving change must also stay date-only.
  const inputs = await checkRange('2026-07-04', '2026-10-01', 'Jul 4, 2026 — Oct 1, 2026');
  inputs[0].props.onChange({ target: { value: '2026-03-06' } });
  inputs[1].props.onChange({ target: { value: '2026-03-12' } });
  await checkRange('2026-03-06', '2026-03-12', 'Mar 6, 2026 — Mar 12, 2026');
  classId = 'math-6a';
  await checkRange('2026-03-06', '2026-03-12', 'Mar 6, 2026 — Mar 12, 2026');
  assert.equal(request.payload.class_id, 'math-6a');
  assert.ok(!Object.hasOwn(request.payload, 'subject'), 'exact class requests omit the ambiguous subject filter');
  assert.equal(findElement(render(), element => element.type === 'select').props.disabled, true);
});
