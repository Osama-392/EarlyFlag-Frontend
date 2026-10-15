const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const load = require('./loadTypeScript.cjs');

test('teacher profile interleaves flags and referrals newest first, including same-day entries', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const states = [], effects = [];
  let index = 0;
  const overrides = {
    react: { ...React,
      useState(initial) {
        const current = index++;
        if (!(current in states)) states[current] = initial;
        return [states[current], value => { states[current] = value; }];
      },
      useEffect(fn) { if (!states[index++]) { states[index - 1] = true; effects.push(fn); } },
    },
    'next/navigation': { useParams: () => ({}), usePathname: () => '/students/student' },
    'next/link': { __esModule: true, default: 'a' },
    '@/app/providers': { useAuth: () => ({ user: null }) },
    '@/lib/logger': { logger: {} },
    '@/lib/studentService': {
      getStudentReportClasses: async () => [],
      getStudentHistory: async () => ({ first_name: 'Test', last_name: 'Student', signals: [
        { signal_date: yesterday, created_at: `${today}T20:00:00Z`, signal_type: 'yellow', reason_description: 'Oldest' },
        { signal_date: today, created_at: `${today}T08:00:00Z`, signal_type: 'red', reason_description: 'Morning' },
        { signal_date: today, created_at: `${today}T16:00:00Z`, signal_type: 'super_green', reason_description: 'Newest' },
      ], referrals: [{ created_at: `${today}T12:00:00Z`, referral_type: 'manual_admin', note: 'Referral' }] }),
    },
    '@/components/TeacherLoadingSkeletons': { TeacherStudentProfileSkeleton: 'div' },
  };
  for (const component of ['EditStudentProfileModal', 'ParentEmailTemplateModal', 'SendAdminModal', 'CreateReportModal', 'ReportView']) {
    overrides[`@/components/${component}`] = { __esModule: true, default: () => null };
  }
  const Profile = load('../components/StudentProfile.tsx', overrides).default;
  function render() {
    index = 0;
    const tree = Profile({ studentId: 'student', onBack() {} });
    effects.splice(0).forEach(fn => fn());
    return tree;
  }
  render();
  await new Promise(resolve => setImmediate(resolve));
  const entries = [];
  function visit(tree) {
    if (!React.isValidElement(tree)) return;
    if (tree.type === 'span' && tree.props.className === 'truncate flex-1') entries.push(tree.props.children);
    React.Children.toArray(tree.props.children).forEach(visit);
  }
  visit(render());
  assert.deepEqual(entries, ['Newest', 'Referral', 'Morning', 'Oldest']);
});
