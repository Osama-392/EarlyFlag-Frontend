const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

module.exports = function loadTypeScript(relative, overrides = {}) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, console, Date, Map, Set,
      require(name) {
        if (Object.hasOwn(overrides, name)) return overrides[name];
        if (name.startsWith('@/') || name.startsWith('.')) {
          const base = name.startsWith('@/') ? path.join(__dirname, '..', name.slice(2)) : path.resolve(path.dirname(filename), name);
          const candidate = [base, `${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
          if (candidate) return load(candidate);
        }
        return require(name);
      },
    }, { filename });
    return exports;
  }
  return load(path.resolve(__dirname, relative));
};
