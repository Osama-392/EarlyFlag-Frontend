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
