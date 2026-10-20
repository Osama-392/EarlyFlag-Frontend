const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const load = require('./loadTypeScript.cjs');
const { getHeatmapColors } = load('../lib/heatmapColors.ts');

const flush = () => new Promise(resolve => setImmediate(resolve));
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

function harness() {
  const hooks = [], pendingEffects = [], requests = [], dashboardRequests = [];
  const listeners = new Map(), timers = new Map();
  let index = 0, timerId = 0;
  const window = {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    setInterval(fn) { timers.set(++timerId, fn); return timerId; },
    clearInterval(id) { timers.delete(id); },
  };
  const overrides = {
    react: {
      ...React,
      useState(initial) {
        const i = index++;
        if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial;
        return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }];
      },
      useRef(initial) {
        const i = index++;
        return hooks[i] ||= { current: initial };
      },
      useCallback(fn, deps) {
        const i = index++;
        if (!sameDeps(hooks[i]?.deps, deps)) hooks[i] = { deps, fn };
        return hooks[i].fn;
      },
      useEffect(fn, deps) {
        const i = index++;
        if (!sameDeps(hooks[i]?.deps, deps)) {
          const previous = hooks[i];
          hooks[i] = { deps };
          pendingEffects.push(() => {
            previous?.cleanup?.();
            hooks[i].cleanup = fn();
          });
        }
      },
    },
    'next/navigation': { useRouter: () => ({ push() {} }) },
    'next/link': { __esModule: true, default: 'a' },
    '@/app/providers': { useAuth: () => ({ user: null }) },
    '@/lib/adminService': { getPendingTeachers: async () => [] },
    '@/lib/adminDashboardService': {
      getAdminDashboard: async range => {
        dashboardRequests.push(range);
        return {
          most_at_risk: { total: 0, students: [] },
          students_improving: { total: 0, students: [] },
          absent_students: [],
        };
      },
      getAdminHeatmap: range => new Promise((resolve, reject) => requests.push({ range, resolve, reject })),
    },
  };
  for (const name of ['GoodMorningBanner', 'AdminTeacherMonitoringCards', 'AdminReferralsList']) {
    overrides[`@/components/${name}`] = {
      __esModule: true, default: () => null, AdminReferralsListSkeleton: () => null,
    };
  }
  const Dashboard = load('../components/PrincipalDashboard.tsx', overrides, { window }).default;
  return {
    requests, dashboardRequests, listeners, timers,
    render() {
      index = 0;
      const tree = Dashboard();
      pendingEffects.splice(0).forEach(fn => fn());
      return tree;
    },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}

function elements(tree, predicate) {
  const found = [];
  function visit(node) {
    if (!React.isValidElement(node)) return;
    if (predicate(node)) found.push(node);
    React.Children.toArray(node.props.children).forEach(visit);
  }
  visit(tree);
  return found;
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (React.isValidElement(node)) return text(node.props.children);
  return node == null || typeof node === 'boolean' ? '' : String(node);
}
const button = (tree, label) => elements(tree, n => n.type === 'button' && text(n) === label)[0];
const cards = tree => elements(tree, n => n.type === 'div' && n.props.className?.startsWith('fade-up '));
function tile(id, rank, color, subject = 'Math') {
  return {
    class_id: id, class_name: id, school_rank: rank, heatmap_color: color,
    subject, active_enrollments: 10, red_count: 0, yellow_count: 8,
    total_flags: 8, flag_percentage: 0.1,
    // Legacy severity/escalation fields must not determine color or add dots.
    band: 'yellow', has_unresolved_high_critical: true, has_observation_flag: true,
  };
}
function payload(days, tiles) {
  return { range_days: days, grade_buckets: [
    { grade_level: 6, tiles: tiles.filter((_, i) => i % 2 === 0) },
    { grade_level: 12, tiles: tiles.filter((_, i) => i % 2 !== 0) },
  ] };
}

