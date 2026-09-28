export const TEACHER_TITLES = ['Mr.', 'Miss', 'Mrs.'] as const;

export type TeacherTitle = (typeof TEACHER_TITLES)[number];

export interface TeacherNameParts {
  title?: TeacherTitle | null;
  first_name?: string | null;
  last_name?: string | null;
}

export const formatTeacherDisplayName = (user: TeacherNameParts): string =>
  [user.title, user.first_name, user.last_name].filter(Boolean).join(' ');

export interface TeacherSignupPayloadInput {
  title?: TeacherTitle | null;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  schoolId: string;
}

export const buildTeacherSignupPayload = ({
  title,
  firstName,
  lastName,
  email,
  password,
  phoneNumber,
  schoolId,
}: TeacherSignupPayloadInput) => ({
  ...(title ? { title } : {}),
  first_name: firstName || '',
  last_name: lastName || '',
  email,
  password,
  phone_number: phoneNumber || '',
  school_id: schoolId,
});
