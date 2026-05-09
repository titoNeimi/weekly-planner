import { prisma } from "@/lib/prisma";
import {
  generateDates,
  generateDatesInRange,
  makeVirtualId,
  type RecurringTypeValue,
} from "@/lib/recurring-tasks";

export interface TaskLike {
  id: string;
  title: string;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  notes: string | null;
  done: boolean;
  date: Date;
  userId: string;
  recurringTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTasksForRange(
  userId: string,
  from: Date,
  to: Date,
): Promise<TaskLike[]> {
  const [realTasks, recurringTasks] = await Promise.all([
    prisma.task.findMany({
      where: { userId, date: { gte: from, lte: to } },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.recurringTask.findMany({
      where: {
        userId,
        startDate: { lte: to },
        OR: [{ endDate: null }, { endDate: { gte: from } }],
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  if (recurringTasks.length === 0) return realTasks;

  const materializedKeys = new Set(
    realTasks
      .filter((t) => t.recurringTaskId !== null)
      .map((t) => `${t.recurringTaskId}_${t.date.getTime()}`),
  );

  const virtualTasks: TaskLike[] = [];

  for (const recurring of recurringTasks) {
    const occurrences = generateDatesInRange(
      recurring.type as RecurringTypeValue,
      recurring.interval,
      recurring.startDate,
      from,
      to,
      recurring.endDate,
      recurring.endCount,
    );

    const deletedMs = new Set(
      recurring.deletedOccurrences.map((d) => d.getTime()),
    );

    for (const date of occurrences) {
      if (materializedKeys.has(`${recurring.id}_${date.getTime()}`)) continue;
      if (deletedMs.has(date.getTime())) continue;

      virtualTasks.push({
        id: makeVirtualId(recurring.id, date),
        title: recurring.title,
        categoryId: recurring.categoryId,
        category: recurring.category,
        notes: recurring.notes,
        done: false,
        date,
        userId,
        recurringTaskId: recurring.id,
        createdAt: recurring.createdAt,
        updatedAt: recurring.updatedAt,
      });
    }
  }

  const all = [...realTasks, ...virtualTasks];
  all.sort((a, b) => a.date.getTime() - b.date.getTime());
  return all;
}

// Returns one virtual instance per active recurring task — the next upcoming
// occurrence that hasn't been deleted or already materialized as a standalone task.
export async function getNextRecurringInstances(
  userId: string,
  from: Date,
): Promise<TaskLike[]> {
  const horizon = new Date(from);
  horizon.setUTCFullYear(horizon.getUTCFullYear() + 1);

  const recurringTasks = await prisma.recurringTask.findMany({
    where: {
      userId,
      startDate: { lte: horizon },
      OR: [{ endDate: null }, { endDate: { gte: from } }],
    },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  const result: TaskLike[] = [];

  for (const recurring of recurringTasks) {
    const deletedMs = new Set(
      recurring.deletedOccurrences.map((d) => d.getTime()),
    );

    // Generate from startDate to horizon respecting endDate/endCount, then
    // find the first occurrence on or after `from` that hasn't been skipped.
    const allDates = generateDates(
      recurring.type as RecurringTypeValue,
      recurring.interval,
      recurring.startDate,
      recurring.endDate ?? horizon,
      recurring.endCount,
    );

    const nextDate = allDates.find(
      (d) => d >= from && !deletedMs.has(d.getTime()),
    );
    if (!nextDate) continue;

    result.push({
      id: makeVirtualId(recurring.id, nextDate),
      title: recurring.title,
      categoryId: recurring.categoryId,
      category: recurring.category,
      notes: recurring.notes,
      done: false,
      date: nextDate,
      userId,
      recurringTaskId: recurring.id,
      createdAt: recurring.createdAt,
      updatedAt: recurring.updatedAt,
    });
  }

  return result;
}
