export function computeReminderAt(
  date: Date,
  reminderHours: number | null | undefined,
): Date | null {
  if (!reminderHours) return null;
  return new Date(date.getTime() - reminderHours * 60 * 60 * 1000);
}