test('heatmap client defaults to 7 days and sends all supported windows', async () => {
  const calls = [];
  const service = load('../lib/adminDashboardService.ts', {
    './api': { __esModule: true, default: { get: async (url, options) => {
      calls.push([url, options.params.range]);
      return { data: {} };
    } } },
  });
  await service.getAdminHeatmap();
  await service.getAdminHeatmap('30d');
  await service.getAdminHeatmap('90d');
  assert.deepEqual(calls, ['7d', '30d', '90d'].map(range => ['/api/v1/admin/heatmap', range]));
});

test('cards sort globally before limiting and subject filters preserve rank colors', async () => {
  const h = harness();
  h.render();
  h.requests[0].resolve(payload(7, [
    tile('Third', 3, 'green'), tile('First', 1, 'red', 'Science'), tile('Second', 2, 'yellow'),
    ...Array.from({ length: 8 }, (_, i) => tile(`Class ${i + 4}`, i + 4, 'green')),
  ]));
  await flush();
  let tree = h.render();
  assert.equal(cards(tree).length, 9);
  assert.deepEqual(cards(tree).slice(0, 3).map(c => elements(c, n => n.type === 'h4')[0].props.children), ['First', 'Second', 'Third']);
  assert.equal(cards(tree)[0].props.style['--heatmap-bg'], '#FEE2E2');
  assert.equal(cards(tree)[0].props.style['--heatmap-border'], '#FCA5A5');
  const initialNinthStyle = { ...cards(tree)[8].props.style };
  assert.equal(elements(tree, n => n.props.title === 'Teacher observation flag').length, 0);
  button(tree, 'View More Classes').props.onClick();
  tree = h.render();
  assert.equal(cards(tree).length, 11);
  button(tree, 'Math').props.onClick();
  tree = h.render();
  assert.equal(cards(tree)[0].props.style['--heatmap-bg'], '#FFEDD5');
  assert.equal(cards(tree)[1].props.style['--heatmap-bg'], '#FEF3C7');
  const ninth = cards(tree).find(c => text(elements(c, n => n.type === 'h4')[0]) === 'Class 9');
  assert.deepEqual({ ...ninth.props.style }, initialNinthStyle);
  assert.equal(h.requests.length, 1); // Filtering never reranks or refetches.
  h.unmount();
});

test('the first four ranks use the requested background, border and badge colors', () => {
  const expected = [
    ['#FEE2E2', '#FCA5A5', '#DC2626'],
    ['#FFEDD5', '#FDBA74', '#EA580C'],
    ['#FEF3C7', '#FCD34D', '#D97706'],
    ['#FEF9C3', '#FDE047', '#CA8A04'],
  ];
  for (const count of [4, 9, 100]) {
    expected.forEach((colors, i) => {
      const result = getHeatmapColors(i + 1, 1, count);
      assert.deepEqual([result.background, result.border, result.badge], colors);
    });
  }
  assert.equal(getHeatmapColors(1, 1, 1).badge, '#DC2626');
});

test('lower ranks progress through yellow-green to green and zero flags always stay green', () => {
  const colors = Array.from({ length: 5 }, (_, i) => getHeatmapColors(i + 5, 2, 9));
  assert.equal(colors[0].background, '#FEFCE8');
  assert.equal(colors[2].background, '#F7FEE7');
  assert.equal(colors[4].background, '#F0FDF4');
  assert.equal(colors[4].badge, '#16A34A');
  assert.equal(new Set(colors.map(c => c.badge)).size, 5);
  assert.equal(getHeatmapColors(5, 1, 5).background, '#FEFCE8');
  assert.equal(getHeatmapColors(1, 0, 0).background, '#F0FDF4');
  assert.equal(getHeatmapColors(2, 0, 1).badge, '#16A34A');
});

