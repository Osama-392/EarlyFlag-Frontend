const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAdminService(api) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/adminService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    console,
    URLSearchParams,
    require: (name) => name === './api' ? { __esModule: true, default: api } : require(name),
  });
  return exports;
}

test('admin Red events request every selected tab from the backend', async () => {
  const calls = [];
  const api = {
    get: async (url) => {
      calls.push(url);
      return { data: {} };
    },
  };
  const service = loadAdminService(api);

  await service.getAdminRedFlags('all');
  await service.getAdminRedFlags('behavioral', 10, 10);

  assert.deepEqual(Array.from(calls), [
    '/api/v1/admin/red-flags?range=all&tab=all&limit=10&offset=0',
    '/api/v1/admin/red-flags?range=all&tab=behavioral&limit=10&offset=10',
  ]);
});

test('referrals render one canonical event row and acknowledge its referral', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/AdminReferralsList.tsx'), 'utf8');

  for (const token of [
    'key={event.escalation_id}',
    'RED_TYPE_LABELS[event.red_type]',
    'categoryLabel(event)',
    'const canAcknowledge = Boolean(event.referral_id)',
    'const latestRepeatOffenderIds = useMemo',
    "if (activeTab === 'resolved') return new Set<string>()",
    '!event.repeat_offender || !isInCurrentRollingSevenDays(event)',
    'timestamp > current.timestamp',
    'const showRepeatOffender =',
    '!isResolved && event.repeat_offender && isInCurrentRollingSevenDays(event)',
    '{showRepeatOffender && (',
    'const isLatestRepeatOffender = latestRepeatOffenderIds.has(event.escalation_id)',
    "isLatestRepeatOffender\n                      ? 'bg-red-100 hover:bg-red-200",
    'await acknowledgeReferral(event.referral_id)',
    'setPageTotal(response.total)',
    '[1, 2, 3].map(row => (',
    'className="animate-pulse"',
    'rounded bg-gray-200 dark:bg-[#262a3d]',
    '{loading || fetching ? (',
    "event.category === 'cross_class'",
    'event.classes_involved ?? []',
    'Classes Involved',
    "item.class_name ?? item.subject ?? 'Unknown class'",
    "event.contribution_tracking_status === 'inferred_partial'",
  ]) assert.ok(source.includes(token), `referrals list contains ${token}`);

  for (const removed of [
    'group_id', 'concern_type', 'concern_label', 'filter_memberships',
    'academic_red_count', 'behavioral_red_count', 'total_red_count',
    'event_ids', 'referral_ids', 'actionable_referral_count',
    'event_details', 'total_red_events', 'A / B Breakdown',
  ]) assert.ok(!source.includes(removed), `referrals list omits ${removed}`);
  for (const hiddenContributionCount of [
    'item.academic_yellows',
    'item.behavioral_yellows',
    'item.total_yellows',
    '<span aria-hidden="true">â€¢</span>',
    'Classes involved:',
    'list-disc space-y-1 pl-4',
    'Loading referrals',
    'Updating…',
  ]) assert.ok(!source.includes(hiddenContributionCount), `referrals list hides ${hiddenContributionCount}`);
  for (const hiddenDetail of [
    'event.student.external_student_id',
    '{event.origin}',
    '{event.subject}',
    "{isResolved ? 'Resolved' : 'Red'}",
    'event.underlying_category &&',
    'Occurred {formatDate(event.occurred_on)}',
  ]) assert.ok(!source.includes(hiddenDetail), `referrals list hides ${hiddenDetail}`);
});

test('admin service normalizes the top-level events collection without grouped row fields', async () => {
  const event = { escalation_id: 'red-1' };
  const api = { get: async () => ({ data: { total: 1, events: [event] } }) };
  const service = loadAdminService(api);
  const response = await service.getAdminRedFlags('all');

  assert.deepEqual(JSON.parse(JSON.stringify(response.rows)), [event]);
  for (const removed of [
    'group_id', 'concern_type', 'concern_label', 'filter_memberships',
    'academic_red_count', 'behavioral_red_count', 'total_red_count',
    'event_ids', 'referral_ids', 'actionable_referral_count',
    'event_details', 'events', 'total_red_events',
  ]) assert.ok(!fs.readFileSync(path.join(__dirname, '../lib/adminService.ts'), 'utf8').includes(`${removed}:`));
});

test('full referrals client supports server-side workflow filters', async () => {
  const calls = [];
  const api = {
    get: async (url) => {
      calls.push(url);
      return { data: {} };
    },
  };
  const service = loadAdminService(api);

  await service.getAdminReferrals({
    tab: 'academic',
    status: 'sent',
    priority: 'urgent',
    follow_up: true,
    from: '2026-09-01',
    to: '2026-09-10',
    limit: 50,
    offset: 0,
  });

  assert.equal(
    calls[0],
    '/api/v1/admin/referrals?tab=academic&status=sent&priority=urgent&follow_up=true&from=2026-09-01&to=2026-09-10&limit=50&offset=0',
  );
});
