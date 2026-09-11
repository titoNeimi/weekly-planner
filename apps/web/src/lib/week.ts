// Helpers for rendering calendars/weeks that can start on either Monday or
// Sunday, driven by the user's `Profile.weekStartsOn` preference.

export type WeekStartsOn = 0 | 1; // 0 = Sunday, 1 = Monday

export function startOfWeekUTC(date: Date, weekStartsOn: WeekStartsOn): Date {
  const day = date.getUTCDay();
  const diff = weekStartsOn === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** Index (0-6) of `date` within a week that starts on `weekStartsOn`. */
export function weekdayIndex(date: Date, weekStartsOn: WeekStartsOn): number {
  const day = date.getUTCDay();
  return weekStartsOn === 1 ? (day + 6) % 7 : day;
}

/** Rotates a Monday-first array (e.g. day names) to start on `weekStartsOn`. */
export function rotateForWeekStart<T>(
  mondayFirst: T[],
  weekStartsOn: WeekStartsOn,
): T[] {
  if (weekStartsOn === 0) return [mondayFirst[6], ...mondayFirst.slice(0, 6)];
  return mondayFirst;
}

/** Builds a full month grid (leading/trailing days included) for a calendar
 * that starts its rows on `weekStartsOn`. */
export function monthGridCells(
  monthStart: Date,
  weekStartsOn: WeekStartsOn,
): Date[] {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const startOffset = weekdayIndex(monthStart, weekStartsOn);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: Date[] = [];
  for (let i = startOffset; i > 0; i--) {
    cells.push(new Date(Date.UTC(year, month, 1 - i)));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(Date.UTC(year, month, i)));
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push(new Date(Date.UTC(year, month + 1, i)));
  }
  return cells;
}
