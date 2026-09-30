export const ABSENCE_REASONS: Record<string, string> = {
  illness: 'Illness', appointment: 'Appointment', sports_dismissal: 'Sports dismissal',
  school_activity: 'School activity', vacation: 'Vacation', absent_other: 'Other',
};
export function absenceReasonCode(label?: string): string | undefined {
  return Object.keys(ABSENCE_REASONS).find(code => ABSENCE_REASONS[code] === label);
}
