const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

const source = read('lib/teacherTitle.ts');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2017,
  },
}).outputText;
const titleModule = {};
vm.runInNewContext(compiled, { exports: titleModule });

const baseSignup = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'Example123!',
  phoneNumber: '+1234567890',
  schoolId: 'EF-SCH-123456',
};

test('teacher signup payload supports every allowed title without changing first_name', () => {
  assert.deepEqual(Array.from(titleModule.TEACHER_TITLES), ['Mr.', 'Miss', 'Mrs.']);

  for (const title of titleModule.TEACHER_TITLES) {
    const payload = titleModule.buildTeacherSignupPayload({ ...baseSignup, title });
    assert.equal(payload.title, title);
    assert.equal(payload.first_name, 'Jane');
    assert.equal(payload.last_name, 'Doe');
    assert.equal(payload.email, 'jane@example.com');
    assert.equal(payload.password, 'Example123!');
    assert.equal(payload.phone_number, '+1234567890');
    assert.equal(payload.school_id, 'EF-SCH-123456');
  }
});

test('teacher signup omits title when no title is selected', () => {
  const payload = titleModule.buildTeacherSignupPayload(baseSignup);
  assert.equal(Object.hasOwn(payload, 'title'), false);
  assert.equal(payload.first_name, 'Jane');
});

test('teacher display names include optional title without extra spaces', () => {
  assert.equal(titleModule.formatTeacherDisplayName({ title: 'Mrs.', first_name: 'Jane', last_name: 'Doe' }), 'Mrs. Jane Doe');
  assert.equal(titleModule.formatTeacherDisplayName({ title: null, first_name: 'Jane', last_name: 'Doe' }), 'Jane Doe');
  assert.equal(titleModule.formatTeacherDisplayName({ title: 'Mr.', first_name: 'John', last_name: '' }), 'Mr. John');
});

test('signup, profiles, and pending teachers use the shared title contract', () => {
  const signup = read('components/SignupForm.tsx');
  assert.ok(signup.includes('Select title'));
  assert.ok(signup.includes('TEACHER_TITLES.map'));
  assert.ok(signup.includes('title || undefined'));
  assert.ok(signup.includes('`${countryCode}${phoneNumber.trim()}`'));

  const provider = read('app/providers.tsx');
  assert.ok(provider.includes("api.post('/api/v1/auth/signup', buildTeacherSignupPayload"));

  for (const profile of [
    'app/(dashboard)/profile/page.tsx',
    'app/(principal)/principal-profile/page.tsx',
  ]) {
    const profileSource = read(profile);
    assert.ok(profileSource.includes('setTitle(user.title'));
    assert.ok(profileSource.includes('title: title || null'));
  }

  const pendingTeachers = read('components/PrincipalTeachersPage.tsx');
  assert.ok(pendingTeachers.includes('formatTeacherDisplayName(teacher)'));
  assert.ok(pendingTeachers.includes('formatTeacherDisplayName(confirmAction.teacher)'));
});