test('time ranges recolor changed ranks and zero-flag classes do not dilute the scale', async () => {
  const h = harness();
  h.render();
  const flagged = Array.from({ length: 7 }, (_, i) => tile(`Class ${i + 1}`, i + 1, 'green'));
  const clear = Array.from({ length: 20 }, (_, i) => ({
    ...tile(`Clear ${i + 1}`, i + 8, 'red'),
    total_flags: 0, red_count: 0, yellow_count: 0,
  }));
  for (const [index, days] of [7, 30, 90].entries()) {
    if (index > 0) {
      button(h.render(), `${days} Days`).props.onClick();
      h.render();
    }
    // Same displayed percentage, different server rank for the same class.
    const tiles = flagged.map(t => ({
      ...t,
      school_rank: index === 1 ? 8 - t.school_rank : t.school_rank,
    }));
    h.requests[index].resolve(payload(days, [...tiles, ...clear]));
    await flush();
    const tree = h.render();
    const classOne = cards(tree).find(c => text(elements(c, n => n.type === 'h4')[0]) === 'Class 1');
    assert.equal(classOne.props.style['--heatmap-bg'], index === 1 ? '#F0FDF4' : '#FEE2E2');
    const fifth = cards(tree)[4];
    assert.equal(fifth.props.style['--heatmap-bg'], '#FEFCE8');
    const badge = elements(fifth, n => n.props.title?.startsWith('School rank'))[0];
    assert.equal(badge.props.style.backgroundColor, '#84A30D');
    assert.equal(cards(tree)[6].props.style['--heatmap-bg'], '#F0FDF4');
    assert.equal(cards(tree)[7].props.style['--heatmap-bg'], '#F0FDF4');
    assert.match(text(cards(tree)[7]), /All clear/);
  }
  h.unmount();
});

test('rapid period changes ignore older success and failure responses', async () => {
  const h = harness();
  h.render();
  await flush();
  button(h.render(), '30 Days').props.onClick();
  h.render();
  button(h.render(), '90 Days').props.onClick();
  let tree = h.render();
  assert.equal(cards(tree).length, 0);
  assert.deepEqual(h.requests.map(r => r.range), ['7d', '30d', '90d']);
  h.requests[2].resolve(payload(90, [tile('Quarter', 1, 'red')]));
  await flush();
  h.render();
  h.requests[0].resolve(payload(7, [tile('Old response', 1, 'red')]));
  h.requests[1].reject(new Error('Late failure'));
  await flush();
  tree = h.render();
  assert.match(text(cards(tree)[0]), /Quarter/);
  assert.equal(elements(tree, n => n.props.role === 'alert').length, 0);
  assert.equal(button(tree, '90 Days').props['aria-pressed'], true);
  assert.deepEqual(h.dashboardRequests, ['7d']);
  h.unmount();
});

test('local failures allow retry; refresh events use selected range and clean up', async () => {
  const h = harness();
  h.render();
  h.requests[0].reject(new Error('Offline'));
  await flush();
  let tree = h.render();
  assert.match(text(tree), /School Dashboard/);
  assert.equal(elements(tree, n => n.props.role === 'alert').length, 1);
  button(tree, 'Try again').props.onClick();
  h.requests[1].resolve(payload(7, []));
  await flush();
  tree = h.render();
  assert.match(text(tree), /No active classes found/);
  button(tree, '30 Days').props.onClick();
  h.render();
  h.requests[2].resolve(payload(30, [tile('Month', 1, 'red')]));
  await flush();
  h.render();
  h.listeners.get('focus')();
  h.listeners.get('dashboard-refresh')();
  [...h.timers.values()][0]();
  assert.deepEqual(h.requests.slice(3).map(r => r.range), ['30d', '30d', '30d']);
  h.requests.at(-1).reject(new Error('Refresh failed'));
  await flush();
  tree = h.render();
  assert.match(text(cards(tree)[0]), /Month/);
  assert.match(text(tree), /last successful update/);
  h.unmount();
  assert.equal(h.listeners.size, 0);
  assert.equal(h.timers.size, 0);
});
