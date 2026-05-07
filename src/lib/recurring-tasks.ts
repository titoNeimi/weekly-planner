export const VIRTUAL_ID_PREFIX = "virt_";
export type RecurringTypeValue = "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL";

// Advances a date in place — all arithmetic is UTC to stay consistent with how
// dates are stored (always UTC midnight or UTC time from the task form).
function advanceDate(
  date: Date,
  type: RecurringTypeValue,
  interval: number,
): void {
  switch (type) {
    case "DAILY":
      date.setUTCDate(date.getUTCDate() + interval);
      break;
    case "WEEKLY":
      date.setUTCDate(date.getUTCDate() + interval * 7);
      break;
    case "MONTHLY":
      date.setUTCMonth(date.getUTCMonth() + interval);
      break;
    case "ANNUAL":
      date.setUTCFullYear(date.getUTCFullYear() + interval);
      break;
  }
}

// Bulk-skips a date forward until it reaches `target`, then fine-tunes one step
// at a time. The result is the first occurrence >= target.
function skipAheadTo(
  date: Date,
  type: RecurringTypeValue,
  interval: number,
  target: Date,
): void {
  if (date >= target) return;

  // Bulk skip for DAILY/WEEKLY — avoids iterating thousands of past days.
  if (type === "DAILY" || type === "WEEKLY") {
    const msPerStep =
      type === "DAILY" ? interval * 86_400_000 : interval * 7 * 86_400_000;
    const steps = Math.floor((target.getTime() - date.getTime()) / msPerStep);
    if (steps > 0) {
      if (type === "DAILY")
        date.setUTCDate(date.getUTCDate() + steps * interval);
      else date.setUTCDate(date.getUTCDate() + steps * interval * 7);
    }
  }

  // Fine-tune: advance until we land on or past target.
  while (date < target) advanceDate(date, type, interval);
}

// Generates all occurrence dates from startDate, stopping at endDate or endCount.
export function generateDates(
  type: RecurringTypeValue,
  interval: number,
  startDate: Date,
  endDate?: Date | null,
  endCount?: number | null,
): Date[] {
  const MAX = 365;
  const dates: Date[] = [];
  const current = new Date(startDate);
  const limit = endCount ? Math.min(endCount, MAX) : MAX;

  while (dates.length < limit) {
    if (endDate && current > endDate) break;
    dates.push(new Date(current));
    advanceDate(current, type, interval);
  }

  return dates;
}

// Generates only the occurrences that fall within [fromDate, toDate].
// When endCount is set, it generates from startDate (to respect the total count).
// When only endDate bounds the series, it skips ahead efficiently.
export function generateDatesInRange(
  type: RecurringTypeValue,
  interval: number,
  startDate: Date,
  fromDate: Date,
  toDate: Date,
  endDate?: Date | null,
  endCount?: number | null,
): Date[] {
  const effectiveEnd = endDate && endDate < toDate ? endDate : toDate;

  if (endCount != null) {
    // Must count from origin to respect the total limit.
    const all = generateDates(
      type,
      interval,
      startDate,
      effectiveEnd,
      endCount,
    );
    return all.filter((d) => d >= fromDate);
  }

  // No endCount: skip ahead to the first occurrence in range, then generate forward.
  const current = new Date(startDate);
  skipAheadTo(current, type, interval, fromDate);
  return generateDates(type, interval, current, effectiveEnd, null);
}

export function makeVirtualId(recurringTaskId: string, date: Date): string {
  return `${VIRTUAL_ID_PREFIX}${recurringTaskId}_${date.getTime()}`;
}

// Returns null if `id` is not a virtual ID.
export function parseVirtualId(
  id: string,
): { recurringTaskId: string; date: Date } | null {
  if (!id.startsWith(VIRTUAL_ID_PREFIX)) return null;
  const rest = id.slice(VIRTUAL_ID_PREFIX.length);
  const sep = rest.lastIndexOf("_");
  if (sep === -1) return null;
  const recurringTaskId = rest.slice(0, sep);
  const ms = Number(rest.slice(sep + 1));
  if (!recurringTaskId || isNaN(ms)) return null;
  return { recurringTaskId, date: new Date(ms) };
}
