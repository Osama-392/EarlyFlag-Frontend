/**
 * Parent email templates keyed by student flag category.
 *
 * Placeholder tokens are replaced at render time:
 *   {{STUDENT_NAME}}  – full student name
 *   {{TEACHER_NAME}}  – logged-in teacher's display name
 *   {{DATE}}          – today's date in a readable format
 *
 * Categories:
 *   red         – urgent / high-concern
 *   yellow      – moderate concern / watch-list
 *   super_green – positive recognition / commendation
 *   absent      – notification for absences
 */

export interface EmailTemplate {
  label: string;          // human-readable category label
  body: string;           // the email body with placeholder tokens
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  red: {
    label: 'Red — Urgent Concern',
    body: `Dear Parent/Guardian,

I am writing to inform you of a serious matter involving your child, {{STUDENT_NAME}} , that occurred in my class on {{DATE}}.

During our session, {{STUDENT_NAME}} was involved in {{REASON}}. Due to the nature of this incident, this matter has been escalated and school administration has been notified.

Please be aware that if any further action is required, the administration will be reaching out to you directly to discuss this matter privately and in full detail.

We take the safety, respect, and academic integrity of all students very seriously, and we ask for your full cooperation in addressing this situation promptly. We are committed to working with you and Jordan to ensure this does not continue.

If you have any immediate questions or concerns, please do not hesitate to contact me or the school office.

Respectfully,
{{TEACHER_NAME}}
{{DATE}}`,
  },

  yellow: {
    label: 'Yellow — Moderate Concern',
    body: `Dear Parent/Guardian,

I hope this message finds you well. I am reaching out regarding your child, {{STUDENT_NAME}}, who has been flagged in my class today, {{DATE}}.

During our session, {{STUDENT_NAME}} demonstrated {{REASON}}. While this is not yet a critical concern, I want to ensure we address this together early so it does not develop into a larger issue.

I kindly ask that you take a moment to speak with {{STUDENT_NAME}} about the importance of staying engaged and respectful during class. Reinforcing the value of learning at home makes a tremendous difference, and I truly believe {{STUDENT_NAME}} has the ability to excel.

Please do not hesitate to reach out if you have any questions or would like to schedule a time to speak further. I am here to support {{STUDENT_NAME}}'s success.

Warm regards,
{{TEACHER_NAME}}
{{DATE}}`,
  },

  super_green: {
    label: 'Super Green — Positive Recognition',
    body: `Dear Parent/Guardian,

I am delighted to share some wonderful news with you about your child, {{STUDENT_NAME}}!

During our class on {{DATE}}, {{STUDENT_NAME}} demonstrated {{REASON}}. It was truly a pleasure to witness, and I wanted to make sure you heard about it right away.

Students like {{STUDENT_NAME}} are an inspiration to the entire class, and this kind of positive energy makes a real difference in our learning environment. Please take a moment to celebrate this achievement with {{STUDENT_NAME}} — your encouragement and continued support at home are clearly making an impact.

I look forward to seeing {{STUDENT_NAME}} continue to grow and thrive. Please keep up the wonderful support — it shows!

With appreciation and warm regards,
{{TEACHER_NAME}}
{{DATE}}`,
  },

  absent: {
    label: 'Absence Notice',
    body: `Dear Parent/Guardian,
I hope you are doing well. I am writing to bring to your attention that your child, {{STUDENT_NAME}}, has been absent {{REASON}} as of {{DATE}}.
Regular attendance is essential to your child's academic progress, and I want to make sure {{STUDENT_NAME}} does not fall behind. Missing consecutive classes can make it difficult to keep up with the curriculum and may impact their grades.
If {{STUDENT_NAME}} requires any additional support, I am happy to arrange after-hours tutoring or provide supplemental materials to help them catch up. Please do not hesitate to reach out so we can work together to ensure {{STUDENT_NAME}} maintains the highest standard of achievement.

Kindly let us know if there is anything we can do to assist. We are here to help.

Best regards,
{{TEACHER_NAME}}
{{DATE}}`,
  },

  admin_concern: {
    label: 'Administration — Concern Notice',
    body: `Dear Parent/Guardian of {{STUDENT_NAME}},

I am writing to you directly regarding a matter that requires your attention and partnership.

Over the course of this period, {{STUDENT_NAME}} has been repeatedly noted by their teachers for {{REASON}}. Our teachers take careful note of each student's progress and conduct, and {{STUDENT_NAME}}'s pattern has been brought to my attention as something that warrants a direct conversation with your family.

Among the specific concerns that have been documented:
{{SPECIFIC_CONCERNS}}

I want to be clear that this letter comes from a place of genuine care for {{STUDENT_NAME}}'s success — not as a disciplinary measure, but as an early and important conversation. We believe strongly that when school and home work together, students respond and improve.

I respectfully ask that you:

1. Have a direct conversation with {{STUDENT_NAME}} about the expectations we hold for all students, particularly around respect, active engagement, and complete coursework in their classes.

2. Review homework and daily class assignments together to ensure {{STUDENT_NAME}} remains on track and catches up on missing work.

3. Contact me or {{STUDENT_NAME}}'s teachers so we can coordinate a quick follow-up meeting or check-in plan to monitor progress over the coming weeks.

Thank you for your continued partnership and support in guiding {{STUDENT_NAME}} toward success. Please feel free to reach out via phone or email at your earliest convenience to discuss how we can best support {{STUDENT_NAME}} together.

Sincerely,
Administration 
{{TEACHER_NAME}} 
{{DATE}}`,
  },

  admin_commendation: {
    label: 'Administration — Commendation',
    body: `Dear Parent/Guardian,

We are writing to you from the school administration with some excellent news regarding {{STUDENT_NAME}}.

Over the recent week ending on {{DATE}}, {{STUDENT_NAME}} has demonstrated outstanding performance and engagement. A review of their records highlights {{REASON}}, which is exactly the kind of dedication and positive behavior we strive to cultivate in our student body.

We want to personally commend {{STUDENT_NAME}} for their hard work, and we thank you for your continued support at home. It truly takes a team effort to achieve this level of success.

Please share our congratulations with {{STUDENT_NAME}}, and we look forward to seeing their continued growth!

Warmly,
Administration
{{TEACHER_NAME}}
{{DATE}}`,
  },
};

/**
 * Replace placeholder tokens in a template body with actual values.
 */
export function fillTemplate(
  body: string,
  studentName: string,
  teacherName: string,
  reason: string,
  specificConcerns: string = ''
): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return body
    .replace(/\{\{STUDENT_NAME\}\}/g, studentName)
    .replace(/\{\{TEACHER_NAME\}\}/g, teacherName)
    .replace(/\{\{REASON\}\}/g, reason)
    .replace(/\{\{SPECIFIC_CONCERNS\}\}/g, specificConcerns)
    .replace(/\{\{DATE\}\}/g, today);
}
